// Mock Alert Engine Server для демонстрации
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 8090;
const WS_PORT = 8091;

// Настройка CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Дополнительная обработка CORS для всех запросов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mock данные
let alerts = [
  {
    id: '1',
    symbol: 'BTC',
    condition: 'above',
    target_price: 65000,
    current_price: 63245,
    is_active: true,
    created_at: Date.now() - 86400000,
    last_triggered: 0,
    priority: 'high',
    category: 'price_monitoring'
  },
  {
    id: '2', 
    symbol: 'ETH',
    condition: 'below',
    target_price: 3000,
    current_price: 3456,
    is_active: true,
    created_at: Date.now() - 43200000,
    last_triggered: 0,
    priority: 'medium',
    category: 'price_monitoring'
  }
];

let nextId = 3;

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('🔌 Client connected to WebSocket');
  
  // Отправляем статус подключения
  ws.send(JSON.stringify({
    type: 'connection_status',
    connected: true,
    timestamp: Date.now()
  }));
  
  // Периодически отправляем обновления цен
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'price_update',
      symbol: 'BTC',
      price_data: {
        price: 63000 + Math.random() * 2000,
        volume: 1500000000,
        change_24h: (Math.random() - 0.5) * 10,
        timestamp: Date.now()
      }
    }));
  }, 5000);
  
  ws.on('close', () => {
    console.log('❌ Client disconnected from WebSocket');
    clearInterval(interval);
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({
    status: 'success',
    alerts: alerts,
    total: alerts.length
  });
});

app.post('/api/alerts', (req, res) => {
  const { symbol, condition, target_price, priority = 'medium', category = 'price_monitoring' } = req.body;
  
  const newAlert = {
    id: String(nextId++),
    symbol: symbol.toUpperCase(),
    condition,
    target_price: parseFloat(target_price),
    current_price: 0,
    is_active: true,
    created_at: Date.now(),
    last_triggered: 0,
    priority,
    category
  };
  
  alerts.push(newAlert);
  
  console.log(`✅ Created alert: ${symbol} ${condition} $${target_price}`);
  
  // Уведомляем всех подключенных клиентов
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'alert_created',
        alert: newAlert,
        timestamp: Date.now()
      }));
    }
  });
  
  res.json({
    status: 'success',
    alert: newAlert
  });
});

app.delete('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const index = alerts.findIndex(alert => alert.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      status: 'error',
      message: 'Alert not found'
    });
  }
  
  const deletedAlert = alerts.splice(index, 1)[0];
  
  console.log(`🗑️ Deleted alert: ${deletedAlert.symbol} ${deletedAlert.condition} $${deletedAlert.target_price}`);
  
  // Уведомляем всех подключенных клиентов
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'alert_deleted',
        alert_id: id,
        timestamp: Date.now()
      }));
    }
  });
  
  res.json({
    status: 'success',
    message: 'Alert deleted'
  });
});

app.get('/api/market-data', (req, res) => {
  res.json({
    status: 'success',
    data: {
      BTC: { price: 63245.67, change_24h: 2.34 },
      ETH: { price: 3456.78, change_24h: -1.23 },
      SOL: { price: 145.23, change_24h: 5.67 }
    },
    timestamp: Date.now()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    status: 'success',
    stats: {
      active_alerts: alerts.filter(a => a.is_active).length,
      total_alerts: alerts.length,
      monitored_symbols: [...new Set(alerts.map(a => a.symbol))].length,
      uptime: process.uptime(),
      last_update: Date.now()
    }
  });
});

// Запуск серверов
app.listen(PORT, () => {
  console.log(`🚀 Mock Alert Engine HTTP API running on http://localhost:${PORT}`);
  console.log(`🔌 Mock Alert Engine WebSocket running on ws://localhost:${WS_PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Alerts API: http://localhost:${PORT}/api/alerts`);
});

console.log('🎭 Mock Alert Engine started! This simulates the C Alert Engine.');
console.log('✅ Ready to receive connections from React frontend.');