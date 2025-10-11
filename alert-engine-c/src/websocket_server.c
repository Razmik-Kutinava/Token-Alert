#include "../include/websocket_server.h"
#include "../include/alert_engine.h"
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
// Windows заглушки для cJSON
cJSON* cJSON_CreateObject(void) {
    cJSON* obj = malloc(sizeof(cJSON));
    if (obj) {
        memset(obj, 0, sizeof(cJSON));
        obj->type = 6; // cJSON_Object
    }
    return obj;
}

cJSON* cJSON_CreateArray(void) {
    cJSON* arr = malloc(sizeof(cJSON));
    if (arr) {
        memset(arr, 0, sizeof(cJSON));
        arr->type = 5; // cJSON_Array
    }
    return arr;
}

void cJSON_Delete(cJSON *c) {
    if (c) {
        if (c->valuestring) free(c->valuestring);
        if (c->string) free(c->string);
        free(c);
    }
}

void cJSON_AddStringToObject(cJSON * const object, const char * const name, const char * const string) {
    // Простая заглушка
    (void)object; (void)name; (void)string;
}

void cJSON_AddNumberToObject(cJSON * const object, const char * const name, const double number) {
    // Простая заглушка
    (void)object; (void)name; (void)number;
}

void cJSON_AddBoolToObject(cJSON * const object, const char * const name, const int boolean) {
    // Простая заглушка
    (void)object; (void)name; (void)boolean;
}

void cJSON_AddItemToObject(cJSON *object, const char *string, cJSON *item) {
    // Простая заглушка
    (void)object; (void)string; (void)item;
}

void cJSON_AddItemToArray(cJSON *array, cJSON *item) {
    // Простая заглушка
    (void)array; (void)item;
}

char* cJSON_Print(const cJSON *item) {
    // Простая заглушка
    (void)item;
    return strdup("{\"mock\":\"data\"}");
}
#endif

// Глобальный менеджер WebSocket соединений
static WSManager* g_ws_manager = NULL;
static bool g_ws_initialized = false;

/**
 * Инициализация WebSocket сервера
 */
int ws_server_init(int port) {
    if (g_ws_initialized) {
        return 0;
    }

    g_ws_manager = malloc(sizeof(WSManager));
    if (!g_ws_manager) {
        alert_log("ERROR", "Failed to allocate WebSocket manager");
        return -1;
    }

    g_ws_manager->connections = NULL;
    g_ws_manager->connection_count = 0;
    g_ws_manager->context = NULL;
    g_ws_manager->is_running = false;

    // Здесь должна быть инициализация libwebsockets
    // Пока используем заглушку
    alert_log("INFO", "WebSocket server initialized (stub mode)");
    g_ws_initialized = true;
    
    return 0;
}

/**
 * Завершение работы WebSocket сервера
 */
void ws_server_cleanup(void) {
    if (!g_ws_initialized || !g_ws_manager) {
        return;
    }

    // Освобождение соединений
    WSConnection* conn = g_ws_manager->connections;
    while (conn) {
        WSConnection* next = conn->next;
        free(conn);
        conn = next;
    }

    free(g_ws_manager);
    g_ws_manager = NULL;
    g_ws_initialized = false;
    
    alert_log("INFO", "WebSocket server cleanup complete");
}

/**
 * Создание сообщения о статусе
 */
WSMessage* ws_create_status_message(const char* status) {
    if (!status) {
        return NULL;
    }

    WSMessage* msg = malloc(sizeof(WSMessage));
    if (!msg) {
        return NULL;
    }

    msg->type = WS_MSG_CONNECTION_STATUS;
    msg->user_id = NULL;
    msg->data = cJSON_CreateObject();
    msg->timestamp = time(NULL);

    if (msg->data) {
        cJSON_AddStringToObject(msg->data, "status", status);
        cJSON_AddNumberToObject(msg->data, "timestamp", msg->timestamp);
    }

    return msg;
}

/**
 * Создание сообщения о триггере алерта
 */
WSMessage* ws_create_alert_triggered_message(Alert* alert, CryptoPrice* price) {
    if (!alert || !price) {
        return NULL;
    }

    WSMessage* msg = malloc(sizeof(WSMessage));
    if (!msg) {
        return NULL;
    }

    msg->type = WS_MSG_ALERT_TRIGGERED;
    msg->user_id = strdup(alert->user_id);
    msg->data = cJSON_CreateObject();
    msg->timestamp = time(NULL);

    if (msg->data) {
        cJSON* alert_obj = cJSON_CreateObject();
        cJSON_AddNumberToObject(alert_obj, "id", alert->id);
        cJSON_AddStringToObject(alert_obj, "symbol", alert->symbol);
        cJSON_AddNumberToObject(alert_obj, "type", alert->type);
        cJSON_AddNumberToObject(alert_obj, "target_value", alert->target_value);
        cJSON_AddStringToObject(alert_obj, "message", alert->message);
        
        cJSON* price_obj = cJSON_CreateObject();
        cJSON_AddStringToObject(price_obj, "symbol", price->symbol);
        cJSON_AddNumberToObject(price_obj, "current_price", price->current_price);
        cJSON_AddNumberToObject(price_obj, "price_change_24h", price->price_change_24h);
        cJSON_AddNumberToObject(price_obj, "price_change_percent_24h", price->price_change_percent_24h);
        
        cJSON_AddItemToObject(msg->data, "alert", alert_obj);
        cJSON_AddItemToObject(msg->data, "price", price_obj);
        cJSON_AddNumberToObject(msg->data, "timestamp", msg->timestamp);
    }

    return msg;
}

/**
 * Создание сообщения об обновлении рынка
 */
WSMessage* ws_create_market_update_message(CryptoPrice* prices, int count) {
    if (!prices || count <= 0) {
        return NULL;
    }

    WSMessage* msg = malloc(sizeof(WSMessage));
    if (!msg) {
        return NULL;
    }

    msg->type = WS_MSG_MARKET_UPDATE;
    msg->user_id = NULL;
    msg->data = cJSON_CreateObject();
    msg->timestamp = time(NULL);

    if (msg->data) {
        cJSON* prices_array = cJSON_CreateArray();
        
        for (int i = 0; i < count && i < 10; i++) { // Ограничиваем количество для производительности
            cJSON* price_obj = cJSON_CreateObject();
            cJSON_AddStringToObject(price_obj, "symbol", prices[i].symbol);
            cJSON_AddNumberToObject(price_obj, "current_price", prices[i].current_price);
            cJSON_AddNumberToObject(price_obj, "price_change_24h", prices[i].price_change_24h);
            cJSON_AddNumberToObject(price_obj, "price_change_percent_24h", prices[i].price_change_percent_24h);
            cJSON_AddNumberToObject(price_obj, "volume_24h", prices[i].volume_24h);
            cJSON_AddBoolToObject(price_obj, "is_valid", prices[i].is_valid);
            
            cJSON_AddItemToArray(prices_array, price_obj);
        }
        
        cJSON_AddItemToObject(msg->data, "prices", prices_array);
        cJSON_AddNumberToObject(msg->data, "count", count);
        cJSON_AddNumberToObject(msg->data, "timestamp", msg->timestamp);
    }

    return msg;
}

/**
 * Отправка сообщения пользователю
 */
int ws_send_to_user(const char* user_id, WSMessage* message) {
    if (!user_id || !message) {
        return -1;
    }

    // В реальной реализации здесь был бы поиск соединения пользователя
    // и отправка через WebSocket
    
    char* json_string = NULL;
    if (message->data) {
        json_string = cJSON_Print(message->data);
    }
    
    char log_msg[512];
    snprintf(log_msg, sizeof(log_msg), 
             "WebSocket message to user %s: %s", 
             user_id, 
             json_string ? json_string : "null");
    alert_log("DEBUG", log_msg);
    
    if (json_string) {
        free(json_string);
    }
    
    return 0;
}

/**
 * Широковещательная отправка сообщения
 */
int ws_broadcast_message(WSMessage* message) {
    if (!message) {
        return -1;
    }

    // В реальной реализации здесь была бы отправка всем подключенным клиентам
    
    char* json_string = NULL;
    if (message->data) {
        json_string = cJSON_Print(message->data);
    }
    
    char log_msg[512];
    snprintf(log_msg, sizeof(log_msg), 
             "WebSocket broadcast: %s", 
             json_string ? json_string : "null");
    alert_log("DEBUG", log_msg);
    
    if (json_string) {
        free(json_string);
    }
    
    return 0;
}

/**
 * Освобождение памяти сообщения
 */
void ws_free_message(WSMessage* message) {
    if (!message) {
        return;
    }

    if (message->user_id) {
        free(message->user_id);
    }
    
    if (message->data) {
        cJSON_Delete(message->data);
    }
    
    free(message);
}

/**
 * Добавление нового соединения
 */
int ws_add_connection(struct lws* wsi, const char* user_id) {
    if (!wsi || !user_id || !g_ws_manager) {
        return -1;
    }

    WSConnection* conn = malloc(sizeof(WSConnection));
    if (!conn) {
        return -1;
    }

    conn->wsi = wsi;
    strncpy(conn->user_id, user_id, sizeof(conn->user_id) - 1);
    conn->user_id[sizeof(conn->user_id) - 1] = '\0';
    conn->is_authenticated = true;
    conn->connected_at = time(NULL);
    conn->message_count = 0;
    conn->next = g_ws_manager->connections;

    g_ws_manager->connections = conn;
    g_ws_manager->connection_count++;

    char log_msg[128];
    snprintf(log_msg, sizeof(log_msg), "WebSocket connection added for user: %s", user_id);
    alert_log("INFO", log_msg);

    return 0;
}

/**
 * Удаление соединения
 */
int ws_remove_connection(struct lws* wsi) {
    if (!wsi || !g_ws_manager) {
        return -1;
    }

    WSConnection* prev = NULL;
    WSConnection* current = g_ws_manager->connections;

    while (current) {
        if (current->wsi == wsi) {
            if (prev) {
                prev->next = current->next;
            } else {
                g_ws_manager->connections = current->next;
            }

            char log_msg[128];
            snprintf(log_msg, sizeof(log_msg), "WebSocket connection removed for user: %s", current->user_id);
            alert_log("INFO", log_msg);

            free(current);
            g_ws_manager->connection_count--;
            return 0;
        }
        prev = current;
        current = current->next;
    }

    return -1;
}