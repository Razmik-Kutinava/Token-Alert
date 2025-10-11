#ifndef WEBSOCKET_SERVER_H
#define WEBSOCKET_SERVER_H

#ifdef _WIN32
    // Windows заглушки для WebSocket
    #include <windows.h>
    
    struct lws;
    enum lws_callback_reasons { LWS_CALLBACK_ESTABLISHED = 0 };
    
    #define LWS_PRE 0
    #define LWS_WRITE_TEXT 0
#else
    // Unix WebSocket
    #include <libwebsockets.h>
#endif

#ifdef _WIN32
    // Windows заглушки для cJSON
    typedef struct cJSON {
        struct cJSON *next;
        struct cJSON *prev;
        struct cJSON *child;
        int type;
        char *valuestring;
        double valuedouble;
        int valueint;
        char *string;
    } cJSON;
    
    cJSON* cJSON_CreateObject(void);
    cJSON* cJSON_CreateArray(void);
    void cJSON_Delete(cJSON *c);
    void cJSON_AddStringToObject(cJSON * const object, const char * const name, const char * const string);
    void cJSON_AddNumberToObject(cJSON * const object, const char * const name, const double number);
    void cJSON_AddBoolToObject(cJSON * const object, const char * const name, const int boolean);
    void cJSON_AddItemToObject(cJSON *object, const char *string, cJSON *item);
    void cJSON_AddItemToArray(cJSON *array, cJSON *item);
    char* cJSON_Print(const cJSON *item);
#else
    #include <cjson/cJSON.h>
#endif

#include "alert_engine.h"

#define WS_PORT 8081
#define MAX_WS_CONNECTIONS 1000
#define WS_BUFFER_SIZE 4096

// Протоколы WebSocket
#define WS_PROTOCOL_ALERTS "alerts-protocol"

// Типы WebSocket сообщений
typedef enum {
    WS_MSG_ALERT_TRIGGERED = 0,
    WS_MSG_MARKET_UPDATE = 1,
    WS_MSG_ALERT_CREATED = 2,
    WS_MSG_ALERT_DELETED = 3,
    WS_MSG_CONNECTION_STATUS = 4,
    WS_MSG_ERROR = 5
} WebSocketMessageType;

// Структура WebSocket соединения
typedef struct ws_connection {
    struct lws* wsi;
    char user_id[64];
    bool is_authenticated;
    time_t connected_at;
    int message_count;
    struct ws_connection* next;
} WSConnection;

// Структура WebSocket сообщения
typedef struct {
    WebSocketMessageType type;
    char* user_id;
    cJSON* data;
    time_t timestamp;
} WSMessage;

// Менеджер WebSocket соединений
typedef struct {
    WSConnection* connections;
    int connection_count;
    struct lws_context* context;
    bool is_running;
} WSManager;

// Инициализация и завершение WebSocket сервера
int ws_server_init(int port);
void ws_server_cleanup(void);
int ws_server_start(void);
void ws_server_stop(void);
void ws_server_run(void);

// Управление соединениями
int ws_add_connection(struct lws* wsi, const char* user_id);
int ws_remove_connection(struct lws* wsi);
WSConnection* ws_find_connection(struct lws* wsi);
WSConnection* ws_find_user_connections(const char* user_id, int* count);

// Отправка сообщений
int ws_send_to_user(const char* user_id, WSMessage* message);
int ws_send_to_connection(WSConnection* conn, WSMessage* message);
int ws_broadcast_message(WSMessage* message);

// Создание сообщений
WSMessage* ws_create_alert_triggered_message(Alert* alert, CryptoPrice* price);
WSMessage* ws_create_market_update_message(CryptoPrice* prices, int count);
WSMessage* ws_create_error_message(const char* error_msg);
WSMessage* ws_create_status_message(const char* status);

// Утилиты
void ws_free_message(WSMessage* message);
cJSON* ws_message_to_json(WSMessage* message);
char* ws_serialize_message(WSMessage* message);

// Callback функции libwebsockets
int ws_callback_alerts(struct lws *wsi, enum lws_callback_reasons reason,
                      void *user, void *in, size_t len);

// Интеграция с Alert Engine
void ws_on_alert_triggered(Alert* alert, CryptoPrice* price);
void ws_on_market_data_updated(CryptoPrice* prices, int count);

#endif // WEBSOCKET_SERVER_H