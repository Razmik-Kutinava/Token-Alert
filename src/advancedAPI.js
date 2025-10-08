/**
 * Продвинутый API для работы с алертами и криптовалютными данными
 * Поддерживает комплексные условия, исторические данные и сложную логику
 */

import { AdvancedAlert } from './models/Alert';
import { AlertType, TimeFrame } from './models/AlertTypes';

export const advancedAPI = {
  /**
   * Получить все алерты текущего пользователя
   */
  async getAlerts() {
    try {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null');
      if (!user) return [];

      const alerts = JSON.parse(localStorage.getItem('advanced_alerts') || '[]');
      const userAlerts = alerts
        .filter(alert => alert.userId === user.id)
        .map(alert => new AdvancedAlert(alert));

      return userAlerts;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  },

  /**
   * Создать новый алерт
   */
  async createAlert(alertData) {
    try {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null');
      if (!user) throw new Error('Пользователь не авторизован');

      const alert = new AdvancedAlert({
        ...alertData,
        userId: user.id
      });

      const alerts = JSON.parse(localStorage.getItem('advanced_alerts') || '[]');
      alerts.push(alert.toJSON());
      localStorage.setItem('advanced_alerts', JSON.stringify(alerts));

      return {
        success: true,
        alert: alert
      };
    } catch (error) {
      console.error('Error creating alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Обновить алерт
   */
  async updateAlert(alertId, updates) {
    try {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null');
      if (!user) throw new Error('Пользователь не авторизован');

      const alerts = JSON.parse(localStorage.getItem('advanced_alerts') || '[]');
      const alertIndex = alerts.findIndex(a => a.id === alertId && a.userId === user.id);
      
      if (alertIndex === -1) throw new Error('Алерт не найден');

      alerts[alertIndex] = {
        ...alerts[alertIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('advanced_alerts', JSON.stringify(alerts));

      return {
        success: true,
        alert: new AdvancedAlert(alerts[alertIndex])
      };
    } catch (error) {
      console.error('Error updating alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Удалить алерт
   */
  async deleteAlert(alertId) {
    try {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null');
      if (!user) throw new Error('Пользователь не авторизован');

      const alerts = JSON.parse(localStorage.getItem('advanced_alerts') || '[]');
      const filteredAlerts = alerts.filter(alert => 
        !(alert.id === alertId && alert.userId === user.id)
      );

      localStorage.setItem('advanced_alerts', JSON.stringify(filteredAlerts));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Получить текущие данные токена
   */
  async getCurrentTokenData(tokenId) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&community_data=false&developer_data=false`
      );

      if (!response.ok) throw new Error('Failed to fetch token data');

      const data = await response.json();

      return {
        tokenId: data.id,
        name: data.name,
        symbol: data.symbol,
        price: data.market_data.current_price.usd,
        priceChange24h: data.market_data.price_change_percentage_24h,
        volume: data.market_data.total_volume.usd,
        marketCap: data.market_data.market_cap.usd,
        rank: data.market_cap_rank,
        ath: data.market_data.ath.usd,
        atl: data.market_data.atl.usd,
        dominance: data.market_data.market_cap_percentage?.btc || 0
      };
    } catch (error) {
      console.error('Error fetching token data:', error);
      return null;
    }
  },

  /**
   * Получить исторические данные токена
   */
  async getHistoricalData(tokenId, timeFrame = TimeFrame.HOUR_24) {
    try {
      // Конвертируем timeFrame в дни для API
      const days = this.timeFrameToDays(timeFrame);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) throw new Error('Failed to fetch historical data');

      const data = await response.json();

      // Обрабатываем данные
      const prices = data.prices.map(p => p[1]);
      const volumes = data.total_volumes.map(v => v[1]);
      const marketCaps = data.market_caps.map(m => m[1]);

      return {
        startPrice: prices[0],
        currentPrice: prices[prices.length - 1],
        highPrice: Math.max(...prices),
        lowPrice: Math.min(...prices),
        avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        currentVolume: volumes[volumes.length - 1],
        startMarketCap: marketCaps[0],
        currentMarketCap: marketCaps[marketCaps.length - 1],
        ath: Math.max(...prices),
        atl: Math.min(...prices),
        priceData: data.prices,
        volumeData: data.total_volumes,
        marketCapData: data.market_caps
      };
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
  },

  /**
   * Получить глобальные рыночные данные
   */
  async getGlobalMarketData() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');

      if (!response.ok) throw new Error('Failed to fetch global data');

      const data = await response.json();

      return {
        totalMarketCap: data.data.total_market_cap.usd,
        totalVolume: data.data.total_volume.usd,
        btcDominance: data.data.market_cap_percentage.btc,
        ethDominance: data.data.market_cap_percentage.eth,
        usdtDominance: data.data.market_cap_percentage.usdt,
        marketCapChange24h: data.data.market_cap_change_percentage_24h_usd
      };
    } catch (error) {
      console.error('Error fetching global market data:', error);
      return null;
    }
  },

  /**
   * Получить данные по паре токенов для расчета соотношения
   */
  async getTokenPairRatio(token1Id, token2Id) {
    try {
      const [token1, token2] = await Promise.all([
        this.getCurrentTokenData(token1Id),
        this.getCurrentTokenData(token2Id)
      ]);

      if (!token1 || !token2) return null;

      return {
        ratio: token1.price / token2.price,
        token1Price: token1.price,
        token2Price: token2.price,
        token1: token1Id,
        token2: token2Id
      };
    } catch (error) {
      console.error('Error calculating token pair ratio:', error);
      return null;
    }
  },

  /**
   * Проверить все алерты пользователя
   */
  async checkAlerts() {
    try {
      const alerts = await this.getAlerts();
      const triggeredAlerts = [];

      for (const alert of alerts) {
        if (!alert.isActive || alert.isPaused) continue;

        // Получаем данные для проверки
        const currentData = await this.getCurrentTokenData(alert.tokenId);
        if (!currentData) continue;

        const historicalData = await this.getHistoricalData(
          alert.tokenId,
          alert.timeFrame
        );

        // Проверяем условие
        if (alert.evaluate(currentData, historicalData)) {
          alert.trigger();
          triggeredAlerts.push({
            alert: alert,
            currentData: currentData,
            historicalData: historicalData
          });

          // Обновляем алерт в storage
          await this.updateAlert(alert.id, {
            triggeredCount: alert.triggeredCount,
            lastTriggered: alert.lastTriggered
          });
        }
      }

      return triggeredAlerts;
    } catch (error) {
      console.error('Error checking alerts:', error);
      return [];
    }
  },

  /**
   * Вспомогательная функция для конвертации timeFrame в дни
   */
  timeFrameToDays(timeFrame) {
    switch (timeFrame) {
      case TimeFrame.MINUTE_5:
      case TimeFrame.MINUTE_15:
      case TimeFrame.HOUR_1:
      case TimeFrame.HOUR_4:
        return 1;
      case TimeFrame.HOUR_24:
        return 1;
      case TimeFrame.DAY_7:
        return 7;
      case TimeFrame.DAY_30:
        return 30;
      default:
        return 1;
    }
  },

  /**
   * Получить трендовые монеты
   */
  async getTrendingCoins() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');

      if (!response.ok) throw new Error('Failed to fetch trending coins');

      const data = await response.json();

      return data.coins.map(coin => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol,
        rank: coin.item.market_cap_rank,
        priceChange: coin.item.price_btc
      }));
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return [];
    }
  },

  /**
   * Получить детальные рыночные данные
   */
  async getMarketData(page = 1, perPage = 100) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=1h,24h,7d`
      );

      if (!response.ok) throw new Error('Failed to fetch market data');

      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }
};
