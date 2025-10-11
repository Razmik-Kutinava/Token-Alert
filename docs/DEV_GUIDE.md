# 🚀 Быстрый старт для разработки

## Запуск Alert Engine + React App

### 1️⃣ Терминал 1: Alert Engine (Mock Server)
```bash
cd alert-engine-c
npm run dev
```
Запустится на:
- HTTP API: http://localhost:8090
- WebSocket: ws://localhost:8091

### 2️⃣ Терминал 2: React App
```bash
npm run dev
```
Запустится на:
- Frontend: http://localhost:3000 (или 3001 если 3000 занят)

## ✅ Проверка работы

1. Откройте http://localhost:3000 (или 3001)
2. Alert Engine должен показывать статус "Connected"
3. Можно создавать алерты через интерфейс
4. WebSocket показывает real-time обновления

## 🔧 Отладка

- API Health: http://localhost:8090/api/health
- API Alerts: http://localhost:8090/api/alerts
- Логи в консоли браузера
- Логи mock сервера в терминале

## 📁 Структура

```
├── src/                    # React приложение
│   ├── sections/AlertEngineSection.jsx
│   └── services/alertEngineAPI.jsx
└── alert-engine-c/         # C Alert Engine
    ├── mock-server.js      # Express.js mock
    └── src/                # C исходники (для будущей компиляции)
```