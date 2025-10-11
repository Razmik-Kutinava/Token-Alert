// API клиент для работы с Alert Engine C Backend
class AlertEngineAPI {
  constructor() {
    // Определяем окружение
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    console.log('🔧 Alert Engine API:', {
      hostname: hostname,
      isLocalhost: isLocalhost,
      enabled: true, // Теперь всегда включен
      baseURL: this.baseURL,
      wsURL: this.wsURL,
      useMockData: this.useMockData
    });
    
    if (isLocalhost) {
      // Localhost - используем реальный mock сервер
      this.baseURL = import.meta.env.VITE_ALERT_ENGINE_HTTP_URL || 'http://localhost:8090';
      this.wsURL = import.meta.env.VITE_ALERT_ENGINE_WS_URL || 'ws://localhost:8091';
      this.isAlertEngineEnabled = true;
      this.useMockData = false;
    } else {
      // Production - используем встроенные mock данные
      this.baseURL = null;
      this.wsURL = null;
      this.isAlertEngineEnabled = true;
      this.useMockData = true;
    }
    
    this.websocket = null;
    this.subscribers = new Set();
    
    // Mock данные для production
    this.mockAlerts = [
      {
        id: '1',
        symbol: 'BTC',
        condition: 'above',
        target_price: 65000,
        current_price: 63245,
        is_active: true,
        created_at: Date.now() - 86400000,
        priority: 'high'
      },
      {
        id: '2',
        symbol: 'ETH',
        condition: 'below',
        target_price: 3000,
        current_price: 3456,
        is_active: true,
        created_at: Date.now() - 43200000,
        priority: 'medium'
      }
    ];
  }

  // Проверка доступности Alert Engine
  isAlertEngineAvailable() {
    // Теперь всегда доступен (либо реальный API, либо mock)
    return this.isAlertEngineEnabled;
  }

  // Проверка доступности WebSocket
  isWebSocketAvailable() {
    return this.isAlertEngineEnabled && this.wsURL !== null;
  }

  // Подключение к WebSocket для real-time уведомлений
  connectWebSocket() {
    if (!this.isWebSocketAvailable() || this.websocket) {
      if (!this.wsURL) {
        console.log('🔇 WebSocket disabled in production (using mock data)');
      }
      return;
    }

    console.log('🔌 Connecting to WebSocket:', this.wsURL);
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
      // Автоматическое переподключение через 5 секунд (только если WebSocket доступен)
      if (this.isWebSocketAvailable()) {
        setTimeout(() => this.connectWebSocket(), 5000);
      }
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

  // Mock запросы для production
  async handleMockRequest(endpoint, options = {}) {
    console.log('🎭 Mock request:', endpoint, options.method || 'GET');
    
    try {
      // Симулируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (endpoint === '/api/health') {
        return { status: 'ok', mode: 'mock', timestamp: Date.now() };
      }
    
    if (endpoint === '/api/alerts') {
      if (options.method === 'POST') {
        const requestData = JSON.parse(options.body || '{}');
        const newAlert = {
          id: String(Date.now()),
          symbol: requestData.symbol || 'BTC',
          condition: requestData.condition || 'above',
          target_price: requestData.target_price || 0,
          current_price: requestData.current_price || 0,
          alert_type: requestData.alert_type || 'price',
          priority: requestData.priority || 'medium',
          category: requestData.category || 'price_monitoring',
          created_at: Date.now(),
          is_active: true
        };
        this.mockAlerts.push(newAlert);
        return { status: 'success', alert: newAlert };
      }
      return { status: 'success', alerts: this.mockAlerts, total: this.mockAlerts.length };
    }
    
    if (endpoint.startsWith('/api/alerts/') && options.method === 'DELETE') {
      const id = endpoint.split('/').pop();
      this.mockAlerts = this.mockAlerts.filter(a => a.id !== id);
      return { status: 'success', message: 'Alert deleted' };
    }
    
    if (endpoint === '/api/market-data') {
      return {
        status: 'success',
        data: {
          BTC: { price: 63245.67, change_24h: 2.34 },
          ETH: { price: 3456.78, change_24h: -1.23 },
          SOL: { price: 145.23, change_24h: 5.67 }
        }
      };
    }
    
    if (endpoint === '/api/stats') {
      return {
        status: 'success',
        stats: {
          active_alerts: this.mockAlerts.filter(a => a.is_active).length,
          total_alerts: this.mockAlerts.length,
          monitored_symbols: [...new Set(this.mockAlerts.map(a => a.symbol))].length,
          uptime: 3600,
          last_update: Date.now()
        }
      };
    }
    
    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
    } catch (error) {
      console.error('Mock request error:', error);
      throw error;
    }
  }

  // HTTP запросы к C API
  async request(endpoint, options = {}) {
    // В production используем mock данные
    if (this.useMockData) {
      return this.handleMockRequest(endpoint, options);
    }
    
    if (!this.isAlertEngineAvailable()) {
      console.warn('Alert Engine not available');
      throw new Error('Alert Engine not available');
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
      console.log('🔧 Creating alert with data:', alertData);
      const response = await alertEngineAPI.createAlert(alertData);
      console.log('📝 Alert creation response:', response);
      
      // API возвращает { status: 'success', alert: {...} }
      const newAlert = response.alert || response;
      
      // Проверяем что алерт с таким ID еще не существует
      setAlerts(prev => {
        const exists = prev.find(alert => alert.id === newAlert.id);
        if (exists) {
          console.warn('⚠️ Alert with ID already exists, skipping:', newAlert.id);
          return prev;
        }
        console.log('✅ Adding new alert to list:', newAlert.id);
        return [...prev, newAlert];
      });
      
      return newAlert;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Удаление алерта
  const deleteAlert = async (alertId) => {
    try {
      if (!alertId) {
        console.error('Alert ID is undefined');
        throw new Error('Alert ID is required');
      }
      
      setError(null);
      console.log('🗑️ Deleting alert with ID:', alertId);
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