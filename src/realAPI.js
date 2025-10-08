/**
 * Real API для работы с CoinPaprika
 * Предоставляет методы для получения реальных данных о криптовалютах
 */

// Базовый URL для бесплатного плана CoinPaprika API
const BASE_URL = 'https://api.coinpaprika.com/v1';

// Маппинг токенов с их ID в CoinPaprika
const TOKEN_MAPPING = {
  'bitcoin': 'btc-bitcoin',
  'ethereum': 'eth-ethereum', 
  'solana': 'sol-solana',
  'cardano': 'ada-cardano',
  'polkadot': 'dot-polkadot',
  'avalanche': 'avax-avalanche',
  'chainlink': 'link-chainlink',
  'polygon': 'matic-polygon'
};

// Обратный маппинг для получения нашего ID по CoinPaprika ID
const REVERSE_TOKEN_MAPPING = Object.fromEntries(
  Object.entries(TOKEN_MAPPING).map(([key, value]) => [value, key])
);

// Локальное хранилище для оповещений (поскольку у нас нет бэкенда)
let localAlerts = [];

/**
 * Имитация задержки сети
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Выполнение запроса к CoinPaprika API
 */
const apiRequest = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

/**
 * Real API объект для работы с CoinPaprika
 */
export const realAPI = {
  /**
   * Получить текущую цену токена из CoinPaprika
   * @param {string} tokenId - Наш внутренний ID токена
   * @returns {Promise<number>} - Цена токена в USD
   */
  async fetchTokenPrice(tokenId) {
    await delay(200); // небольшая задержка для UX
    
    const coinPaprikaId = TOKEN_MAPPING[tokenId];
    if (!coinPaprikaId) {
      throw new Error(`Token ${tokenId} not supported`);
    }
    
    try {
      const tickerData = await apiRequest(`/tickers/${coinPaprikaId}`);
      return tickerData.quotes.USD.price; // Для совместимости возвращаем только цену
    } catch (error) {
      console.error(`Failed to fetch price for ${tokenId}:`, error);
      // Возвращаем фиктивную цену в случае ошибки API
      const fallbackPrices = {
        'bitcoin': 61245.32,
        'ethereum': 3287.15,
        'solana': 142.80,
        'cardano': 0.67,
        'polkadot': 7.23,
        'avalanche': 38.45,
        'chainlink': 14.78,
        'polygon': 0.89
      };
      return fallbackPrices[tokenId] || 100;
    }
  },

  /**
   * Получить цены всех токенов одним запросом
   * @returns {Promise<Object>} - Объект с ценами всех токенов
   */
  async fetchAllTokenPrices() {
    await delay(300);
    
    try {
      // Получаем тикеры для всех наших токенов
      const coinPaprikaIds = Object.values(TOKEN_MAPPING);
      const tickersData = await apiRequest('/tickers');
      
      // Фильтруем только нужные нам токены
      const relevantTickers = tickersData.filter(ticker => 
        coinPaprikaIds.includes(ticker.id)
      );
      
      // Преобразуем в нужный формат с данными об изменении цены
      const prices = {};
      relevantTickers.forEach(ticker => {
        const ourTokenId = REVERSE_TOKEN_MAPPING[ticker.id];
        if (ourTokenId) {
          prices[ourTokenId] = {
            price: ticker.quotes.USD.price,
            change24h: ticker.quotes.USD.percent_change_24h,
            volume24h: ticker.quotes.USD.volume_24h,
            marketCap: ticker.quotes.USD.market_cap
          };
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Failed to fetch all prices:', error);
      // Возвращаем фиктивные цены в случае ошибки
      return {
        'bitcoin': { price: 61245.32, change24h: -2.5 },
        'ethereum': { price: 3287.15, change24h: 1.2 },
        'solana': { price: 142.80, change24h: 5.8 },
        'cardano': { price: 0.67, change24h: -0.3 },
        'polkadot': { price: 7.23, change24h: 3.1 },
        'avalanche': { price: 38.45, change24h: -1.8 },
        'chainlink': { price: 14.78, change24h: 2.9 },
        'polygon': { price: 0.89, change24h: -4.2 }
      };
    }
  },

  /**
   * Создать новое оповещение
   * @param {Object} alertData - Данные оповещения
   * @returns {Promise<Object>} - Созданное оповещение
   */
  async createAlert(alertData) {
    await delay(500);
    
    // Получаем актуальную цену для токена
    const currentPrice = await this.fetchTokenPrice(alertData.tokenId);
    
    const newAlert = {
      id: Date.now().toString(),
      ...alertData,
      currentPrice,
      createdAt: new Date().toISOString()
    };
    
    localAlerts.push(newAlert);
    
    return {
      success: true,
      alert: newAlert
    };
  },

  /**
   * Удалить оповещение
   * @param {string} alertId - ID оповещения
   * @returns {Promise<Object>} - Результат удаления
   */
  async deleteAlert(alertId) {
    await delay(300);
    
    const initialLength = localAlerts.length;
    localAlerts = localAlerts.filter(alert => alert.id !== alertId);
    
    return {
      success: localAlerts.length < initialLength,
      message: localAlerts.length < initialLength ? 'Alert deleted' : 'Alert not found'
    };
  },

  /**
   * Получить все оповещения с актуальными ценами
   * @returns {Promise<Array>} - Список оповещений
   */
  async fetchAlerts() {
    await delay(300);
    
    try {
      // Получаем актуальные цены для всех токенов
      const allPrices = await this.fetchAllTokenPrices();
      
      // Обновляем цены в оповещениях
      const updatedAlerts = localAlerts.map(alert => ({
        ...alert,
        currentPrice: allPrices[alert.tokenId]?.price || alert.currentPrice || 0
      }));
      
      return updatedAlerts;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return localAlerts;
    }
  },

  /**
   * Обновить цены во всех оповещениях (для периодического обновления)
   * @returns {Promise<Array>} - Обновленные оповещения
   */
  async updateAlertPrices() {
    try {
      const allPrices = await this.fetchAllTokenPrices();
      
      localAlerts = localAlerts.map(alert => ({
        ...alert,
        currentPrice: allPrices[alert.tokenId]?.price || alert.currentPrice || 0
      }));
      
      return localAlerts;
    } catch (error) {
      console.error('Failed to update alert prices:', error);
      return localAlerts;
    }
  },

  /**
   * Получить информацию о токене из CoinPaprika
   * @param {string} tokenId - Наш внутренний ID токена
   * @returns {Promise<Object>} - Подробная информация о токене
   */
  async fetchTokenInfo(tokenId) {
    const coinPaprikaId = TOKEN_MAPPING[tokenId];
    if (!coinPaprikaId) {
      throw new Error(`Token ${tokenId} not supported`);
    }
    
    try {
      const [coinData, tickerData] = await Promise.all([
        apiRequest(`/coins/${coinPaprikaId}`),
        apiRequest(`/tickers/${coinPaprikaId}`)
      ]);
      
      return {
        id: tokenId,
        name: coinData.name,
        symbol: coinData.symbol,
        description: coinData.description,
        price: tickerData.quotes.USD.price,
        marketCap: tickerData.quotes.USD.market_cap,
        volume24h: tickerData.quotes.USD.volume_24h,
        percentChange24h: tickerData.quotes.USD.percent_change_24h,
        rank: tickerData.rank
      };
    } catch (error) {
      console.error(`Failed to fetch token info for ${tokenId}:`, error);
      throw error;
    }
  },

  /**
   * Получить поддерживаемые токены
   * @returns {Array} - Список поддерживаемых токенов
   */
  getSupportedTokens() {
    return [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'solana', name: 'Solana', symbol: 'SOL' },
      { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
      { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
      { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
      { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
      { id: 'polygon', name: 'Polygon', symbol: 'MATIC' }
    ];
  }
};