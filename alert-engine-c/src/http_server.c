#include "../include/http_server.h"
#include "../include/alert_engine.h"
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
// Windows заглушки для MicroHTTPD
struct MHD_Daemon* MHD_start_daemon(unsigned int flags, unsigned short port, 
                                   void* apc, void* apc_cls,
                                   void* dh, void* dh_cls, ...) {
    (void)flags; (void)port; (void)apc; (void)apc_cls; (void)dh; (void)dh_cls;
    // Возвращаем фиктивный указатель
    return (struct MHD_Daemon*)0x1;
}

void MHD_stop_daemon(struct MHD_Daemon* daemon) {
    (void)daemon;
}

struct MHD_Response* MHD_create_response_from_buffer(size_t size, void* buffer, int mode) {
    (void)size; (void)buffer; (void)mode;
    return (struct MHD_Response*)0x1;
}

void MHD_destroy_response(struct MHD_Response* response) {
    (void)response;
}

int MHD_queue_response(struct MHD_Connection* connection, unsigned int status_code, struct MHD_Response* response) {
    (void)connection; (void)status_code; (void)response;
    return 1;
}

int MHD_add_response_header(struct MHD_Response* response, const char* header, const char* value) {
    (void)response; (void)header; (void)value;
    return 1;
}
#endif

// Глобальные переменные HTTP сервера
static struct MHD_Daemon* g_http_daemon = NULL;
static bool g_http_running = false;

/**
 * Ответ на HTTP запрос
 */
static int answer_to_connection(void *cls, struct MHD_Connection *connection,
                              const char *url, const char *method,
                              const char *version, const char *upload_data,
                              size_t *upload_data_size, void **con_cls) {
    (void)cls;
    (void)version;
    (void)upload_data;
    (void)upload_data_size;
    (void)con_cls;

#ifdef _WIN32
    // Windows заглушка
    (void)connection; (void)url; (void)method;
    return 1;
#else
    struct MHD_Response *response;
    int ret;

    // CORS headers
    const char* cors_headers = 
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
        "Content-Type: application/json\r\n";

    // Handle preflight OPTIONS request
    if (strcmp(method, "OPTIONS") == 0) {
        response = MHD_create_response_from_buffer(0, "", MHD_RESPMEM_PERSISTENT);
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        MHD_add_response_header(response, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        MHD_add_response_header(response, "Access-Control-Allow-Headers", "Content-Type, Authorization");
        ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
        MHD_destroy_response(response);
        return ret;
    }

    // Basic API routing
    if (strcmp(url, "/api/health") == 0) {
        const char* health_response = "{\"status\":\"ok\",\"service\":\"alert-engine\"}";
        response = MHD_create_response_from_buffer(strlen(health_response), 
                                                 (void*)health_response, 
                                                 MHD_RESPMEM_MUST_COPY);
    } else if (strncmp(url, "/api/alerts", 11) == 0) {
        // Alerts API placeholder
        char alerts_response[256];
        snprintf(alerts_response, sizeof(alerts_response), 
                "{\"message\":\"Alerts API endpoint\",\"url\":\"%s\"}", url);
        response = MHD_create_response_from_buffer(strlen(alerts_response), 
                                                 (void*)alerts_response, 
                                                 MHD_RESPMEM_MUST_COPY);
    } else {
        // 404 Not Found
        const char* not_found = "{\"error\":\"Not Found\",\"status\":404}";
        response = MHD_create_response_from_buffer(strlen(not_found), 
                                                 (void*)not_found, 
                                                 MHD_RESPMEM_MUST_COPY);
        MHD_add_response_header(response, "Content-Type", "application/json");
        ret = MHD_queue_response(connection, MHD_HTTP_NOT_FOUND, response);
        MHD_destroy_response(response);
        return ret;
    }

    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
    MHD_destroy_response(response);

    return ret;
#endif
}

/**
 * Инициализация HTTP сервера
 */
int http_server_init(int port) {
    if (g_http_running) {
        return 0;
    }

#ifdef _WIN32
    // Windows заглушка
    g_http_daemon = (struct MHD_Daemon*)0x1;
    g_http_running = true;
    
    char log_msg[128];
    snprintf(log_msg, sizeof(log_msg), "HTTP server started on port %d (Windows stub)", port);
    alert_log("INFO", log_msg);
    
    return 0;
#else
    g_http_daemon = MHD_start_daemon(MHD_USE_SELECT_INTERNALLY,
                                   port,
                                   NULL, NULL,
                                   &answer_to_connection, NULL,
                                   MHD_OPTION_END);

    if (g_http_daemon == NULL) {
        alert_log("ERROR", "Failed to start HTTP server");
        return -1;
    }

    g_http_running = true;
    
    char log_msg[128];
    snprintf(log_msg, sizeof(log_msg), "HTTP server started on port %d", port);
    alert_log("INFO", log_msg);

    return 0;
#endif
}

/**
 * Завершение работы HTTP сервера
 */
void http_server_cleanup(void) {
    if (g_http_daemon != NULL) {
        MHD_stop_daemon(g_http_daemon);
        g_http_daemon = NULL;
    }
    g_http_running = false;
    alert_log("INFO", "HTTP server stopped");
}

/**
 * Проверка статуса HTTP сервера
 */
bool http_server_is_running(void) {
    return g_http_running;
}