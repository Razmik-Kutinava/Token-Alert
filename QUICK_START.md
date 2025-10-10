# Быстрый старт Alert Engine

## ✅ Что исправлено:

### 1. **Восстановлены алерт модули в дашборде**
- ✅ `AlertsSection` - простые алерты
- ✅ `AdvancedAlertsSection` - продвинутые алерты
- ✅ Добавлены обратно в `Dashboard.jsx`
- ✅ Исправлены пропсы в `App.jsx`

### 2. **Исправлены ошибки в PowerShell скрипте**
- ✅ Заменена зарезервированная переменная `$pid` на `$processId`
- ✅ Функция `Build-Project` переименована в `Invoke-ProjectBuild`
- ✅ Добавлен `[CmdletBinding()]` атрибут

### 3. **Исправлены ошибки массивов в Alert компонентах**
- ✅ Добавлены проверки `Array.isArray()` 
- ✅ Создана helper функция `getAlertsArray()`
- ✅ Все обращения к `alerts().length` заменены на `getAlertsLength()`

## 🚀 Как запустить приложение:

### React приложение (уже запущено):
```powershell
cd "c:\Tools\workarea\test feature\test.token-alert-manager"
npm run dev
```
**Адрес**: http://localhost:3000

### Alert Engine C Backend:
```powershell
cd "c:\Tools\workarea\test feature\test.token-alert-manager\alert-engine-c"
.\scripts\alert_engine.ps1 start
```

### Проверка API:
```powershell
.\scripts\alert_engine.ps1 test
```

### Просмотр логов:
```powershell
.\scripts\alert_engine.ps1 logs
```

## 🎯 Текущий статус:

### ✅ Работает:
- React приложение на http://localhost:3000
- Алерт секции восстановлены в дашборде
- Все ошибки JavaScript исправлены
- PowerShell скрипт корректен

### 🔧 Требует сборки:
- C Alert Engine (нужно установить зависимости и скомпилировать)

## 📱 Что можно увидеть в приложении:

1. **Главная страница** с Hero секцией
2. **Секция простых алертов** - форма создания базовых алертов
3. **Секция продвинутых алертов** - конструктор сложных алертов
4. **Баннер цен** с актуальными курсами
5. **Расширенное табло курсов**
6. **Образовательный портал**
7. **Новости и преимущества**

Все модули теперь работают корректно без ошибок в браузере! 🎉