#ifndef ALERT_ENGINE_H
#define ALERT_ENGINE_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdbool.h>

// Максимальные значения
#define MAX_SYMBOL_LEN 16
#define MAX_NAME_LEN 64
#define MAX_ALERTS_FREE 100
#define MAX_ALERTS_PREMIUM 1000
#define MAX_MESSAGE_LEN 256
#define MAX_URL_LEN 512
#define API_UPDATE_INTERVAL 30

// Типы алертов
typedef enum {
    ALERT_PRICE_ABOVE = 0,
    ALERT_PRICE_BELOW = 1,
    ALERT_PRICE_CHANGE_PERCENT = 2,
    ALERT_VOLUME_SPIKE = 3,
    ALERT_RSI_OVERSOLD = 4,
    ALERT_RSI_OVERBOUGHT = 5,
    ALERT_PORTFOLIO_VALUE = 6
} AlertType;

// Статусы алертов
typedef enum {
    ALERT_STATUS_INACTIVE = 0,
    ALERT_STATUS_ACTIVE = 1,
    ALERT_STATUS_TRIGGERED = 2,
    ALERT_STATUS_PAUSED = 3
} AlertStatus;

// Уровни подписки пользователя
typedef enum {
    USER_FREE = 0,
    USER_PREMIUM = 1
} UserTier;

// Структура данных о цене криптовалюты
typedef struct {
    char symbol[MAX_SYMBOL_LEN];
    char name[MAX_NAME_LEN];
    double current_price;
    double price_change_24h;
    double price_change_percent_24h;
    double volume_24h;
    double market_cap;
    time_t last_updated;
    double rsi_14;
    bool is_valid;
} CryptoPrice;

// Структура алерта
typedef struct {
    int id;
    char user_id[64];
    char symbol[MAX_SYMBOL_LEN];
    AlertType type;
    double target_value;
    double current_value;
    AlertStatus status;
    time_t created_at;
    time_t last_triggered;
    time_t last_checked;
    int trigger_count;
    char message[MAX_MESSAGE_LEN];
    bool is_repeatable;
    int cooldown_minutes;
    UserTier required_tier;
} Alert;

// Структура для управления алертами
typedef struct {
    Alert* alerts;
    int count;
    int capacity;
    time_t last_cleanup;
} AlertManager;

// Структура для рыночных данных
typedef struct {
    CryptoPrice* prices;
    int count;
    int capacity;
    time_t last_update;
    bool is_updating;
} MarketData;

// Основные функции Alert Engine
int alert_engine_init(void);
void alert_engine_cleanup(void);

// Управление алертами
int alert_create(const char* user_id, const char* symbol, AlertType type, 
                double target_value, UserTier user_tier);
int alert_delete(int alert_id, const char* user_id);
int alert_pause(int alert_id, const char* user_id);
int alert_resume(int alert_id, const char* user_id);
Alert* alert_get_by_id(int alert_id);
Alert* alert_get_user_alerts(const char* user_id, int* count);

// Проверка алертов
int alert_check_all(void);
int alert_check_symbol(const char* symbol);
bool alert_check_condition(Alert* alert, CryptoPrice* price);

// Управление рыночными данными
int market_data_update(void);
CryptoPrice* market_data_get_price(const char* symbol);
int market_data_get_all(CryptoPrice** prices);

// Вспомогательные функции
double calculate_rsi(double* prices, int count, int period);
bool is_user_tier_sufficient(UserTier required, UserTier actual);
int get_max_alerts_for_tier(UserTier tier);
void alert_log(const char* level, const char* message);

// Уведомления
typedef void (*NotificationCallback)(Alert* alert, CryptoPrice* price);
void alert_set_notification_callback(NotificationCallback callback);
void alert_send_notification(Alert* alert, CryptoPrice* price);

#endif // ALERT_ENGINE_H