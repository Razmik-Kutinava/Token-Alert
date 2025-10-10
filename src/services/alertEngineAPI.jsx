// API клиент для работы с Alert Engine C Backend
class AlertEngineAPI {
  constructor() {
    // Простая и надежная логика - показываем Alert Engine только на localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Localhost - используем локальный сервер
      this.baseURL = import.meta.env.VITE_ALERT_ENGINE_HTTP_URL || 'http://localhost:8090';
      this.wsURL = import.meta.env.VITE_ALERT_ENGINE_WS_URL || 'ws://localhost:8091';
      this.isAlertEngineEnabled = true;
    } else {
      // Не localhost - отключаем Alert Engine
      this.baseURL = null;
      this.wsURL = null;
      this.isAlertEngineEnabled = false;
    }
    
    this.websocket = null;
    this.subscribers = new Set();
    
    console.log('🔧 Alert Engine API Config:', {
      hostname: window.location.hostname,
      isLocalhost,
      baseURL: this.baseURL,
      wsURL: this.wsURL,
      enabled: this.isAlertEngineEnabled
    });
  }

  // Проверка доступности Alert Engine
  isAlertEngineAvailable() {
    return this.isAlertEngineEnabled && this.baseURL && this.wsURL;
  }

  // Подключение к WebSocket для real-time уведомлений
  connectWebSocket() {
    if (!this.isAlertEngineAvailable() || this.websocket) return;

    this.websocket = new WebSocket(this.wsURL);
    
    this.websocket.onopen = () => {
      console.log('Alert Engine WebSocket connected');
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.websocket.onclose = () => {
      console.log('Alert Engine WebSocket disconnected');
      this.websocket = null;
      // Автоматическое переподключение через 5 секунд
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Подписка на уведомления
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Уведомление подписчиков
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  // HTTP запросы к C API
  async request(endpoint, options = {}) {
    if (!this.isAlertEngineAvailable()) {
      console.warn('Alert Engine not available in production environment');
      throw new Error('Alert Engine not available in production');
    }
    
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Получить все алерты
  async getAlerts() {
    return this.request('/api/alerts');
  }

  // Создать новый алерт
  async createAlert(alertData) {
    return this.request('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Удалить алерт
  async deleteAlert(alertId) {
    return this.request(`/api/alerts/${alertId}`, {
      method: 'DELETE'
    });
  }

  // Получить рыночные данные
  async getMarketData() {
    return this.request('/api/market-data');
  }

  // Получить цену конкретной криптовалюты
  async getCryptoPrices(symbols) {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    return this.request(`/api/prices?symbols=${symbolsParam}`);
  }

  // Получить статистику Alert Engine
  async getStats() {
    return this.request('/api/stats');
  }

  // Проверить статус сервиса
  async getHealth() {
    return this.request('/api/health');
  }
}

// Singleton instance
export const alertEngineAPI = new AlertEngineAPI();

// React Hook для работы с Alert Engine
import { createSignal, createEffect, onCleanup } from 'solid-js';

export function useAlertEngine() {
  const [alerts, setAlerts] = createSignal([]);
  const [marketData, setMarketData] = createSignal({});
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [connected, setConnected] = createSignal(false);

  // Загрузка алертов
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alertEngineAPI.getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Создание алерта
  const createAlert = async (alertData) => {
    try {
      setError(null);
      const newAlert = await alertEngineAPI.createAlert(alertData);
      setAlerts(prev => [...prev, newAlert]);
      return newAlert;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Удаление алерта
  const deleteAlert = async (alertId) => {
    try {
      setError(null);
      await alertEngineAPI.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Загрузка рыночных данных
  const loadMarketData = async () => {
    try {
      const data = await alertEngineAPI.getMarketData();
      setMarketData(data);
    } catch (err) {
      console.error('Failed to load market data:', err);
    }
  };

  // Подписка на WebSocket уведомления
  createEffect(() => {
    alertEngineAPI.connectWebSocket();
    
    const unsubscribe = alertEngineAPI.subscribe((notification) => {
      console.log('Alert notification:', notification);
      
      switch (notification.type) {
        case 'alert_triggered':
          // Обновить алерт или показать уведомление
          setAlerts(prev => prev.map(alert => 
            alert.id === notification.alert_id 
              ? { ...alert, last_triggered: notification.timestamp }
              : alert
          ));
          
          // Показать браузерное уведомление
          if (Notification.permission === 'granted') {
            new Notification(`Alert: ${notification.symbol}`, {
              body: `Price ${notification.condition} ${notification.target_price}`,
              icon: '/crypto-icon.png'
            });
          }
          break;
          
        case 'price_update':
          // Обновить рыночные данные
          setMarketData(prev => ({
            ...prev,
            [notification.symbol]: notification.price_data
          }));
          break;
          
        case 'connection_status':
          setConnected(notification.connected);
          break;
      }
    });

    onCleanup(unsubscribe);
  });

  // Начальная загрузка данных
  createEffect(() => {
    loadAlerts();
    loadMarketData();
    
    // Запрос разрешения на уведомления
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  });

  return {
    // Состояние
    alerts,
    marketData,
    loading,
    error,
    connected,
    
    // Действия
    loadAlerts,
    createAlert,
    deleteAlert,
    loadMarketData
  };
}

// Компонент для отображения статуса подключения
export function AlertEngineStatus() {
  const [health, setHealth] = createSignal(null);
  const [stats, setStats] = createSignal(null);

  const checkHealth = async () => {
    try {
      const healthData = await alertEngineAPI.getHealth();
      const statsData = await alertEngineAPI.getStats();
      setHealth(healthData);
      setStats(statsData);
    } catch (error) {
      setHealth({ status: 'error', message: error.message });
    }
  };

  createEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Проверка каждые 30 сек
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="alert-engine-status">
      <h3>Alert Engine Status</h3>
      
      {health() && (
        <div class={`status ${health().status}`}>
          <span class="indicator"></span>
          {health().status === 'ok' ? 'Connected' : 'Disconnected'}
          {health().message && <span class="message">: {health().message}</span>}
        </div>
      )}
      
      {stats() && (
        <div class="stats">
          <div>Active Alerts: {stats().active_alerts}</div>
          <div>Monitored Symbols: {stats().monitored_symbols}</div>
          <div>Uptime: {stats().uptime} seconds</div>
          <div>Last Update: {new Date(stats().last_update * 1000).toLocaleTimeString()}</div>
        </div>
      )}
      
      <style>{`
        .alert-engine-status {
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 1rem 0;
        }
        
        .status {
          display: flex;
          align-items: center;
          margin: 0.5rem 0;
        }
        
        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .status.ok .indicator {
          background-color: #4caf50;
        }
        
        .status.error .indicator {
          background-color: #f44336;
        }
        
        .stats {
          margin-top: 1rem;
          font-size: 0.9rem;
          color: #666;
        }
        
        .stats div {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}

export default alertEngineAPI;