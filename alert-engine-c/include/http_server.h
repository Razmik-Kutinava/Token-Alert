#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#ifdef _WIN32
    // Windows HTTP сервер
    #include <windows.h>
    #include <winhttp.h>
    
    struct MHD_Daemon;
    struct MHD_Connection;
    struct MHD_Response;
    
    #define MHD_HTTP_OK 200
    #define MHD_HTTP_NOT_FOUND 404
    #define MHD_USE_SELECT_INTERNALLY 0
    #define MHD_OPTION_END 0
    #define MHD_RESPMEM_PERSISTENT 0
    #define MHD_RESPMEM_MUST_COPY 1
    
    // Заглушки для MicroHTTPD на Windows
    struct MHD_Daemon* MHD_start_daemon(unsigned int flags, unsigned short port, 
                                       void* apc, void* apc_cls,
                                       void* dh, void* dh_cls, ...);
    void MHD_stop_daemon(struct MHD_Daemon* daemon);
    struct MHD_Response* MHD_create_response_from_buffer(size_t size, void* buffer, int mode);
    void MHD_destroy_response(struct MHD_Response* response);
    int MHD_queue_response(struct MHD_Connection* connection, unsigned int status_code, struct MHD_Response* response);
    int MHD_add_response_header(struct MHD_Response* response, const char* header, const char* value);
#else
    // Unix HTTP сервер
    #include <microhttpd.h>
#endif

#ifdef _WIN32
    // Заглушки для cJSON на Windows (те же что в websocket_server.h)
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
#else
    #include <cjson/cJSON.h>
#endif

#include "alert_engine.h"

#define HTTP_PORT 8090
#define MAX_REQUEST_SIZE 4096
#define MAX_RESPONSE_SIZE 8192

// HTTP методы
typedef enum {
    HTTP_GET = 0,
    HTTP_POST = 1,
    HTTP_PUT = 2,
    HTTP_DELETE = 3,
    HTTP_OPTIONS = 4
} HttpMethod;

// Структура HTTP запроса
typedef struct {
    HttpMethod method;
    char* url;
    char* body;
    char* user_id;
    char* authorization;
    cJSON* json_body;
} HttpRequest;

// Структура HTTP ответа
typedef struct {
    int status_code;
    char* content_type;
    char* body;
    size_t body_size;
} HttpResponse;

// Инициализация и завершение HTTP сервера
int http_server_init(int port);
void http_server_cleanup(void);
bool http_server_is_running(void);
int http_server_start(void);
void http_server_stop(void);

// Основной обработчик запросов
int handle_request(void *cls, struct MHD_Connection *connection,
                  const char *url, const char *method,
                  const char *version, const char *upload_data,
                  size_t *upload_data_size, void **con_cls);

// Обработчики различных endpoints
HttpResponse* handle_alerts_list(HttpRequest* req);
HttpResponse* handle_alerts_create(HttpRequest* req);
HttpResponse* handle_alerts_delete(HttpRequest* req, int alert_id);
HttpResponse* handle_alerts_pause(HttpRequest* req, int alert_id);
HttpResponse* handle_alerts_resume(HttpRequest* req, int alert_id);
HttpResponse* handle_market_data(HttpRequest* req);
HttpResponse* handle_health_check(HttpRequest* req);

// Утилиты для работы с HTTP
HttpRequest* parse_http_request(const char* method, const char* url, 
                               const char* upload_data, size_t upload_data_size);
void free_http_request(HttpRequest* req);
void free_http_response(HttpResponse* resp);

// JSON утилиты
cJSON* alert_to_json(Alert* alert);
cJSON* crypto_price_to_json(CryptoPrice* price);
cJSON* create_error_response(const char* message, int code);
cJSON* create_success_response(const char* message, cJSON* data);

// CORS поддержка
void add_cors_headers(struct MHD_Response* response);
HttpResponse* handle_cors_preflight(void);

// Аутентификация (базовая)
bool authenticate_request(HttpRequest* req);
char* extract_user_id(HttpRequest* req);

#endif // HTTP_SERVER_H