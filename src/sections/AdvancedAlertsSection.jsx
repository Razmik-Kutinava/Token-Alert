import { For, Show, createSignal } from 'solid-js';
import { Priority, AlertCategory, TimeFrame } from '../models/AlertTypes';
import { AdvancedAlertBuilder } from '../components/AdvancedAlertBuilder';

/**
 * Секция продвинутых алертов
 */
export function AdvancedAlertsSection({
  alerts,
  tokens,
  livePrices,
  onCreateAlert,
  onUpdateAlert,
  onDeleteAlert,
  onPauseAlert,
  onResumeAlert
}) {
  const [showBuilder, setShowBuilder] = createSignal(false);
  const [filterCategory, setFilterCategory] = createSignal('all');
  const [filterPriority, setFilterPriority] = createSignal('all');
  const [expandedAlert, setExpandedAlert] = createSignal(null);

  /**
   * Фильтрованные алерты
   */
  const filteredAlerts = () => {
    let filtered = alerts();
    
    if (filterCategory() !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory());
    }
    
    if (filterPriority() !== 'all') {
      filtered = filtered.filter(a => a.priority === filterPriority());
    }
    
    return filtered;
  };

  /**
   * Статистика алертов
   */
  const alertsStats = () => {
    const all = alerts();
    return {
      total: all.length,
      active: all.filter(a => a.isActive && !a.isPaused).length,
      paused: all.filter(a => a.isPaused).length,
      triggered: all.filter(a => a.triggeredCount > 0).length
    };
  };

  /**
   * Получить текущую цену токена
   */
  const getCurrentPrice = (tokenId) => {
    return livePrices()[tokenId]?.usd || 0;
  };

  /**
   * Форматирование даты
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Форматирование временного фрейма
   */
  const formatTimeFrame = (timeFrame) => {
    const frames = {
      [TimeFrame.MINUTE_5]: '5 мин',
      [TimeFrame.MINUTE_15]: '15 мин',
      [TimeFrame.HOUR_1]: '1 час',
      [TimeFrame.HOUR_4]: '4 часа',
      [TimeFrame.HOUR_24]: '24 часа',
      [TimeFrame.DAY_7]: '7 дней',
      [TimeFrame.DAY_30]: '30 дней'
    };
    return frames[timeFrame] || timeFrame;
  };

  /**
   * Получить информацию о категории
   */
  const getCategoryInfo = (categoryId) => {
    const categories = {
      portfolio: { name: 'Портфель', icon: '💼', color: 'blue' },
      market: { name: 'Рынок', icon: '📊', color: 'green' },
      trading: { name: 'Трейдинг', icon: '📈', color: 'purple' },
      news: { name: 'Новости', icon: '📰', color: 'yellow' }
    };
    return categories[categoryId] || categories.portfolio;
  };

  /**
   * Получить информацию о приоритете
   */
  const getPriorityInfo = (priorityLevel) => {
    return Priority[priorityLevel.toUpperCase()] || Priority.MEDIUM;
  };

  /**
   * Форматирование условий
   */
  const formatConditions = (alert) => {
    if (!alert.conditions || alert.conditions.length === 0) {
      return 'Условия не заданы';
    }

    const operatorNames = {
      above: 'Выше',
      below: 'Ниже',
      equals: 'Равно',
      increases_by: 'Рост на',
      decreases_by: 'Падение на',
      spike: 'Всплеск',
      change: 'Изменение на'
    };

    return alert.conditions.map(c => {
      const operator = operatorNames[c.operator] || c.operator;
      const value = c.field === 'price' ? `$${c.value}` : c.value;
      return `${operator} ${value}`;
    }).join(', ');
  };

  /**
   * Обработка создания алерта
   */
  const handleCreateAlert = (alertData) => {
    onCreateAlert(alertData);
    setShowBuilder(false);
  };

  return (
    <div class="space-y-6">
      {/* Заголовок и статистика */}
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold mb-2">
            🚀 Продвинутые алерты
          </h2>
          <p class="text-gray-400">
            Мощная система мониторинга с комплексными условиями
          </p>
        </div>

        <button
          onClick={() => setShowBuilder(!showBuilder())}
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          {showBuilder() ? '✕ Закрыть' : '➕ Создать алерт'}
        </button>
      </div>

      {/* Статистика */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-dark-card rounded-lg p-4 border border-gray-700">
          <div class="text-gray-400 text-sm mb-1">Всего алертов</div>
          <div class="text-2xl font-bold">{alertsStats().total}</div>
        </div>
        <div class="bg-dark-card rounded-lg p-4 border border-green-500/30">
          <div class="text-gray-400 text-sm mb-1">Активных</div>
          <div class="text-2xl font-bold text-green-400">{alertsStats().active}</div>
        </div>
        <div class="bg-dark-card rounded-lg p-4 border border-yellow-500/30">
          <div class="text-gray-400 text-sm mb-1">На паузе</div>
          <div class="text-2xl font-bold text-yellow-400">{alertsStats().paused}</div>
        </div>
        <div class="bg-dark-card rounded-lg p-4 border border-purple-500/30">
          <div class="text-gray-400 text-sm mb-1">Сработало</div>
          <div class="text-2xl font-bold text-purple-400">{alertsStats().triggered}</div>
        </div>
      </div>

      {/* Конструктор алертов */}
      <Show when={showBuilder()}>
        <AdvancedAlertBuilder
          tokens={tokens}
          onCreateAlert={handleCreateAlert}
          onCancel={() => setShowBuilder(false)}
        />
      </Show>

      {/* Фильтры */}
      <div class="bg-dark-card rounded-lg p-4 border border-gray-700">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-gray-400 mb-2">Категория</label>
            <select
              value={filterCategory()}
              onInput={(e) => setFilterCategory(e.target.value)}
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              <option value="portfolio">💼 Портфель</option>
              <option value="market">📊 Рынок</option>
              <option value="trading">📈 Трейдинг</option>
              <option value="news">📰 Новости</option>
            </select>
          </div>

          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-gray-400 mb-2">Приоритет</label>
            <select
              value={filterPriority()}
              onInput={(e) => setFilterPriority(e.target.value)}
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все приоритеты</option>
              <option value="critical">🔴 Критический</option>
              <option value="high">🟠 Важный</option>
              <option value="medium">🟡 Средний</option>
              <option value="low">🟢 Информационный</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список алертов */}
      <div class="space-y-4">
        <Show
          when={filteredAlerts().length > 0}
          fallback={
            <div class="bg-dark-card rounded-lg p-12 border border-gray-700 text-center">
              <div class="text-6xl mb-4">🔔</div>
              <h3 class="text-xl font-semibold mb-2">Алертов пока нет</h3>
              <p class="text-gray-400 mb-6">
                Создайте свой первый продвинутый алерт для мониторинга рынка
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Создать первый алерт
              </button>
            </div>
          }
        >
          <For each={filteredAlerts()}>
            {(alert) => {
              const priority = getPriorityInfo(alert.priority);
              const category = getCategoryInfo(alert.category);
              const isExpanded = expandedAlert() === alert.id;
              const currentPrice = getCurrentPrice(alert.tokenId);

              return (
                <div 
                  class={`bg-dark-card rounded-lg border-2 transition-all ${
                    alert.isPaused
                      ? 'border-gray-700 opacity-60'
                      : alert.triggeredCount > 0
                      ? 'border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* Заголовок алерта */}
                  <div class="p-4">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="text-2xl">{priority.icon}</span>
                          <span class={`px-2 py-1 rounded text-xs font-semibold bg-${category.color}-500/20 text-${category.color}-400`}>
                            {category.icon} {category.name}
                          </span>
                          <Show when={alert.isPaused}>
                            <span class="px-2 py-1 rounded text-xs font-semibold bg-gray-500/20 text-gray-400">
                              ⏸️ Пауза
                            </span>
                          </Show>
                          <Show when={alert.triggeredCount > 0}>
                            <span class="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                              ✅ Сработал {alert.triggeredCount}x
                            </span>
                          </Show>
                        </div>

                        <h3 class="text-lg font-bold mb-1">{alert.name}</h3>
                        <p class="text-sm text-gray-400 mb-2">{alert.description}</p>

                        <div class="flex flex-wrap gap-4 text-sm">
                          <div class="flex items-center gap-2">
                            <span class="text-gray-400">Токен:</span>
                            <span class="font-semibold">{alert.tokenName} ({alert.tokenSymbol?.toUpperCase()})</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-gray-400">Цена:</span>
                            <span class="font-semibold">${currentPrice.toFixed(6)}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-gray-400">Период:</span>
                            <span class="font-semibold">{formatTimeFrame(alert.timeFrame)}</span>
                          </div>
                        </div>

                        <div class="mt-2 text-sm text-gray-400">
                          Условия: {formatConditions(alert)}
                        </div>
                      </div>

                      {/* Кнопки управления */}
                      <div class="flex flex-col gap-2">
                        <button
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                          class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                        <button
                          onClick={() => alert.isPaused ? onResumeAlert(alert.id) : onPauseAlert(alert.id)}
                          class={`px-3 py-1 rounded transition-colors text-sm ${
                            alert.isPaused
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-yellow-600 hover:bg-yellow-700'
                          }`}
                        >
                          {alert.isPaused ? '▶️' : '⏸️'}
                        </button>
                        <button
                          onClick={() => onDeleteAlert(alert.id)}
                          class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Расширенная информация */}
                    <Show when={isExpanded}>
                      <div class="mt-4 pt-4 border-t border-gray-700 space-y-3">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="text-gray-400">Создан:</span>
                            <div class="font-semibold">{formatDate(alert.createdAt)}</div>
                          </div>
                          <div>
                            <span class="text-gray-400">Обновлен:</span>
                            <div class="font-semibold">{formatDate(alert.updatedAt)}</div>
                          </div>
                          <Show when={alert.lastTriggered}>
                            <div class="col-span-2">
                              <span class="text-gray-400">Последнее срабатывание:</span>
                              <div class="font-semibold text-green-400">{formatDate(alert.lastTriggered)}</div>
                            </div>
                          </Show>
                        </div>

                        <Show when={alert.tags && alert.tags.length > 0}>
                          <div>
                            <span class="text-gray-400 text-sm">Теги:</span>
                            <div class="flex flex-wrap gap-2 mt-1">
                              <For each={alert.tags}>
                                {(tag) => (
                                  <span class="px-2 py-1 bg-gray-700 rounded text-xs">
                                    #{tag}
                                  </span>
                                )}
                              </For>
                            </div>
                          </div>
                        </Show>

                        <div class="text-xs text-gray-500">
                          Каналы уведомлений: {alert.notificationChannels.join(', ')}
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </Show>
      </div>
    </div>
  );
}
