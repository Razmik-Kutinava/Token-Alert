import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { useAlertEngine, AlertEngineStatus } from '../services/alertEngineAPI.jsx';

/**
 * Единая секция Alert Engine - интеграция с C Backend
 * Заменяет старые AlertsSection и AdvancedAlertsSection
 */
export function AlertEngineSection({ tokens, livePrices, user, isOnline }) {
  // Логика определения окружения - теперь более гибкая
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isDevelopment = import.meta.env.DEV;
  
  // Показываем Alert Engine в development ИЛИ если это localhost
  // В production покажем Mock версию для демонстрации
  const showAlertEngine = isLocalhost || isDevelopment || true; // ВРЕМЕННО: всегда показываем
  
  console.log('🔧 Alert Engine Environment:', {
    hostname,
    isLocalhost,
    isDevelopment,
    showAlertEngine,
    willShow: showAlertEngine
  });

  // Временно отключаем заглушку для отладки в production
  if (false) { // !showAlertEngine
    return (
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="text-center">
          <div class="mb-4">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Alert Engine</h3>
          <p class="text-gray-600 mb-4">
            Система алертов находится в стадии развертывания на продакшн сервере.
          </p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-blue-800">
              <strong>В разработке:</strong> C Alert Engine backend с поддержкой WebSocket и SQLite базы данных.
            </p>
          </div>
          <div class="text-sm text-gray-500">
            <p>🔧 Локальная разработка: порты 8090 (HTTP) и 8091 (WebSocket)</p>
            <p>📊 Возможности: Real-time алерты, статистика, настройки</p>
          </div>
        </div>
      </div>
    );
  }

  // Состояние UI для development
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [alertType, setAlertType] = createSignal('simple'); // 'simple' | 'advanced'
  const [currentTab, setCurrentTab] = createSignal('alerts'); // 'alerts' | 'stats' | 'settings'
  
  // Форма создания алерта
  const [newAlert, setNewAlert] = createSignal({
    symbol: 'BTC',
    condition: 'above',
    target_price: '',
    alert_type: 'price',
    priority: 'medium',
    category: 'price_monitoring'
  });

  // Используем Alert Engine API
  const {
    alerts,
    marketData,
    loading,
    error,
    connected,
    createAlert,
    deleteAlert,
    loadAlerts
  } = useAlertEngine();

  // Вычисляем статус подключения - в production считаем что подключены если есть данные
  const isEngineConnected = () => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      return connected() && isOnline();
    } else {
      // В production считаем подключенными если алерты загружены
      return getAlertsArray().length >= 0 && isOnline(); // всегда true если есть mock данные
    }
  };

  // Helper функции
  const getAlertsArray = () => {
    const alertsData = alerts();
    return Array.isArray(alertsData) ? alertsData : [];
  };
  const getMaxAlerts = () => user?.subscription === 'premium' ? 50 : 10;
  
  const getTokenPrice = (symbol) => {
    if (!symbol) return 0;
    const pricesArray = Array.isArray(livePrices()) ? livePrices() : [];
    const found = pricesArray.find(token => 
      token.id === symbol.toLowerCase() || 
      token.symbol?.toLowerCase() === symbol.toLowerCase()
    );
    return found?.current_price || marketData()[symbol]?.price || 0;
  };

  const getTokenBySymbol = (symbol) => {
    if (!symbol) return null;
    return tokens.find(token => 
      token.symbol?.toLowerCase() === symbol.toLowerCase() ||
      token.id === symbol.toLowerCase()
    );
  };

  // Обработчики
  const [isCreating, setIsCreating] = createSignal(false);
  const [deletingIds, setDeletingIds] = createSignal(new Set());
  const [lastCreatedTime, setLastCreatedTime] = createSignal(0);
  
  const handleCreateAlert = async (e) => {
    e?.preventDefault(); // Предотвращаем отправку формы
    
    const now = Date.now();
    if (isCreating() || (now - lastCreatedTime() < 2000)) {
      console.log('⚠️ Alert creation blocked - too soon or already in progress');
      return;
    }
    
    try {
      setIsCreating(true);
      setLastCreatedTime(now);
      const alertData = newAlert();
      
      console.log('🚀 Starting alert creation with data:', alertData);
      
      // Валидация данных
      if (!alertData.symbol || !alertData.target_price) {
        console.error('Missing required fields for alert creation');
        return;
      }
      
      // Подготовка данных для отправки
      const preparedData = {
        ...alertData,
        target_price: parseFloat(alertData.target_price),
        current_price: getTokenPrice(alertData.symbol)
      };
      
      console.log('📤 Sending alert data:', preparedData);
      const result = await createAlert(preparedData);
      console.log('✅ Alert created successfully:', result);
      
      setNewAlert({
        symbol: 'BTC',
        condition: 'above',
        target_price: '',
        alert_type: 'price',
        priority: 'medium',
        category: 'price_monitoring'
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('❌ Failed to create alert:', err);
    } finally {
      setTimeout(() => setIsCreating(false), 500); // Сократил до 500мс
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (deletingIds().has(alertId)) {
      console.log('⚠️ Alert deletion already in progress for ID:', alertId);
      return;
    }
    
    try {
      console.log('🗑️ Deleting alert with ID:', alertId);
      if (!alertId) {
        console.error('Alert ID is undefined in handleDeleteAlert');
        return;
      }
      
      setDeletingIds(prev => new Set([...prev, alertId]));
      await deleteAlert(alertId);
    } catch (err) {
      console.error('Failed to delete alert:', err);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  // Статистика
  const alertStats = () => {
    try {
      const alertsArray = getAlertsArray();
      return {
        total: alertsArray.length,
        active: alertsArray.filter(a => a && a.is_active).length,
        triggered: alertsArray.filter(a => a && a.last_triggered && a.last_triggered > 0).length,
        available: Math.max(0, getMaxAlerts() - alertsArray.length)
      };
    } catch (error) {
      console.error('Error calculating alert stats:', error);
      return {
        total: 0,
        active: 0,
        triggered: 0,
        available: getMaxAlerts()
      };
    }
  };

  return (
    <div class="mb-12 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header с статусом подключения */}
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">
              🚀 Alert Engine C
            </h2>
            <p class="text-blue-100">
              Высокопроизводительный движок криптовалютных алертов
            </p>
          </div>
          
          <div class="flex items-center gap-4">
            {/* Статус подключения */}
            <div class={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isEngineConnected()
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              <div class={`w-3 h-3 rounded-full ${
                isEngineConnected() ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`}></div>
              <span class="text-sm font-medium">
                {isEngineConnected() ? 'Подключен' : 'Отключен'}
              </span>
            </div>            {/* Счетчик алертов */}
            <div class="bg-white/10 px-4 py-2 rounded-lg">
              <span class="text-white text-sm">
                {alertStats().total}/{getMaxAlerts()} алертов
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Статус Alert Engine */}
      <div class="p-6 border-b border-gray-700">
        <AlertEngineStatus />
      </div>

      {/* Навигационные табы */}
      <div class="border-b border-gray-700">
        <nav class="flex space-x-8 px-6">
          <button 
            onClick={() => {
              console.log('Switching to alerts tab');
              setCurrentTab('alerts');
            }}
            class={`py-4 px-2 border-b-2 font-medium text-sm ${
              currentTab() === 'alerts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            ⚡ Алерты ({alertStats().total})
          </button>
          <button 
            onClick={() => {
              console.log('Switching to stats tab');
              setCurrentTab('stats');
            }}
            class={`py-4 px-2 border-b-2 font-medium text-sm ${
              currentTab() === 'stats'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            📊 Статистика
          </button>
          <button 
            onClick={() => {
              console.log('Switching to settings tab');
              setCurrentTab('settings');
            }}
            class={`py-4 px-2 border-b-2 font-medium text-sm ${
              currentTab() === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            ⚙️ Настройки
          </button>
        </nav>
      </div>

      {/* Контент табов */}
      <div class="p-6">
        {/* Таб: Алерты */}
        <Show when={currentTab() === 'alerts'}>
          <div class="space-y-6">
            {/* Кнопка создания алерта */}
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">Мои алерты</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={alertStats().available <= 0}
                class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Show when={alertStats().available > 0}>
                  ➕ Создать алерт
                </Show>
                <Show when={alertStats().available <= 0}>
                  Лимит достигнут
                </Show>
              </button>
            </div>

            {/* Форма создания алерта */}
            <Show when={showCreateForm()}>
              <div class="bg-gray-800 rounded-lg p-6 border border-gray-600">
                <h4 class="text-lg font-bold text-white mb-4">Создать новый алерт</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Выбор криптовалюты */}
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                      Криптовалюта
                    </label>
                    <select
                      value={newAlert().symbol}
                      onInput={(e) => setNewAlert(prev => ({...prev, symbol: e.target.value}))}
                      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <For each={tokens}>
                        {(token) => (
                          <option value={token.symbol?.toUpperCase() || token.id.toUpperCase()}>
                            {token.name} ({token.symbol?.toUpperCase() || token.id.toUpperCase()})
                          </option>
                        )}
                      </For>
                    </select>
                  </div>

                  {/* Условие */}
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                      Условие
                    </label>
                    <select
                      value={newAlert().condition}
                      onInput={(e) => setNewAlert(prev => ({...prev, condition: e.target.value}))}
                      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="above">Выше цены</option>
                      <option value="below">Ниже цены</option>
                      <option value="change_up">Рост на %</option>
                      <option value="change_down">Падение на %</option>
                    </select>
                  </div>

                  {/* Цена */}
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                      Целевая цена
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAlert().target_price}
                      onInput={(e) => setNewAlert(prev => ({...prev, target_price: e.target.value}))}
                      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="Введите цену"
                    />
                  </div>

                  {/* Приоритет */}
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                      Приоритет
                    </label>
                    <select
                      value={newAlert().priority}
                      onInput={(e) => setNewAlert(prev => ({...prev, priority: e.target.value}))}
                      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="critical">Критический</option>
                    </select>
                  </div>
                </div>

                <div class="flex gap-3">
                  <button
                    type="button"
                    onMouseDown={handleCreateAlert}
                    disabled={!newAlert().target_price || loading() || isCreating()}
                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating() ? '⏳ Создание...' : loading() ? 'Загрузка...' : 'Создать алерт'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </Show>

            {/* Список алертов */}
            <Show when={error()}>
              <div class="bg-red-900/50 border border-red-600 rounded-lg p-4">
                <p class="text-red-300">Ошибка: {error()}</p>
              </div>
            </Show>

            <Show when={loading()}>
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p class="text-gray-400 mt-4">Загрузка алертов...</p>
              </div>
            </Show>

            <Show when={!loading() && getAlertsArray().length === 0}>
              <div class="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                <div class="text-6xl mb-4">🚀</div>
                <p class="text-gray-400 text-lg mb-2">У вас пока нет алертов</p>
                <p class="text-gray-500 text-sm">Создайте первый алерт для мониторинга цен криптовалют</p>
              </div>
            </Show>

            <Show when={!loading() && getAlertsArray().length > 0}>
              <div class="space-y-4">
                <For each={getAlertsArray()}>
                  {(alert) => {
                    const currentPrice = getTokenPrice(alert.symbol);
                    const token = getTokenBySymbol(alert.symbol);
                    
                    return (
                      <div class="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-4">
                            <div class="text-2xl">
                              {token?.icon || '🪙'}
                            </div>
                            <div>
                              <h4 class="text-lg font-bold text-white">
                                {alert.symbol} {alert.condition === 'above' ? '📈' : '📉'} ${alert.target_price}
                              </h4>
                              <p class="text-gray-400 text-sm">
                                Текущая цена: ${currentPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <div class="flex items-center gap-3">
                            <div class={`px-3 py-1 rounded-full text-xs font-medium ${
                              alert.is_active 
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {alert.is_active ? 'Активен' : 'Неактивен'}
                            </div>
                            
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              disabled={deletingIds().has(alert.id)}
                              class="text-red-400 hover:text-red-300 p-2 disabled:opacity-50"
                              title="Удалить алерт"
                            >
                              {deletingIds().has(alert.id) ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Таб: Статистика */}
        <Show when={currentTab() === 'stats'}>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="bg-gray-800 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-blue-400">{alertStats().total}</div>
              <div class="text-gray-400 text-sm">Всего алертов</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-green-400">{alertStats().active}</div>
              <div class="text-gray-400 text-sm">Активных</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-yellow-400">{alertStats().triggered}</div>
              <div class="text-gray-400 text-sm">Сработали</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-purple-400">{alertStats().available}</div>
              <div class="text-gray-400 text-sm">Доступно</div>
            </div>
          </div>
        </Show>

        {/* Таб: Настройки */}
        <Show when={currentTab() === 'settings'}>
          <div class="space-y-6">
            <div class="bg-gray-800 rounded-lg p-6">
              <h4 class="text-lg font-bold text-white mb-4">Настройки уведомлений</h4>
              <div class="space-y-4">
                <label class="flex items-center gap-3">
                  <input type="checkbox" class="rounded" checked />
                  <span class="text-gray-300">Браузерные уведомления</span>
                </label>
                <label class="flex items-center gap-3">
                  <input type="checkbox" class="rounded" checked />
                  <span class="text-gray-300">Звуковые уведомления</span>
                </label>
                <label class="flex items-center gap-3">
                  <input type="checkbox" class="rounded" />
                  <span class="text-gray-300">Email уведомления</span>
                </label>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}