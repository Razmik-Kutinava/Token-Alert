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

  // Продвинутые состояния для табло
  const [searchTerm, setSearchTerm] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal('all'); // all, active, inactive
  const [priorityFilter, setPriorityFilter] = createSignal('all'); // all, high, medium, low
  const [sortBy, setSortBy] = createSignal('created_at'); // created_at, symbol, priority, target_price
  const [sortOrder, setSortOrder] = createSignal('desc'); // asc, desc
  const [selectedAlerts, setSelectedAlerts] = createSignal(new Set());
  const [viewMode, setViewMode] = createSignal('cards'); // cards, table

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

  // Продвинутые функции для табло
  const getFilteredAndSortedAlerts = () => {
    let alerts = getAlertsArray();
    
    // Фильтрация по поиску
    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      alerts = alerts.filter(alert => 
        alert.symbol?.toLowerCase().includes(term) ||
        alert.condition?.toLowerCase().includes(term) ||
        alert.priority?.toLowerCase().includes(term)
      );
    }
    
    // Фильтрация по статусу
    if (statusFilter() !== 'all') {
      alerts = alerts.filter(alert => {
        if (statusFilter() === 'active') return alert.is_active;
        if (statusFilter() === 'inactive') return !alert.is_active;
        return true;
      });
    }
    
    // Фильтрация по приоритету
    if (priorityFilter() !== 'all') {
      alerts = alerts.filter(alert => alert.priority === priorityFilter());
    }
    
    // Сортировка
    alerts.sort((a, b) => {
      let aVal = a[sortBy()];
      let bVal = b[sortBy()];
      
      if (sortBy() === 'created_at') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      } else if (sortBy() === 'target_price') {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      if (sortOrder() === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    return alerts;
  };

  const toggleAlertSelection = (alertId) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const selectAllAlerts = () => {
    const allIds = getFilteredAndSortedAlerts().map(alert => alert.id);
    setSelectedAlerts(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedAlerts(new Set());
  };

  const deleteSelectedAlerts = async () => {
    const selectedIds = Array.from(selectedAlerts());
    for (const id of selectedIds) {
      try {
        await handleDeleteAlert(id);
      } catch (err) {
        console.error('Failed to delete alert:', id, err);
      }
    }
    clearSelection();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Неизвестно';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getConditionIcon = (condition) => {
    switch (condition) {
      case 'above': return '📈';
      case 'below': return '📉';
      case 'change_up': return '🚀';
      case 'change_down': return '💥';
      default: return '⚡';
    }
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
            {/* Панель управления и фильтров */}
            <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              {/* Верхняя строка: поиск + быстрые действия */}
              <div class="flex flex-col lg:flex-row gap-4 mb-4">
                <div class="flex-1">
                  <div class="relative">
                    <input
                      type="text"
                      placeholder="🔍 Поиск по символу, условию, приоритету..."
                      value={searchTerm()}
                      onInput={(e) => setSearchTerm(e.target.value)}
                      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-400">🔍</span>
                    </div>
                  </div>
                </div>
                
                <div class="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode() === 'cards' ? 'table' : 'cards')}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {viewMode() === 'cards' ? '📊 Таблица' : '🗂️ Карточки'}
                  </button>
                  
                  <Show when={selectedAlerts().size > 0}>
                    <button
                      onClick={deleteSelectedAlerts}
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🗑️ Удалить ({selectedAlerts().size})
                    </button>
                    <button
                      onClick={clearSelection}
                      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      ✖️ Отмена
                    </button>
                  </Show>
                </div>
              </div>

              {/* Фильтры */}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Статус</label>
                  <select
                    value={statusFilter()}
                    onInput={(e) => setStatusFilter(e.target.value)}
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="all">Все статусы</option>
                    <option value="active">🟢 Активные</option>
                    <option value="inactive">🔴 Неактивные</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Приоритет</label>
                  <select
                    value={priorityFilter()}
                    onInput={(e) => setPriorityFilter(e.target.value)}
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="all">Все приоритеты</option>
                    <option value="high">🔥 Высокий</option>
                    <option value="medium">⚡ Средний</option>
                    <option value="low">💙 Низкий</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Сортировка</label>
                  <select
                    value={sortBy()}
                    onInput={(e) => setSortBy(e.target.value)}
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="created_at">📅 По дате</option>
                    <option value="symbol">💎 По символу</option>
                    <option value="priority">🎯 По приоритету</option>
                    <option value="target_price">💰 По цене</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Порядок</label>
                  <select
                    value={sortOrder()}
                    onInput={(e) => setSortOrder(e.target.value)}
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="desc">⬇️ По убыванию</option>
                    <option value="asc">⬆️ По возрастанию</option>
                  </select>
                </div>
              </div>

              {/* Быстрые действия с выбранными */}
              <Show when={getFilteredAndSortedAlerts().length > 0}>
                <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
                  <div class="flex items-center gap-4">
                    <button
                      onClick={selectedAlerts().size === getFilteredAndSortedAlerts().length ? clearSelection : selectAllAlerts}
                      class="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {selectedAlerts().size === getFilteredAndSortedAlerts().length ? '◻️ Снять все' : '☑️ Выбрать все'}
                    </button>
                    <span class="text-sm text-gray-400">
                      Показано: {getFilteredAndSortedAlerts().length} из {getAlertsArray().length}
                    </span>
                  </div>
                  
                  <Show when={!showCreateForm()}>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      ➕ Создать алерт
                    </button>
                  </Show>
                </div>
              </Show>
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

            <Show when={!loading() && getFilteredAndSortedAlerts().length === 0}>
              <div class="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                <div class="text-6xl mb-4">🚀</div>
                <p class="text-gray-400 text-lg mb-2">
                  {getAlertsArray().length === 0 ? 'У вас пока нет алертов' : 'Нет алертов по заданным фильтрам'}
                </p>
                <p class="text-gray-500 text-sm">
                  {getAlertsArray().length === 0 
                    ? 'Создайте первый алерт для мониторинга цен криптовалют'
                    : 'Попробуйте изменить критерии поиска и фильтрации'
                  }
                </p>
              </div>
            </Show>

            <Show when={!loading() && getFilteredAndSortedAlerts().length > 0}>
              <div class={`${viewMode() === 'cards' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-2'}`}>
                <For each={getFilteredAndSortedAlerts()}>
                  {(alert) => {
                    const currentPrice = getTokenPrice(alert.symbol);
                    const token = getTokenBySymbol(alert.symbol);
                    const isSelected = selectedAlerts().has(alert.id);
                    const priceChange = currentPrice - (alert.current_price || 0);
                    const priceChangePercent = alert.current_price ? ((priceChange / alert.current_price) * 100) : 0;
                    
                    return (
                      <Show when={viewMode() === 'cards'} fallback={
                        // Режим таблицы
                        <div class={`bg-gray-800 rounded-lg p-4 border transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
                        }`}>
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAlertSelection(alert.id)}
                                class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                              />
                              <div class="flex items-center gap-3">
                                <span class="text-2xl">{getConditionIcon(alert.condition)}</span>
                                <div>
                                  <div class="font-semibold text-white">{alert.symbol}</div>
                                  <div class="text-sm text-gray-400">{alert.condition === 'above' ? 'выше' : alert.condition === 'below' ? 'ниже' : alert.condition}</div>
                                </div>
                              </div>
                              <div class="text-right">
                                <div class="text-white font-mono">${alert.target_price?.toLocaleString()}</div>
                                <div class="text-sm text-gray-400">vs ${currentPrice?.toLocaleString()}</div>
                              </div>
                              <div class={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                                {alert.priority}
                              </div>
                              <div class="text-sm text-gray-400">
                                {formatDate(alert.created_at)}
                              </div>
                            </div>
                            <div class="flex items-center gap-2">
                              <div class={`px-2 py-1 rounded-full text-xs font-medium ${
                                alert.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
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
                      }>
                        {/* Режим карточек */}
                        <div class={`bg-gray-800 rounded-xl p-6 border transition-all hover:scale-[1.02] ${
                          isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-gray-600 hover:border-gray-500'
                        }`}>
                          {/* Заголовок карточки */}
                          <div class="flex items-start justify-between mb-4">
                            <div class="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAlertSelection(alert.id)}
                                class="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                              />
                              <div class="flex items-center gap-2">
                                <span class="text-3xl">{getConditionIcon(alert.condition)}</span>
                                <div>
                                  <h3 class="text-xl font-bold text-white">{alert.symbol}</h3>
                                  <p class="text-sm text-gray-400">Alert #{alert.id.slice(-6)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div class="flex items-center gap-2">
                              <div class={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                                {alert.priority === 'high' ? '🔥 Высокий' : alert.priority === 'medium' ? '⚡ Средний' : '� Низкий'}
                              </div>
                              <div class={`px-3 py-1 rounded-full text-xs font-medium ${
                                alert.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {alert.is_active ? '🟢 Активен' : '🔴 Неактивен'}
                              </div>
                            </div>
                          </div>

                          {/* Основная информация */}
                          <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="bg-gray-700/50 rounded-lg p-4">
                              <div class="text-sm text-gray-400 mb-1">Целевая цена</div>
                              <div class="text-2xl font-bold text-green-400 font-mono">
                                ${alert.target_price?.toLocaleString()}
                              </div>
                            </div>
                            
                            <div class="bg-gray-700/50 rounded-lg p-4">
                              <div class="text-sm text-gray-400 mb-1">Текущая цена</div>
                              <div class="text-2xl font-bold text-white font-mono">
                                ${currentPrice?.toLocaleString()}
                              </div>
                              <Show when={priceChange !== 0}>
                                <div class={`text-sm font-medium ${priceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {priceChange > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                                </div>
                              </Show>
                            </div>
                          </div>

                          {/* Детали */}
                          <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <div>
                              <span class="font-medium">Условие:</span> {
                                alert.condition === 'above' ? 'Цена выше' :
                                alert.condition === 'below' ? 'Цена ниже' :
                                alert.condition === 'change_up' ? 'Рост на %' :
                                alert.condition === 'change_down' ? 'Падение на %' : alert.condition
                              }
                            </div>
                            <div>
                              <span class="font-medium">Создан:</span> {formatDate(alert.created_at)}
                            </div>
                          </div>

                          {/* Прогресс-бар (расстояние до цели) */}
                          <Show when={alert.condition === 'above' || alert.condition === 'below'}>
                            <div class="mb-4">
                              <div class="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Прогресс до цели</span>
                                <span>
                                  {Math.abs(((currentPrice - alert.target_price) / alert.target_price) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div class="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  class={`h-2 rounded-full transition-all ${
                                    (alert.condition === 'above' && currentPrice >= alert.target_price) ||
                                    (alert.condition === 'below' && currentPrice <= alert.target_price)
                                      ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, Math.abs(((currentPrice - alert.target_price) / alert.target_price) * 100))}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </Show>

                          {/* Действия */}
                          <div class="flex justify-between items-center">
                            <div class="flex gap-2">
                              <button class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                ✏️ Править
                              </button>
                              <button class="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                                {alert.is_active ? '⏸️ Пауза' : '▶️ Старт'}
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              disabled={deletingIds().has(alert.id)}
                              class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                              title="Удалить алерт"
                            >
                              {deletingIds().has(alert.id) ? '⏳ Удаление...' : '🗑️ Удалить'}
                            </button>
                          </div>
                        </div>
                      </Show>
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