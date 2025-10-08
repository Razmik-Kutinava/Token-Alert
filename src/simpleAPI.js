/**
 * Простой API для работы с алертами
 * Использует localStorage и realAPI для цен
 */

import { realAPI } from './realAPI';

export const simpleAPI = {
  /**
   * Получить все алерты текущего пользователя
   */
  async getAlerts() {
    try {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null');
      if (!user) return [];

      const alerts = JSON.parse(localStorage.getItem('demo_alerts') || '[]');
      const userAlerts = alerts.filter(alert => alert.userId === user.id);

      // Обновляем цены
      const prices = await realAPI.fetchAllTokenPrices();
      
      return userAlerts.map(alert => ({
        ...alert,
        currentPrice: prices[alert.tokenId]?.price || alert.currentPrice || 0
      }));
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

      // Получаем текущую цену
      const currentPrice = await realAPI.fetchTokenPrice(alertData.tokenId);

      const newAlert = {
        id: Date.now().toString(),
        userId: user.id,
        tokenId: alertData.tokenId,
        tokenName: alertData.tokenName,
        targetPrice: alertData.targetPrice,
        currentPrice: currentPrice,
        condition: alertData.condition,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      const alerts = JSON.parse(localStorage.getItem('demo_alerts') || '[]');
      alerts.push(newAlert);
      localStorage.setItem('demo_alerts', JSON.stringify(alerts));

      return {
        success: true,
        alert: newAlert
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
   * Удалить алерт
   */
  async deleteAlert(alertId) {
    try {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null');
      if (!user) throw new Error('Пользователь не авторизован');

      const alerts = JSON.parse(localStorage.getItem('demo_alerts') || '[]');
      const filteredAlerts = alerts.filter(alert => 
        !(alert.id === alertId && alert.userId === user.id)
      );

      localStorage.setItem('demo_alerts', JSON.stringify(filteredAlerts));

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
  }
};