/**
 * Supabase API для работы с базой данных
 * Предоставляет методы для работы с алертами через Supabase
 */

import { supabase } from './supabaseClient.js';

// Маппинг токенов с их ID в CoinPaprika (из realAPI.js)
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

// Базовый URL для CoinPaprika API
const BASE_URL = 'https://api.coinpaprika.com/v1';

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
 * Supabase API объект
 */
export const supabaseAPI = {
  /**
   * Получить текущую цену токена из CoinPaprika
   * @param {string} tokenId - Наш внутренний ID токена
   * @returns {Promise<number>} - Цена токена в USD
   */
  async fetchTokenPrice(tokenId) {
    const coinPaprikaId = TOKEN_MAPPING[tokenId];
    if (!coinPaprikaId) {
      throw new Error(`Token ${tokenId} not supported`);
    }

    try {
      const tickerData = await apiRequest(`/tickers/${coinPaprikaId}`);
      return tickerData.quotes.USD.price;
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
   * Создать новое оповещение в Supabase
   * @param {Object} alertData - Данные оповещения
   * @returns {Promise<Object>} - Созданное оповещение
   */
  async createAlert(alertData) {
    try {
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      // Получаем актуальную цену для токена
      const currentPrice = await this.fetchTokenPrice(alertData.tokenId);
      
      const newAlert = {
        user_id: user.id,
        token_id: alertData.tokenId,
        token_name: alertData.tokenName,
        target_price: alertData.targetPrice,
        current_price: currentPrice,
        alert_type: alertData.alertType
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert([newAlert])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        alert: {
          id: data.id.toString(),
          tokenId: data.token_id,
          tokenName: data.token_name,
          targetPrice: data.target_price,
          currentPrice: data.current_price,
          alertType: data.alert_type,
          isActive: data.is_active,
          isTriggered: data.is_triggered,
          createdAt: data.created_at
        }
      };
    } catch (error) {
      console.error('Failed to create alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Удалить оповещение из Supabase
   * @param {string} alertId - ID оповещения
   * @returns {Promise<Object>} - Результат удаления
   */
  async deleteAlert(alertId) {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Alert deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Получить все оповещения пользователя с актуальными ценами
   * @returns {Promise<Array>} - Список оповещений
   */
  async fetchAlerts() {
    try {
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      // Получаем оповещения пользователя
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Получаем актуальные цены для всех токенов
      const allPrices = await this.fetchAllTokenPrices();

      // Обновляем цены в оповещениях и преобразуем формат
      const updatedAlerts = alerts.map(alert => ({
        id: alert.id.toString(),
        tokenId: alert.token_id,
        tokenName: alert.token_name,
        targetPrice: alert.target_price,
        currentPrice: allPrices[alert.token_id]?.price || alert.current_price || 0,
        alertType: alert.alert_type,
        isActive: alert.is_active,
        isTriggered: alert.is_triggered,
        createdAt: alert.created_at
      }));

      return updatedAlerts;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  },

  /**
   * Обновить цены во всех оповещениях пользователя
   * @returns {Promise<Array>} - Обновленные оповещения
   */
  async updateAlertPrices() {
    try {
      const alerts = await this.fetchAlerts();
      const allPrices = await this.fetchAllTokenPrices();

      // Обновляем цены в базе данных
      const updates = alerts.map(alert => ({
        id: parseInt(alert.id),
        current_price: allPrices[alert.tokenId]?.price || alert.currentPrice
      }));

      if (updates.length > 0) {
        const { error } = await supabase
          .from('alerts')
          .upsert(updates, { onConflict: 'id' });

        if (error) {
          console.error('Failed to update prices in database:', error);
        }
      }

      return alerts.map(alert => ({
        ...alert,
        currentPrice: allPrices[alert.tokenId]?.price || alert.currentPrice
      }));
    } catch (error) {
      console.error('Failed to update alert prices:', error);
      return [];
    }
  },

  /**
   * Получить информацию о токене
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
  },

  /**
   * Сохранить исторические данные о ценах
   * @param {Object} priceData - Данные о ценах всех токенов
   * @returns {Promise<boolean>} - Успешность операции
   */
  async savePriceHistory(priceData) {
    try {
      const records = Object.entries(priceData).map(([tokenId, data]) => ({
        token_id: tokenId,
        token_name: this.getSupportedTokens().find(t => t.id === tokenId)?.name || tokenId,
        price: data.price,
        change_24h: data.change24h,
        market_cap: data.marketCap,
        volume_24h: data.volume24h
      }));

      const { error } = await supabase
        .from('price_history')
        .insert(records);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to save price history:', error);
      return false;
    }
  }
};