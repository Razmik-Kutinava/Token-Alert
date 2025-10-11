#ifndef MARKET_CLIENT_H
#define MARKET_CLIENT_H

#ifdef _WIN32
    // Windows HTTP API
    #include <windows.h>
    #include <winhttp.h>
    #pragma comment(lib, "winhttp.lib")
    
    // Заглушки для cJSON на Windows
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
    
    // Простые функции cJSON для Windows
    cJSON* cJSON_Parse(const char *value);
    void cJSON_Delete(cJSON *c);
    cJSON* cJSON_GetObjectItem(const cJSON * const object, const char * const string);
    int cJSON_IsString(const cJSON * const item);
    int cJSON_IsNumber(const cJSON * const item);
    int cJSON_IsArray(const cJSON * const item);
    char* cJSON_GetStringValue(const cJSON * const item);
    double cJSON_GetNumberValue(const cJSON * const item);
    
    #define cJSON_ArrayForEach(element, array) for(element = (array != NULL) ? (array)->child : NULL; element != NULL; element = element->next)
#else
    // Unix includes
    #include <curl/curl.h>
    #include <cjson/cJSON.h>
#endif

#include "alert_engine.h"

#define API_BASE_URL "https://api.coingecko.com/api/v3"
#define API_PROXY_URL "https://api.allorigins.win/get?url="
#define MAX_SYMBOLS 100
#define USER_AGENT "TokenAlertManager-AlertEngine/1.0"

// Топ криптовалюты для отслеживания
extern const char* SUPPORTED_SYMBOLS[];
extern const int SUPPORTED_SYMBOLS_COUNT;

// Структура для HTTP ответа
typedef struct {
    char* data;
    size_t size;
    long response_code;
    bool success;
} APIResponse;

// Структура для батч запросов
typedef struct {
    char symbols[MAX_SYMBOLS][MAX_SYMBOL_LEN];
    int count;
    time_t last_request;
    bool is_pending;
} BatchRequest;

// Инициализация и завершение market client
int market_client_init(void);
void market_client_cleanup(void);

// Основные функции получения данных
APIResponse* fetch_market_data(const char* symbols);
APIResponse* fetch_single_coin(const char* symbol);
APIResponse* fetch_with_proxy(const char* url);

// Парсинг данных CoinGecko API
int parse_market_data_response(APIResponse* response, CryptoPrice* prices, int max_count);
int parse_single_coin_response(APIResponse* response, CryptoPrice* price);

// Батч обработка запросов
int market_batch_add_symbol(const char* symbol);
int market_batch_execute(void);
void market_batch_clear(void);

// Кэширование и оптимизация
bool is_cache_valid(const char* symbol);
CryptoPrice* get_cached_price(const char* symbol);
void cache_price_data(const char* symbol, CryptoPrice* price);
void cache_cleanup_expired(void);

// Rate limiting
bool can_make_request(void);
void record_api_request(void);
int get_remaining_requests(void);

// Fallback и retry логика
APIResponse* fetch_with_retry(const char* url, int max_retries);
APIResponse* try_fallback_sources(const char* symbol);

// Утилиты
size_t write_callback(void* contents, size_t size, size_t nmemb, APIResponse* response);
void free_api_response(APIResponse* response);
char* url_encode(const char* str);
char* build_market_url(const char* symbols);

// Технические индикаторы
double calculate_rsi_for_symbol(const char* symbol, int period);
double* get_price_history(const char* symbol, int days);

// Мониторинг и логирование
void log_api_request(const char* url, long response_code, double response_time);
void log_api_error(const char* error_msg, const char* url);

// Конфигурация
typedef struct {
    int update_interval_sec;
    int max_retries;
    int timeout_sec;
    bool use_proxy;
    bool enable_cache;
    int cache_ttl_sec;
    int rate_limit_per_minute;
} MarketClientConfig;

extern MarketClientConfig market_config;

void market_client_set_config(MarketClientConfig* config);
MarketClientConfig* market_client_get_config(void);

#endif // MARKET_CLIENT_H