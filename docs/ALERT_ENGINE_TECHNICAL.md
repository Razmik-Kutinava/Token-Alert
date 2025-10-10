# 🔧 Alert Engine - Техническая архитектура и схемы работы

## 🏗 Архитектура системы

### Общая схема
```
┌──────────────────────────────────────────────────────────────────────┐
│                          ALERT ENGINE SYSTEM                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   DATA      │───▶│   ALERT     │───▶│ NOTIFICATION│              │
│  │ COLLECTORS  │    │  PROCESSOR  │    │   SERVICE   │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│         │                   │                   │                    │
│         ▼                   ▼                   ▼                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ • CoinGecko │    │ • Condition │    │ • Push      │              │
│  │ • CMC API   │    │   Engine    │    │ • Email     │              │
│  │ • TradView  │    │ • Scheduler │    │ • Telegram  │              │
│  │ • On-chain  │    │ • ML Engine │    │ • SMS       │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 🔄 Процесс работы Alert Engine

### 1. Сбор данных (Data Collection)
```
┌─────────────────┐
│   Market Data   │
│    Sources      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Price Feeds    │───▶│   Data Lake     │
│  • Real-time    │    │  • Time series  │
│  • Historical   │    │  • Aggregated   │
│  • Technical    │    │  • Normalized   │
└─────────────────┘    └─────────────────┘
```

### 2. Обработка алертов (Alert Processing)
```
┌─────────────────┐
│  User-defined   │
│     Alerts      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Condition      │───▶│   Evaluation    │───▶│   Trigger       │
│  Parser         │    │    Engine       │    │   Decision      │
│  • Parse rules  │    │  • Real-time    │    │  • Fire alert   │
│  • Validate     │    │  • Historical   │    │  • Rate limit   │
│  • Optimize     │    │  • Batch check  │    │  • Schedule     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3. Доставка уведомлений (Notification Delivery)
```
┌─────────────────┐
│  Alert Trigger  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Message       │───▶│    Delivery     │───▶│   Confirmation  │
│  Formatter      │    │    Service      │    │    Tracking     │
│  • Template     │    │  • Multi-       │    │  • Delivered    │
│  • Personalize │    │    channel      │    │  • Read status  │
│  • Localize     │    │  • Retry logic  │    │  • Feedback     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧠 Типы алертов и их реализация

### Простые ценовые алерты
```javascript
// Структура простого алерта
{
  id: "alert_001",
  type: "price_threshold",
  asset: "bitcoin",
  condition: {
    operator: ">=",
    value: 50000,
    currency: "usd"
  },
  notification: {
    channels: ["push", "email"],
    message: "Bitcoin reached $50,000!"
  },
  cooldown: 3600 // 1 hour
}
```

### Составные алерты с логикой
```javascript
// Сложный алерт с множественными условиями
{
  id: "alert_002", 
  type: "composite",
  asset: "ethereum",
  condition: {
    operator: "AND",
    rules: [
      {
        type: "price",
        operator: ">",
        value: 3000
      },
      {
        type: "rsi",
        period: "1h", 
        operator: "<",
        value: 30
      },
      {
        type: "volume",
        operator: ">",
        value: 1.5,
        reference: "average_24h"
      }
    ]
  }
}
```

### Технические индикаторы
```javascript
// RSI Alert
{
  type: "technical_indicator",
  indicator: "rsi",
  config: {
    period: 14,
    timeframe: "1h",
    overbought: 70,
    oversold: 30
  },
  condition: {
    trigger: "oversold",
    confirmation: true
  }
}

// Moving Average Crossover
{
  type: "ma_crossover",
  config: {
    fast_period: 50,
    slow_period: 200,
    timeframe: "1d"
  },
  condition: {
    direction: "golden_cross" // or "death_cross"
  }
}
```

## ⚡ Real-time обработка

### WebSocket подключения
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Price Stream  │───▶│  Event Queue    │───▶│  Alert Engine   │
│  • CoinGecko WS │    │  • Redis Queue  │    │  • Rule Engine  │
│  • Binance WS   │    │  • Event Bus    │    │  • Evaluator    │
│  • Custom APIs  │    │  • Buffer       │    │  • Scheduler    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Обработка событий
```javascript
// Event-driven архитектура
class AlertEngine {
  constructor() {
    this.eventQueue = new EventQueue();
    this.ruleEngine = new RuleEngine();
    this.scheduler = new AlertScheduler();
  }

  async processMarketEvent(event) {
    // 1. Получение события из очереди
    const { asset, price, volume, timestamp } = event;
    
    // 2. Поиск активных алертов для этого актива
    const activeAlerts = await this.getActiveAlerts(asset);
    
    // 3. Проверка условий для каждого алерта
    for (const alert of activeAlerts) {
      const shouldTrigger = await this.ruleEngine.evaluate(alert, event);
      
      if (shouldTrigger) {
        await this.scheduler.scheduleNotification(alert, event);
      }
    }
  }
}
```

## 📊 Хранение данных

### База данных алертов
```sql
-- Таблица алертов
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  asset VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  notification_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  cooldown_seconds INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_alerts_asset_active ON alerts(asset, is_active);
CREATE INDEX idx_alerts_user_active ON alerts(user_id, is_active);
CREATE INDEX idx_alerts_last_triggered ON alerts(last_triggered_at);
```

### Журнал срабатываний
```sql
-- История алертов
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  market_data JSONB NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_channels TEXT[],
  response_time_ms INTEGER,
  INDEX(alert_id, triggered_at)
);
```

## 🔄 Масштабирование и производительность

### Горизонтальное масштабирование
```
┌─────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   WORKER    │ │   WORKER    │ │   WORKER    │
│   NODE 1    │ │   NODE 2    │ │   NODE 3    │
│             │ │             │ │             │
│ • Asset A-F │ │ • Asset G-M │ │ • Asset N-Z │
│ • 1000 users│ │ • 1000 users│ │ • 1000 users│
└─────────────┘ └─────────────┘ └─────────────┘
```

### Кэширование и оптимизация
```javascript
// Redis кэш для частых запросов
class AlertCache {
  constructor() {
    this.redis = new Redis();
    this.ttl = 60; // 1 minute
  }

  async getCachedPrice(asset) {
    const key = `price:${asset}`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Получаем свежие данные и кэшируем
    const price = await this.fetchMarketPrice(asset);
    await this.redis.setex(key, this.ttl, JSON.stringify(price));
    
    return price;
  }
}
```

## 🛡 Безопасность и отказоустойчивость

### Rate Limiting
```javascript
class RateLimiter {
  constructor() {
    this.limits = {
      free: { alerts: 10, notifications: 100 },
      premium: { alerts: 100, notifications: 1000 }
    };
  }

  async checkAlertLimit(userId, userTier) {
    const key = `alerts:${userId}`;
    const count = await this.redis.get(key) || 0;
    const limit = this.limits[userTier].alerts;
    
    if (count >= limit) {
      throw new Error(`Alert limit exceeded: ${count}/${limit}`);
    }
    
    return true;
  }
}
```

### Backup и восстановление
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Primary DB    │───▶│   Replica DB    │───▶│   Backup S3     │
│   PostgreSQL    │    │   Read-only     │    │   Daily dumps   │
│   • Live data   │    │   • Failover    │    │   • History     │
│   • ACID        │    │   • Analytics   │    │   • Disaster    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📈 Мониторинг и метрики

### Ключевые метрики
```javascript
// Метрики производительности
const metrics = {
  // Латентность
  alert_processing_time: 'histogram',
  notification_delivery_time: 'histogram', 
  
  // Пропускная способность
  alerts_processed_per_second: 'gauge',
  notifications_sent_per_minute: 'counter',
  
  // Надежность
  alert_accuracy_rate: 'gauge', // % правильных срабатываний
  notification_delivery_rate: 'gauge', // % доставленных
  system_uptime: 'gauge',
  
  // Бизнес метрики
  active_alerts_count: 'gauge',
  users_with_alerts: 'gauge',
  premium_conversion_rate: 'gauge'
};
```

### Dashboards и алерты системы
```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Real-time Metrics    📈 Performance Graphs             │
│  • Alerts/sec: 1,247    • Response time: 95ms avg         │
│  • Users online: 3,451  • Error rate: 0.01%               │
│  • Queue depth: 23      • Memory usage: 2.1GB             │
│                                                             │
│  🚨 System Alerts        📋 Recent Events                  │
│  • High CPU usage        • 14:23 - Mass alert triggered    │
│  • Queue overflow        • 14:20 - Bitcoin $50k reached   │
│  • API rate limit        • 14:18 - 1000+ notifications    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Alert Engine** представляет собой высокопроизводительную, масштабируемую систему для мониторинга криптовалютного рынка с акцентом на надежность, скорость и точность доставки уведомлений.