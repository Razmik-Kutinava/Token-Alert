#include "../include/alert_engine.h"
#include "../include/market_client.h"
#include "../include/websocket_server.h"
#include <sqlite3.h>
#include <pthread.h>
#include <signal.h>
#include <unistd.h>

// Глобальные переменения
static AlertManager* g_alert_manager = NULL;
static MarketData* g_market_data = NULL;
static sqlite3* g_database = NULL;
static pthread_mutex_t g_alert_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_mutex_t g_market_mutex = PTHREAD_MUTEX_INITIALIZER;
static bool g_engine_running = false;
static pthread_t g_monitor_thread;
static NotificationCallback g_notification_callback = NULL;

// Внутренние функции
static int init_database(void);
static int load_alerts_from_db(void);
static int save_alert_to_db(Alert* alert);
static int delete_alert_from_db(int alert_id);
static void* alert_monitor_thread(void* arg);
static void signal_handler(int sig);

/**
 * Инициализация Alert Engine
 */
int alert_engine_init(void) {
    alert_log("INFO", "Initializing Alert Engine...");
    
    // Инициализация структур данных
    g_alert_manager = malloc(sizeof(AlertManager));
    if (!g_alert_manager) {
        alert_log("ERROR", "Failed to allocate memory for AlertManager");
        return -1;
    }
    
    g_alert_manager->alerts = malloc(sizeof(Alert) * MAX_ALERTS_PREMIUM);
    g_alert_manager->count = 0;
    g_alert_manager->capacity = MAX_ALERTS_PREMIUM;
    g_alert_manager->last_cleanup = time(NULL);
    
    g_market_data = malloc(sizeof(MarketData));
    if (!g_market_data) {
        alert_log("ERROR", "Failed to allocate memory for MarketData");
        return -1;
    }
    
    g_market_data->prices = malloc(sizeof(CryptoPrice) * MAX_SYMBOLS);
    g_market_data->count = 0;
    g_market_data->capacity = MAX_SYMBOLS;
    g_market_data->last_update = 0;
    g_market_data->is_updating = false;
    
    // Инициализация базы данных
    if (init_database() != 0) {
        alert_log("ERROR", "Failed to initialize database");
        return -1;
    }
    
    // Инициализация market client
    if (market_client_init() != 0) {
        alert_log("ERROR", "Failed to initialize market client");
        return -1;
    }
    
    // Загрузка алертов из базы данных
    if (load_alerts_from_db() != 0) {
        alert_log("WARNING", "Failed to load alerts from database");
    }
    
    // Установка обработчиков сигналов
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Запуск потока мониторинга
    g_engine_running = true;
    if (pthread_create(&g_monitor_thread, NULL, alert_monitor_thread, NULL) != 0) {
        alert_log("ERROR", "Failed to create monitor thread");
        return -1;
    }
    
    alert_log("INFO", "Alert Engine initialized successfully");
    return 0;
}

/**
 * Завершение работы Alert Engine
 */
void alert_engine_cleanup(void) {
    alert_log("INFO", "Shutting down Alert Engine...");
    
    g_engine_running = false;
    
    // Ждем завершения потока мониторинга
    if (g_monitor_thread) {
        pthread_join(g_monitor_thread, NULL);
    }
    
    // Освобождение памяти
    if (g_alert_manager) {
        if (g_alert_manager->alerts) {
            free(g_alert_manager->alerts);
        }
        free(g_alert_manager);
        g_alert_manager = NULL;
    }
    
    if (g_market_data) {
        if (g_market_data->prices) {
            free(g_market_data->prices);
        }
        free(g_market_data);
        g_market_data = NULL;
    }
    
    // Закрытие базы данных
    if (g_database) {
        sqlite3_close(g_database);
        g_database = NULL;
    }
    
    // Завершение market client
    market_client_cleanup();
    
    alert_log("INFO", "Alert Engine shutdown complete");
}

/**
 * Создание нового алерта
 */
int alert_create(const char* user_id, const char* symbol, AlertType type, 
                double target_value, UserTier user_tier) {
    if (!user_id || !symbol) {
        alert_log("ERROR", "Invalid parameters for alert creation");
        return -1;
    }
    
    pthread_mutex_lock(&g_alert_mutex);
    
    // Проверка лимитов для пользователя
    int user_alert_count = 0;
    for (int i = 0; i < g_alert_manager->count; i++) {
        if (strcmp(g_alert_manager->alerts[i].user_id, user_id) == 0 &&
            g_alert_manager->alerts[i].status != ALERT_STATUS_INACTIVE) {
            user_alert_count++;
        }
    }
    
    int max_alerts = get_max_alerts_for_tier(user_tier);
    if (user_alert_count >= max_alerts) {
        pthread_mutex_unlock(&g_alert_mutex);
        alert_log("WARNING", "User alert limit exceeded");
        return -2; // Превышен лимит алертов
    }
    
    // Проверка capacity
    if (g_alert_manager->count >= g_alert_manager->capacity) {
        pthread_mutex_unlock(&g_alert_mutex);
        alert_log("ERROR", "Alert manager capacity exceeded");
        return -3;
    }
    
    // Создание нового алерта
    Alert* alert = &g_alert_manager->alerts[g_alert_manager->count];
    alert->id = g_alert_manager->count + 1 + (int)(time(NULL) % 1000);
    strncpy(alert->user_id, user_id, sizeof(alert->user_id) - 1);
    strncpy(alert->symbol, symbol, sizeof(alert->symbol) - 1);
    alert->type = type;
    alert->target_value = target_value;
    alert->current_value = 0.0;
    alert->status = ALERT_STATUS_ACTIVE;
    alert->created_at = time(NULL);
    alert->last_triggered = 0;
    alert->last_checked = 0;
    alert->trigger_count = 0;
    alert->is_repeatable = true;
    alert->cooldown_minutes = 60; // По умолчанию 1 час cooldown
    alert->required_tier = user_tier;
    
    // Формирование сообщения
    snprintf(alert->message, sizeof(alert->message), 
             "Alert: %s %s %.2f", 
             symbol, 
             (type == ALERT_PRICE_ABOVE) ? "above" : "below", 
             target_value);
    
    g_alert_manager->count++;
    
    // Сохранение в базу данных
    int result = save_alert_to_db(alert);
    
    pthread_mutex_unlock(&g_alert_mutex);
    
    if (result == 0) {
        alert_log("INFO", "Alert created successfully");
        
        // Уведомление через WebSocket
        WSMessage* ws_msg = ws_create_status_message("Alert created");
        ws_send_to_user(user_id, ws_msg);
        ws_free_message(ws_msg);
        
        return alert->id;
    } else {
        alert_log("ERROR", "Failed to save alert to database");
        return -4;
    }
}

/**
 * Удаление алерта
 */
int alert_delete(int alert_id, const char* user_id) {
    if (!user_id) {
        return -1;
    }
    
    pthread_mutex_lock(&g_alert_mutex);
    
    for (int i = 0; i < g_alert_manager->count; i++) {
        Alert* alert = &g_alert_manager->alerts[i];
        if (alert->id == alert_id && strcmp(alert->user_id, user_id) == 0) {
            alert->status = ALERT_STATUS_INACTIVE;
            
            int result = delete_alert_from_db(alert_id);
            pthread_mutex_unlock(&g_alert_mutex);
            
            if (result == 0) {
                alert_log("INFO", "Alert deleted successfully");
                
                // Уведомление через WebSocket
                WSMessage* ws_msg = ws_create_status_message("Alert deleted");
                ws_send_to_user(user_id, ws_msg);
                ws_free_message(ws_msg);
                
                return 0;
            } else {
                alert_log("ERROR", "Failed to delete alert from database");
                return -2;
            }
        }
    }
    
    pthread_mutex_unlock(&g_alert_mutex);
    alert_log("WARNING", "Alert not found for deletion");
    return -3;
}

/**
 * Проверка всех алертов
 */
int alert_check_all(void) {
    if (!g_alert_manager || !g_market_data) {
        return -1;
    }
    
    pthread_mutex_lock(&g_alert_mutex);
    pthread_mutex_lock(&g_market_mutex);
    
    int triggered_count = 0;
    time_t current_time = time(NULL);
    
    for (int i = 0; i < g_alert_manager->count; i++) {
        Alert* alert = &g_alert_manager->alerts[i];
        
        if (alert->status != ALERT_STATUS_ACTIVE) {
            continue;
        }
        
        // Проверка cooldown
        if (alert->last_triggered > 0) {
            time_t cooldown_seconds = alert->cooldown_minutes * 60;
            if (current_time - alert->last_triggered < cooldown_seconds) {
                continue;
            }
        }
        
        // Поиск данных о цене
        CryptoPrice* price = NULL;
        for (int j = 0; j < g_market_data->count; j++) {
            if (strcmp(g_market_data->prices[j].symbol, alert->symbol) == 0) {
                price = &g_market_data->prices[j];
                break;
            }
        }
        
        if (!price || !price->is_valid) {
            continue;
        }
        
        // Проверка условия
        if (alert_check_condition(alert, price)) {
            alert->last_triggered = current_time;
            alert->trigger_count++;
            alert->current_value = price->current_price;
            
            // Отправка уведомления
            alert_send_notification(alert, price);
            
            triggered_count++;
            
            alert_log("INFO", "Alert triggered");
        }
        
        alert->last_checked = current_time;
    }
    
    pthread_mutex_unlock(&g_market_mutex);
    pthread_mutex_unlock(&g_alert_mutex);
    
    return triggered_count;
}

/**
 * Проверка условия алерта
 */
bool alert_check_condition(Alert* alert, CryptoPrice* price) {
    if (!alert || !price) {
        return false;
    }
    
    switch (alert->type) {
        case ALERT_PRICE_ABOVE:
            return price->current_price >= alert->target_value;
            
        case ALERT_PRICE_BELOW:
            return price->current_price <= alert->target_value;
            
        case ALERT_PRICE_CHANGE_PERCENT:
            return fabs(price->price_change_percent_24h) >= alert->target_value;
            
        case ALERT_VOLUME_SPIKE:
            // Простая логика для spike - объем больше целевого значения
            return price->volume_24h >= alert->target_value;
            
        case ALERT_RSI_OVERSOLD:
            return price->rsi_14 <= alert->target_value;
            
        case ALERT_RSI_OVERBOUGHT:
            return price->rsi_14 >= alert->target_value;
            
        default:
            return false;
    }
}

/**
 * Обновление рыночных данных
 */
int market_data_update(void) {
    if (!g_market_data) {
        return -1;
    }
    
    pthread_mutex_lock(&g_market_mutex);
    
    // Проверка времени последнего обновления
    time_t current_time = time(NULL);
    if (current_time - g_market_data->last_update < API_UPDATE_INTERVAL) {
        pthread_mutex_unlock(&g_market_mutex);
        return 0; // Еще рано обновлять
    }
    
    if (g_market_data->is_updating) {
        pthread_mutex_unlock(&g_market_mutex);
        return 0; // Уже обновляется
    }
    
    g_market_data->is_updating = true;
    
    // Создаем список символов для запроса
    char symbols_list[1024] = "";
    bool first = true;
    
    for (int i = 0; i < SUPPORTED_SYMBOLS_COUNT && i < MAX_SYMBOLS; i++) {
        if (!first) {
            strcat(symbols_list, ",");
        }
        strcat(symbols_list, SUPPORTED_SYMBOLS[i]);
        first = false;
    }
    
    pthread_mutex_unlock(&g_market_mutex);
    
    // Выполняем запрос к API
    APIResponse* response = fetch_market_data(symbols_list);
    
    pthread_mutex_lock(&g_market_mutex);
    
    if (response && response->success) {
        // Парсим ответ
        int parsed_count = parse_market_data_response(response, g_market_data->prices, g_market_data->capacity);
        
        if (parsed_count > 0) {
            g_market_data->count = parsed_count;
            g_market_data->last_update = current_time;
            
            alert_log("INFO", "Market data updated successfully");
            
            // Уведомление через WebSocket о обновлении данных
            WSMessage* ws_msg = ws_create_market_update_message(g_market_data->prices, g_market_data->count);
            ws_broadcast_message(ws_msg);
            ws_free_message(ws_msg);
        } else {
            alert_log("ERROR", "Failed to parse market data response");
        }
    } else {
        alert_log("ERROR", "Failed to fetch market data");
    }
    
    g_market_data->is_updating = false;
    
    pthread_mutex_unlock(&g_market_mutex);
    
    if (response) {
        free_api_response(response);
    }
    
    return 0;
}

/**
 * Поток мониторинга алертов
 */
static void* alert_monitor_thread(void* arg) {
    alert_log("INFO", "Alert monitor thread started");
    
    while (g_engine_running) {
        // Обновление рыночных данных
        market_data_update();
        
        // Проверка алертов
        int triggered = alert_check_all();
        if (triggered > 0) {
            char log_msg[256];
            snprintf(log_msg, sizeof(log_msg), "Triggered %d alerts", triggered);
            alert_log("INFO", log_msg);
        }
        
        // Пауза между проверками
        sleep(API_UPDATE_INTERVAL);
    }
    
    alert_log("INFO", "Alert monitor thread stopped");
    return NULL;
}

/**
 * Инициализация базы данных
 */
static int init_database(void) {
    int rc = sqlite3_open("alerts.db", &g_database);
    if (rc) {
        alert_log("ERROR", "Cannot open database");
        return -1;
    }
    
    // Создание таблицы алертов
    const char* create_table_sql = 
        "CREATE TABLE IF NOT EXISTS alerts ("
        "id INTEGER PRIMARY KEY,"
        "user_id TEXT NOT NULL,"
        "symbol TEXT NOT NULL,"
        "type INTEGER NOT NULL,"
        "target_value REAL NOT NULL,"
        "status INTEGER NOT NULL,"
        "created_at INTEGER NOT NULL,"
        "last_triggered INTEGER,"
        "trigger_count INTEGER DEFAULT 0,"
        "message TEXT,"
        "is_repeatable INTEGER DEFAULT 1,"
        "cooldown_minutes INTEGER DEFAULT 60,"
        "required_tier INTEGER DEFAULT 0"
        ");";
    
    char* err_msg = 0;
    rc = sqlite3_exec(g_database, create_table_sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        alert_log("ERROR", "SQL error");
        sqlite3_free(err_msg);
        return -1;
    }
    
    return 0;
}

/**
 * Отправка уведомления
 */
void alert_send_notification(Alert* alert, CryptoPrice* price) {
    if (!alert || !price) {
        return;
    }
    
    // Callback функция
    if (g_notification_callback) {
        g_notification_callback(alert, price);
    }
    
    // WebSocket уведомление
    WSMessage* ws_msg = ws_create_alert_triggered_message(alert, price);
    ws_send_to_user(alert->user_id, ws_msg);
    ws_free_message(ws_msg);
    
    // Логирование
    char log_msg[512];
    snprintf(log_msg, sizeof(log_msg), 
             "Alert triggered: %s %s %.2f (current: %.2f)", 
             alert->symbol, 
             (alert->type == ALERT_PRICE_ABOVE) ? "above" : "below",
             alert->target_value, 
             price->current_price);
    alert_log("ALERT", log_msg);
}

/**
 * Установка callback для уведомлений
 */
void alert_set_notification_callback(NotificationCallback callback) {
    g_notification_callback = callback;
}

/**
 * Логирование
 */
void alert_log(const char* level, const char* message) {
    time_t now = time(NULL);
    char* time_str = ctime(&now);
    time_str[strlen(time_str) - 1] = '\0'; // Убираем \n
    
    printf("[%s] [%s] %s\n", time_str, level, message);
    fflush(stdout);
}

/**
 * Обработчик сигналов
 */
static void signal_handler(int sig) {
    char log_msg[64];
    snprintf(log_msg, sizeof(log_msg), "Received signal %d, shutting down...", sig);
    alert_log("INFO", log_msg);
    
    g_engine_running = false;
}

/**
 * Вспомогательные функции
 */
bool is_user_tier_sufficient(UserTier required, UserTier actual) {
    return actual >= required;
}

int get_max_alerts_for_tier(UserTier tier) {
    switch (tier) {
        case USER_FREE:
            return MAX_ALERTS_FREE;
        case USER_PREMIUM:
            return MAX_ALERTS_PREMIUM;
        default:
            return MAX_ALERTS_FREE;
    }
}