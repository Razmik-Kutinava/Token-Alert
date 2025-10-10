# Alert Engine C Backend

High-performance cryptocurrency alert engine written in C with real-time WebSocket notifications and REST API.

## 🚀 Features

- **Real-time Price Monitoring**: Continuous monitoring of cryptocurrency prices via CoinGecko API
- **Advanced Alert Types**: Price, volume, percentage change, and technical indicator alerts
- **WebSocket Notifications**: Real-time browser notifications for triggered alerts
- **REST API**: Complete HTTP API for alert management
- **SQLite Database**: Persistent storage for alerts and market data
- **Multi-threaded Architecture**: High-performance concurrent processing
- **Rate Limiting**: Built-in API rate limiting and retry logic
- **CORS Support**: Cross-origin resource sharing for web integration
- **Configuration Management**: Flexible configuration via config files

## 📋 Prerequisites

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    libcurl4-openssl-dev \
    libcjson-dev \
    libsqlite3-dev \
    libmicrohttpd-dev \
    libwebsockets-dev \
    pkg-config
```

### Windows (MinGW/MSYS2)
```bash
pacman -S mingw-w64-x86_64-gcc \
          mingw-w64-x86_64-curl \
          mingw-w64-x86_64-cjson \
          mingw-w64-x86_64-sqlite3 \
          mingw-w64-x86_64-libmicrohttpd \
          mingw-w64-x86_64-libwebsockets
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alert-engine-c
   ```

2. **Install dependencies**
   ```bash
   make install-deps
   ```

3. **Build the project**
   ```bash
   make
   ```

4. **Run the alert engine**
   ```bash
   make run
   ```

## 📖 API Documentation

### HTTP Endpoints

#### Get All Alerts
```http
GET /api/alerts
```

Response:
```json
{
  "status": "success",
  "alerts": [
    {
      "id": "1",
      "symbol": "BTC",
      "condition": "above",
      "target_price": 50000.0,
      "current_price": 45000.0,
      "created_at": 1640995200,
      "last_triggered": 0,
      "is_active": true
    }
  ]
}
```

#### Create Alert
```http
POST /api/alerts
Content-Type: application/json

{
  "symbol": "ETH",
  "condition": "below",
  "target_price": 3000.0
}
```

#### Delete Alert
```http
DELETE /api/alerts/{id}
```

#### Get Market Data
```http
GET /api/market-data
```

#### Get Health Status
```http
GET /api/health
```

### WebSocket Events

Connect to `ws://localhost:8081` to receive real-time notifications:

#### Alert Triggered
```json
{
  "type": "alert_triggered",
  "alert_id": "1",
  "symbol": "BTC",
  "condition": "above",
  "target_price": 50000.0,
  "current_price": 50100.0,
  "timestamp": 1640995200
}
```

#### Price Update
```json
{
  "type": "price_update",
  "symbol": "BTC",
  "price_data": {
    "price": 45000.0,
    "volume": 1500000000.0,
    "change_24h": 2.5,
    "timestamp": 1640995200
  }
}
```

## ⚙️ Configuration

Edit `config/alert_engine.conf` to customize settings:

```ini
[server]
http_port = 8080
websocket_port = 8081

[market_data]
update_interval = 60
api_base_url = https://api.coingecko.com/api/v3

[alerts]
check_interval = 30
max_alerts_per_user = 100

[logging]
log_level = INFO
log_file = ./logs/alert_engine.log
```

## 🔌 React Integration

Use the provided React hooks and API client:

```javascript
import { useAlertEngine, AlertEngineStatus } from './services/alertEngineAPI';

function MyComponent() {
  const { alerts, createAlert, deleteAlert, loading, error } = useAlertEngine();

  const handleCreateAlert = async () => {
    try {
      await createAlert({
        symbol: 'BTC',
        condition: 'above',
        target_price: 50000.0
      });
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  return (
    <div>
      <AlertEngineStatus />
      {/* Your alert UI components */}
    </div>
  );
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Alert Engine   │    │   CoinGecko     │
│                 │    │     (C++)       │    │      API        │
│  ┌───────────┐  │    │                 │    │                 │
│  │ WebSocket │◄─┼────┼─► WebSocket     │    │                 │
│  │  Client   │  │    │   Server        │    │                 │
│  └───────────┘  │    │                 │    │                 │
│                 │    │  ┌───────────┐  │    │                 │
│  ┌───────────┐  │    │  │   HTTP    │  │    │                 │
│  │HTTP Client│◄─┼────┼─►│  Server   │  │    │                 │
│  └───────────┘  │    │  └───────────┘  │    │                 │
└─────────────────┘    │                 │    │                 │
                       │  ┌───────────┐  │    │                 │
                       │  │  Market   │◄─┼────┼─► REST API      │
                       │  │  Client   │  │    │                 │
                       │  └───────────┘  │    │                 │
                       │                 │    │                 │
                       │  ┌───────────┐  │    └─────────────────┘
                       │  │  SQLite   │  │
                       │  │ Database  │  │
                       │  └───────────┘  │
                       └─────────────────┘
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Statistics
```bash
curl http://localhost:8080/api/stats
```

### Logs
```bash
tail -f logs/alert_engine.log
```

## 🔒 Security Features

- **Rate Limiting**: API requests are rate-limited per client
- **CORS Protection**: Configurable CORS origins
- **Input Validation**: All inputs are validated and sanitized
- **Memory Safety**: Careful memory management to prevent leaks
- **Error Handling**: Comprehensive error handling and recovery

## 🚀 Performance

- **Multi-threaded**: Separate threads for HTTP, WebSocket, and market data
- **Connection Pooling**: Efficient connection management
- **Caching**: In-memory caching for frequently accessed data
- **Batch Processing**: Efficient batch processing of alerts
- **Optimized Queries**: Optimized SQLite queries with proper indexing

## 🧪 Testing

### Build and Test
```bash
make test
```

### Memory Check
```bash
make memcheck
```

### Static Analysis
```bash
make static-analysis
```

## 📝 Development

### Debug Build
```bash
make debug
```

### Code Formatting
```bash
make format
```

### Documentation
```bash
make docs
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :8080
   
   # Kill the process or change port in config
   ```

2. **Database Locked**
   ```bash
   # Check if database file exists and has proper permissions
   ls -la data/alerts.db
   ```

3. **Missing Dependencies**
   ```bash
   # Reinstall dependencies
   make install-deps
   ```

4. **API Connection Failed**
   - Check internet connection
   - Verify CoinGecko API is accessible
   - Check if using proxy is required

### Debug Mode

Enable debug mode in `config/alert_engine.conf`:
```ini
[development]
debug_mode = true
verbose_logging = true
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🆘 Support

- Create an issue for bug reports
- Check existing issues for solutions
- Review documentation thoroughly

---

**Alert Engine C Backend** - High-performance cryptocurrency monitoring solution