/**
 * Mock Auth API для демонстрации без реального Supabase
 * Использует localStorage для имитации аутентификации
 */

// Имитация Supabase клиента для демо
export const mockSupabase = {
  auth: {
    // Получить текущего пользователя
    async getUser() {
      const userData = localStorage.getItem('mock_user');
      return {
        data: {
          user: userData ? JSON.parse(userData) : null
        },
        error: null
      };
    },

    // Вход в систему
    async signInWithPassword({ email, password }) {
      // Простая валидация для демо
      if (!email || !password) {
        return {
          error: { message: 'Email и пароль обязательны' }
        };
      }

      if (password.length < 6) {
        return {
          error: { message: 'Пароль должен быть не менее 6 символов' }
        };
      }

      // Создаем мок пользователя
      const user = {
        id: 'demo-user-' + Date.now(),
        email: email,
        user_metadata: {
          avatar_url: null,
          email: email,
          email_verified: true
        },
        created_at: new Date().toISOString()
      };

      localStorage.setItem('mock_user', JSON.stringify(user));
      
      return {
        data: { user },
        error: null
      };
    },

    // Регистрация
    async signUp({ email, password }) {
      // Простая валидация для демо
      if (!email || !password) {
        return {
          error: { message: 'Email и пароль обязательны' }
        };
      }

      if (password.length < 6) {
        return {
          error: { message: 'Пароль должен быть не менее 6 символов' }
        };
      }

      // Для демо сразу "регистрируем" пользователя
      return this.signInWithPassword({ email, password });
    },

    // Выход из системы
    async signOut() {
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_alerts');
      return { error: null };
    },

    // Подписка на изменения состояния аутентификации
    onAuthStateChange(callback) {
      // Простая имитация - проверяем изменения каждую секунду
      const interval = setInterval(() => {
        const userData = localStorage.getItem('mock_user');
        const user = userData ? JSON.parse(userData) : null;
        
        callback('SIGNED_IN', user ? { user } : null);
      }, 1000);

      return {
        data: {
          subscription: {
            unsubscribe: () => clearInterval(interval)
          }
        }
      };
    }
  }
};

// Тест подключения для демо
export const mockTestConnection = async () => {
  try {
    // Имитируем успешное подключение
    console.log('✅ Подключение к Demo Auth успешно!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка Demo Auth:', error);
    return false;
  }
};

// Mock API для работы с алертами через localStorage
export const mockSupabaseAPI = {
  /**
   * Получить цены всех токенов (используем realAPI)
   */
  async fetchAllTokenPrices() {
    const { realAPI } = await import('./realAPI');
    return realAPI.fetchAllTokenPrices();
  },

  /**
   * Получить цену конкретного токена
   */
  async fetchTokenPrice(tokenId) {
    const { realAPI } = await import('./realAPI');
    return realAPI.fetchTokenPrice(tokenId);
  },

  /**
   * Создать новый алерт
   */
  async createAlert(alertData) {
    try {
      const user = JSON.parse(localStorage.getItem('mock_user'));
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      // Получаем текущую цену
      const currentPrice = await this.fetchTokenPrice(alertData.tokenId);
      
      const newAlert = {
        id: Date.now().toString(),
        user_id: user.id,
        token_id: alertData.tokenId,
        token_name: alertData.tokenName,
        target_price: alertData.targetPrice,
        current_price: currentPrice,
        alert_type: alertData.alertType,
        is_active: true,
        is_triggered: false,
        created_at: new Date().toISOString()
      };

      // Сохраняем в localStorage
      const alerts = JSON.parse(localStorage.getItem('mock_alerts') || '[]');
      alerts.push(newAlert);
      localStorage.setItem('mock_alerts', JSON.stringify(alerts));

      return {
        success: true,
        alert: {
          id: newAlert.id,
          tokenId: newAlert.token_id,
          tokenName: newAlert.token_name,
          targetPrice: newAlert.target_price,
          currentPrice: newAlert.current_price,
          alertType: newAlert.alert_type,
          isActive: newAlert.is_active,
          isTriggered: newAlert.is_triggered,
          createdAt: newAlert.created_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Получить все алерты пользователя
   */
  async fetchAlerts() {
    try {
      const user = JSON.parse(localStorage.getItem('mock_user'));
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const alerts = JSON.parse(localStorage.getItem('mock_alerts') || '[]');
      const userAlerts = alerts.filter(alert => alert.user_id === user.id);

      // Получаем актуальные цены
      const allPrices = await this.fetchAllTokenPrices();

      return userAlerts.map(alert => ({
        id: alert.id,
        tokenId: alert.token_id,
        tokenName: alert.token_name,
        targetPrice: alert.target_price,
        currentPrice: allPrices[alert.token_id]?.price || alert.current_price,
        alertType: alert.alert_type,
        isActive: alert.is_active,
        isTriggered: alert.is_triggered,
        createdAt: alert.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  },

  /**
   * Удалить алерт
   */
  async deleteAlert(alertId) {
    try {
      const user = JSON.parse(localStorage.getItem('mock_user'));
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const alerts = JSON.parse(localStorage.getItem('mock_alerts') || '[]');
      const filteredAlerts = alerts.filter(alert => 
        !(alert.id === alertId && alert.user_id === user.id)
      );
      
      localStorage.setItem('mock_alerts', JSON.stringify(filteredAlerts));

      return {
        success: true,
        message: 'Alert deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Обновить цены в алертах
   */
  async updateAlertPrices() {
    try {
      const alerts = await this.fetchAlerts();
      const allPrices = await this.fetchAllTokenPrices();

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
   */
  async fetchTokenInfo(tokenId) {
    const { realAPI } = await import('./realAPI');
    return realAPI.fetchTokenInfo(tokenId);
  },

  /**
   * Получить поддерживаемые токены
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