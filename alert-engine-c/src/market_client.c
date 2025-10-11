#ifdef _WIN32
    // Windows includes
    #include <windows.h>
    #include <winhttp.h>
    #define sleep(x) Sleep((x) * 1000)
#else
    // Unix includes
    #include <curl/curl.h>
    #include <unistd.h>
#endif

#include "../include/market_client.h"
#include "../include/alert_engine.h"
#include <time.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Поддерживаемые криптовалюты (топ-50)
const char* SUPPORTED_SYMBOLS[] = {
    "bitcoin", "ethereum", "binancecoin", "cardano", "solana", 
    "chainlink", "polkadot", "avalanche-2", "polygon", "cosmos",
    "algorand", "vechain", "stellar", "monero", "tron",
    "uniswap", "litecoin", "ethereum-classic", "filecoin", "eos",
    "aave", "compound", "maker", "yearn-finance", "synthetix",
    "curve-dao-token", "sushi", "pancakeswap-token", "1inch", "0x",
    "decentraland", "sandbox", "axie-infinity", "chiliz", "enjincoin",
    "basic-attention-token", "loopring", "the-graph", "numeraire", "bancor",
    "kyber-network-crystal", "republic-protocol", "balancer", "storj", "civic",
    "district0x", "golem", "augur", "gnosis", "omisego"
};

const int SUPPORTED_SYMBOLS_COUNT = sizeof(SUPPORTED_SYMBOLS) / sizeof(SUPPORTED_SYMBOLS[0]);

#ifdef _WIN32
// Windows-специфичные функции

// Простая реализация cJSON функций для Windows
cJSON* cJSON_Parse(const char *value) {
    // Заглушка - возвращает NULL
    (void)value;
    return NULL;
}

void cJSON_Delete(cJSON *c) {
    if (c) free(c);
}

cJSON* cJSON_GetObjectItem(const cJSON * const object, const char * const string) {
    (void)object; (void)string;
    return NULL;
}

int cJSON_IsString(const cJSON * const item) {
    (void)item;
    return 0;
}

int cJSON_IsNumber(const cJSON * const item) {
    (void)item;
    return 0;
}

int cJSON_IsArray(const cJSON * const item) {
    (void)item;
    return 0;
}

char* cJSON_GetStringValue(const cJSON * const item) {
    (void)item;
    return NULL;
}

double cJSON_GetNumberValue(const cJSON * const item) {
    (void)item;
    return 0.0;
}

// Windows HTTP request function
char* make_http_request_windows(const char* url) {
    DWORD dwSize = 0;
    DWORD dwDownloaded = 0;
    LPSTR pszOutBuffer;
    BOOL bResults = FALSE;
    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;
    
    // Use WinHttpOpen to obtain a session handle.
    hSession = WinHttpOpen(L"Alert Engine/1.0",
                          WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
                          WINHTTP_NO_PROXY_NAME,
                          WINHTTP_NO_PROXY_BYPASS, 0);

    if (hSession) {
        // Connect to coingecko API
        hConnect = WinHttpConnect(hSession, L"api.coingecko.com",
                                 INTERNET_DEFAULT_HTTPS_PORT, 0);
    }

    if (hConnect) {
        // Create an HTTP request handle.
        hRequest = WinHttpOpenRequest(hConnect, L"GET", L"/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1",
                                     NULL, WINHTTP_NO_REFERER,
                                     WINHTTP_DEFAULT_ACCEPT_TYPES,
                                     WINHTTP_FLAG_SECURE);
    }

    if (hRequest) {
        // Send a request.
        bResults = WinHttpSendRequest(hRequest,
                                     WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                                     WINHTTP_NO_REQUEST_DATA, 0,
                                     0, 0);
    }

    if (bResults) {
        bResults = WinHttpReceiveResponse(hRequest, NULL);
    }

    char* result = NULL;
    if (bResults) {
        do {
            // Check for available data.
            dwSize = 0;
            if (!WinHttpQueryDataAvailable(hRequest, &dwSize)) {
                break;
            }

            // Allocate space for the buffer.
            pszOutBuffer = (LPSTR)malloc(dwSize + 1);
            if (!pszOutBuffer) {
                break;
            }

            // Read the data.
            ZeroMemory(pszOutBuffer, dwSize + 1);
            if (!WinHttpReadData(hRequest, (LPVOID)pszOutBuffer, dwSize, &dwDownloaded)) {
                free(pszOutBuffer);
                break;
            }

            // Простое копирование первого блока данных
            if (!result) {
                result = (char*)malloc(dwDownloaded + 1);
                if (result) {
                    memcpy(result, pszOutBuffer, dwDownloaded);
                    result[dwDownloaded] = '\0';
                }
            }

            free(pszOutBuffer);
        } while (dwSize > 0);
    }

    // Close handles.
    if (hRequest) WinHttpCloseHandle(hRequest);
    if (hConnect) WinHttpCloseHandle(hConnect);
    if (hSession) WinHttpCloseHandle(hSession);

    return result;
}

#endif // _WIN32

// Глобальные переменные
#ifdef _WIN32
static char* g_mock_data = NULL;
#else
static CURL* g_curl = NULL;
#endif

static MarketClientConfig market_config = {
    .update_interval_sec = 30,
    .max_retries = 3,
    .timeout_sec = 10,
    .use_proxy = true,
    .enable_cache = true,
    .cache_ttl_sec = 60,
    .rate_limit_per_minute = 50
};

static BatchRequest g_batch_request = {0};
static time_t g_last_api_call = 0;
static int g_api_calls_count = 0;

/**
 * Инициализация market client
 */
int market_client_init(void) {
#ifdef _WIN32
    // Windows initialization
    alert_log("INFO", "Market client initialized (Windows mode)");
    return 0;
#else
    curl_global_init(CURL_GLOBAL_DEFAULT);
    
    g_curl = curl_easy_init();
    if (!g_curl) {
        alert_log("ERROR", "Failed to initialize CURL");
        return -1;
    }
    
    // Настройка CURL
    curl_easy_setopt(g_curl, CURLOPT_USERAGENT, USER_AGENT);
    curl_easy_setopt(g_curl, CURLOPT_TIMEOUT, market_config.timeout_sec);
    curl_easy_setopt(g_curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(g_curl, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(g_curl, CURLOPT_SSL_VERIFYHOST, 2L);
    curl_easy_setopt(g_curl, CURLOPT_WRITEFUNCTION, write_callback);
    
    alert_log("INFO", "Market client initialized");
    return 0;
#endif
}

/**
 * Завершение market client
 */
void market_client_cleanup(void) {
#ifdef _WIN32
    // Windows cleanup
    if (g_mock_data) {
        free(g_mock_data);
        g_mock_data = NULL;
    }
    alert_log("INFO", "Market client cleanup complete (Windows mode)");
#else
    if (g_curl) {
        curl_easy_cleanup(g_curl);
        g_curl = NULL;
    }
    curl_global_cleanup();
    alert_log("INFO", "Market client cleanup complete");
#endif
}

/**
 * Получение рыночных данных
 */
APIResponse* fetch_market_data(const char* symbols) {
    if (!symbols || !can_make_request()) {
        return NULL;
    }
    
    char* url = build_market_url(symbols);
    if (!url) {
        return NULL;
    }
    
    APIResponse* response = fetch_with_retry(url, market_config.max_retries);
    
    free(url);
    record_api_request();
    
    return response;
}

/**
 * Получение данных с retry логикой
 */
APIResponse* fetch_with_retry(const char* url, int max_retries) {
    APIResponse* response = NULL;
    
    for (int retry = 0; retry <= max_retries; retry++) {
        if (retry > 0) {
            alert_log("INFO", "Retrying API request...");
            sleep(retry * 2); // Exponential backoff
        }
        
        response = malloc(sizeof(APIResponse));
        if (!response) {
            continue;
        }
        
        response->data = NULL;
        response->size = 0;
        response->success = false;
        response->response_code = 0;
        
#ifdef _WIN32
        // Windows implementation
        response->data = make_http_request_windows(url);
        if (response->data) {
            response->size = strlen(response->data);
            response->response_code = 200;
            response->success = true;
            log_api_request(url, response->response_code, 0.0);
            return response;
        }
#else
        // Unix implementation with CURL
        response->data = malloc(1);
        curl_easy_setopt(g_curl, CURLOPT_URL, url);
        curl_easy_setopt(g_curl, CURLOPT_WRITEDATA, response);
        
        CURLcode res = curl_easy_perform(g_curl);
        curl_easy_getinfo(g_curl, CURLINFO_RESPONSE_CODE, &response->response_code);
        
        if (res == CURLE_OK && response->response_code == 200) {
            response->success = true;
            log_api_request(url, response->response_code, 0.0);
            return response;
        }
#endif
        
        char error_msg[256];
        snprintf(error_msg, sizeof(error_msg), 
                "API request failed (HTTP %ld)", response->response_code);
        log_api_error(error_msg, url);
        
        free_api_response(response);
        response = NULL;
    }
    
    // Попытка использовать proxy (только на Unix)
#ifndef _WIN32
    if (market_config.use_proxy) {
        alert_log("INFO", "Trying proxy fallback...");
        return fetch_with_proxy(url);
    }
#endif
    
    return NULL;
}

/**
 * Получение данных через proxy (только Unix)
 */
APIResponse* fetch_with_proxy(const char* original_url) {
#ifdef _WIN32
    // На Windows proxy не поддерживается
    (void)original_url;
    return NULL;
#else
    char* encoded_url = url_encode(original_url);
    if (!encoded_url) {
        return NULL;
    }
    
    char proxy_url[MAX_URL_LEN];
    snprintf(proxy_url, sizeof(proxy_url), "%s%s", API_PROXY_URL, encoded_url);
    
    APIResponse* response = malloc(sizeof(APIResponse));
    if (!response) {
        free(encoded_url);
        return NULL;
    }
    
    response->data = malloc(1);
    response->size = 0;
    response->success = false;
    response->response_code = 0;
    
    curl_easy_setopt(g_curl, CURLOPT_URL, proxy_url);
    curl_easy_setopt(g_curl, CURLOPT_WRITEDATA, response);
    
    CURLcode res = curl_easy_perform(g_curl);
    curl_easy_getinfo(g_curl, CURLINFO_RESPONSE_CODE, &response->response_code);
    
    if (res == CURLE_OK && response->response_code == 200) {
        // Парсим ответ от прокси
        cJSON* json = cJSON_Parse(response->data);
        if (json) {
            cJSON* contents = cJSON_GetObjectItem(json, "contents");
            if (contents && cJSON_IsString(contents)) {
                // Заменяем данные на contents
                free(response->data);
                response->data = strdup(cJSON_GetStringValue(contents));
                response->size = strlen(response->data);
                response->success = true;
            }
            cJSON_Delete(json);
        }
    }
    
    free(encoded_url);
    
    if (!response->success) {
        free_api_response(response);
        return NULL;
    }
    
    return response;
#endif
}

/**
 * Парсинг ответа market data
 */
int parse_market_data_response(APIResponse* response, CryptoPrice* prices, int max_count) {
    if (!response || !prices) {
        return 0;
    }
    
#ifdef _WIN32
    // Mock данные для Windows
    int count = (max_count > 5) ? 5 : max_count;
    
    const char* mock_symbols[] = {"bitcoin", "ethereum", "binancecoin", "cardano", "solana"};
    const char* mock_names[] = {"Bitcoin", "Ethereum", "BNB", "Cardano", "Solana"};
    const double mock_prices[] = {43000.0, 2600.0, 240.0, 0.35, 20.0};
    
    for (int i = 0; i < count; i++) {
        CryptoPrice* price = &prices[i];
        memset(price, 0, sizeof(CryptoPrice));
        
        strncpy(price->symbol, mock_symbols[i], sizeof(price->symbol) - 1);
        strncpy(price->name, mock_names[i], sizeof(price->name) - 1);
        
        price->current_price = mock_prices[i] + (rand() % 1000 - 500);
        price->price_change_24h = (rand() % 200 - 100);
        price->price_change_percent_24h = (rand() % 20 - 10);
        price->volume_24h = 1000000000.0 + (rand() % 1000000000);
        price->market_cap = price->current_price * 19000000; // Mock circulating supply
        price->last_updated = time(NULL);
        price->rsi_14 = 30.0 + (rand() % 40);
        price->is_valid = true;
    }
    
    char log_msg[128];
    snprintf(log_msg, sizeof(log_msg), "Generated %d mock crypto prices (Windows)", count);
    alert_log("INFO", log_msg);
    
    return count;
#else
    // Unix реализация с реальным парсингом JSON
    if (!response->data) {
        return 0;
    }
    
    cJSON* json = cJSON_Parse(response->data);
    if (!json) {
        alert_log("ERROR", "Failed to parse JSON response");
        return 0;
    }
    
    if (!cJSON_IsArray(json)) {
        alert_log("ERROR", "Expected JSON array in response");
        cJSON_Delete(json);
        return 0;
    }
    
    int count = 0;
    cJSON* item = NULL;
    
    cJSON_ArrayForEach(item, json) {
        if (count >= max_count) {
            break;
        }
        
        CryptoPrice* price = &prices[count];
        memset(price, 0, sizeof(CryptoPrice));
        
        // Парсинг полей
        cJSON* id = cJSON_GetObjectItem(item, "id");
        cJSON* name = cJSON_GetObjectItem(item, "name");
        cJSON* current_price = cJSON_GetObjectItem(item, "current_price");
        cJSON* price_change_24h = cJSON_GetObjectItem(item, "price_change_24h");
        cJSON* price_change_percent_24h = cJSON_GetObjectItem(item, "price_change_percentage_24h");
        cJSON* total_volume = cJSON_GetObjectItem(item, "total_volume");
        cJSON* market_cap = cJSON_GetObjectItem(item, "market_cap");
        
        if (id && cJSON_IsString(id)) {
            strncpy(price->symbol, cJSON_GetStringValue(id), sizeof(price->symbol) - 1);
        }
        
        if (name && cJSON_IsString(name)) {
            strncpy(price->name, cJSON_GetStringValue(name), sizeof(price->name) - 1);
        }
        
        if (current_price && cJSON_IsNumber(current_price)) {
            price->current_price = cJSON_GetNumberValue(current_price);
        }
        
        if (price_change_24h && cJSON_IsNumber(price_change_24h)) {
            price->price_change_24h = cJSON_GetNumberValue(price_change_24h);
        }
        
        if (price_change_percent_24h && cJSON_IsNumber(price_change_percent_24h)) {
            price->price_change_percent_24h = cJSON_GetNumberValue(price_change_percent_24h);
        }
        
        if (total_volume && cJSON_IsNumber(total_volume)) {
            price->volume_24h = cJSON_GetNumberValue(total_volume);
        }
        
        if (market_cap && cJSON_IsNumber(market_cap)) {
            price->market_cap = cJSON_GetNumberValue(market_cap);
        }
        
        price->last_updated = time(NULL);
        price->rsi_14 = calculate_rsi_for_symbol(price->symbol, 14);
        price->is_valid = true;
        
        count++;
    }
    
    cJSON_Delete(json);
    
    char log_msg[128];
    snprintf(log_msg, sizeof(log_msg), "Parsed %d crypto prices", count);
    alert_log("INFO", log_msg);
    
    return count;
#endif
}

/**
 * Построение URL для market API
 */
char* build_market_url(const char* symbols) {
    char* url = malloc(MAX_URL_LEN);
    if (!url) {
        return NULL;
    }
    
    snprintf(url, MAX_URL_LEN,
             "%s/coins/markets?vs_currency=usd&ids=%s&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
             API_BASE_URL, symbols);
    
    return url;
}

/**
 * Rate limiting проверка
 */
bool can_make_request(void) {
    time_t current_time = time(NULL);
    
    // Сброс счетчика каждую минуту
    if (current_time - g_last_api_call >= 60) {
        g_api_calls_count = 0;
        g_last_api_call = current_time;
    }
    
    return g_api_calls_count < market_config.rate_limit_per_minute;
}

/**
 * Запись API запроса
 */
void record_api_request(void) {
    g_api_calls_count++;
    g_last_api_call = time(NULL);
}

/**
 * Callback для записи данных (только Unix)
 */
size_t write_callback(void* contents, size_t size, size_t nmemb, APIResponse* response) {
#ifdef _WIN32
    // На Windows не используется
    (void)contents; (void)size; (void)nmemb; (void)response;
    return 0;
#else
    size_t realsize = size * nmemb;
    char* ptr = realloc(response->data, response->size + realsize + 1);
    
    if (!ptr) {
        alert_log("ERROR", "Out of memory during HTTP response");
        return 0;
    }
    
    response->data = ptr;
    memcpy(&(response->data[response->size]), contents, realsize);
    response->size += realsize;
    response->data[response->size] = 0;
    
    return realsize;
#endif
}

/**
 * Освобождение APIResponse
 */
void free_api_response(APIResponse* response) {
    if (response) {
        if (response->data) {
            free(response->data);
        }
        free(response);
    }
}

/**
 * URL кодирование
 */
char* url_encode(const char* str) {
    if (!str) {
        return NULL;
    }
    
#ifdef _WIN32
    // Простое копирование на Windows (без кодирования)
    return strdup(str);
#else
    char* encoded = curl_easy_escape(g_curl, str, strlen(str));
    if (!encoded) {
        return NULL;
    }
    
    char* result = strdup(encoded);
    curl_free(encoded);
    
    return result;
#endif
}

/**
 * Расчет RSI для символа
 */
double calculate_rsi_for_symbol(const char* symbol, int period) {
    // Упрощенная реализация RSI
    // В реальной реализации нужно получать исторические данные
    
    // Для демонстрации возвращаем случайное значение RSI
    srand(time(NULL) + (int)symbol[0]);
    double rsi = 30.0 + (rand() % 40); // RSI между 30 и 70
    
    return rsi;
}

/**
 * Логирование API запросов
 */
void log_api_request(const char* url, long response_code, double response_time) {
    char log_msg[512];
    snprintf(log_msg, sizeof(log_msg), 
             "API Request: %ld - %.100s", response_code, url);
    alert_log("API", log_msg);
}

/**
 * Логирование ошибок API
 */
void log_api_error(const char* error_msg, const char* url) {
    char log_msg[512];
    snprintf(log_msg, sizeof(log_msg), 
             "API Error: %s - %.100s", error_msg, url);
    alert_log("ERROR", log_msg);
}

/**
 * Конфигурация
 */
void market_client_set_config(MarketClientConfig* config) {
    if (config) {
        market_config = *config;
    }
}

MarketClientConfig* market_client_get_config(void) {
    return &market_config;
}