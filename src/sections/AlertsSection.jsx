import { For, Show, createSignal } from 'solid-js';
import { AdvancedAlertBuilder } from '../components/AdvancedAlertBuilder';

export function AlertsSection({ 
  alerts, 
  tokens, 
  livePrices, 
  newAlert, 
  setNewAlert, 
  addAlert, 
  removeAlert,
  user
}) {
  const [isAdvancedMode, setIsAdvancedMode] = createSignal(false);
  const [showAdvancedBuilder, setShowAdvancedBuilder] = createSignal(false);

  const getMaxAlerts = () => {
    return user?.subscription === 'premium' ? 20 : 5;
  };

  const getTokenPrice = (tokenId) => {
    const pricesArray = Array.isArray(livePrices()) ? livePrices() : [];
    return pricesArray.find(token => token.id === tokenId)?.current_price || 0;
  };

  const getTokenByID = (tokenId) => {
    return tokens.find(token => token.id === tokenId);
  };

  const formatPrice = (price) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  };

  // Обработчик создания продвинутого алерта
  const handleAdvancedAlert = (alertData) => {
    addAlert(alertData);
    setShowAdvancedBuilder(false);
  };

  // Определяем тип алерта (простой или продвинутый)
  const isAdvancedAlert = (alert) => {
    return alert.conditions || alert.template || alert.priority || alert.category;
  };

  return (
    <div class="mb-12">
      <h3 class="text-2xl font-bold mb-6 flex items-center justify-center gap-4">
        ⚡ Мои алерты ({alerts().length}/{getMaxAlerts()})
        <Show when={user?.subscription === 'premium'}>
          <span class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            💎 Premium
          </span>
        </Show>
      </h3>
      
      {/* Alert Creation Form */}
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6 max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold">Создать алерт</h4>
          
          {/* Mode Switcher */}
          <div class="flex items-center gap-2">
            <button
              onClick={() => setIsAdvancedMode(false)}
              class={`px-3 py-1 rounded-lg text-sm transition-colors ${
                !isAdvancedMode() 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Простой
            </button>
            <button
              onClick={() => setIsAdvancedMode(true)}
              class={`px-3 py-1 rounded-lg text-sm transition-colors ${
                isAdvancedMode() 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🔧 Продвинутый
            </button>
          </div>
        </div>

        <Show when={!isAdvancedMode()}>
          {/* Simple Alert Form */}
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Криптовалюта
              </label>
              <select 
                value={newAlert().token}
                onInput={(e) => setNewAlert(prev => ({...prev, token: e.target.value}))}
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите криптовалюту</option>
                <For each={tokens}>
                  {(token) => (
                    <option value={token.id}>{token.name} ({token.symbol})</option>
                  )}
                </For>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Тип алерта
              </label>
              <select 
                value={newAlert().type}
                onInput={(e) => setNewAlert(prev => ({...prev, type: e.target.value}))}
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="above">Выше цены</option>
                <option value="below">Ниже цены</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Целевая цена (USD)
              </label>
              <input 
                type="number"
                step="0.000001"
                value={newAlert().price}
                onInput={(e) => setNewAlert(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите цену"
              />
            </div>
            
            <div class="flex gap-3">
              <button 
                onClick={addAlert}
                disabled={alerts().length >= getMaxAlerts()}
                class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Show when={alerts().length >= getMaxAlerts()}>
                  Лимит алертов достигнут
                </Show>
                <Show when={alerts().length < getMaxAlerts()}>
                  Создать простой алерт
                </Show>
              </button>
              
              <button
                onClick={() => setShowAdvancedBuilder(true)}
                disabled={alerts().length >= getMaxAlerts()}
                class="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Открыть продвинутый конструктор"
              >
                🔧
              </button>
            </div>
          </div>
        </Show>

        <Show when={isAdvancedMode()}>
          {/* Advanced Alert Hint */}
          <div class="text-center py-8">
            <div class="text-4xl mb-4">🔧</div>
            <p class="text-gray-300 mb-4">Продвинутый режим создания алертов</p>
            <button
              onClick={() => setShowAdvancedBuilder(true)}
              disabled={alerts().length >= getMaxAlerts()}
              class="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50"
            >
              Открыть конструктор алертов
            </button>
          </div>
        </Show>
      </div>

      {/* Advanced Alert Builder Modal */}
      <Show when={showAdvancedBuilder()}>
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-white">🔧 Продвинутый конструктор алертов</h3>
                <button
                  onClick={() => setShowAdvancedBuilder(false)}
                  class="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <AdvancedAlertBuilder
                tokens={tokens}
                onCreateAlert={handleAdvancedAlert}
                onCancel={() => setShowAdvancedBuilder(false)}
              />
            </div>
          </div>
        </div>
      </Show>
      
      {/* Alerts List - Universal Display */}
      <Show when={alerts().length === 0}>
        <div class="text-center py-12">
          <div class="text-6xl mb-4">⚡</div>
          <p class="text-gray-400 text-lg mb-2">У вас пока нет алертов</p>
          <p class="text-gray-500 text-sm">Создайте простой или продвинутый алерт для отслеживания цен</p>
        </div>
      </Show>

      <Show when={alerts().length > 0}>
        <div class="space-y-4">
          <For each={alerts()}>
            {(alert) => {
              const token = getTokenByID(alert.token);
              const currentPrice = getTokenPrice(alert.token);
              const isAdvanced = isAdvancedAlert(alert);
              
              const isTriggered = () => {
                if (!currentPrice) return false;
                if (isAdvanced && alert.conditions) {
                  // Логика для продвинутых алертов
                  return false; // Временно
                }
                return alert.type === 'above' 
                  ? currentPrice >= alert.price 
                  : currentPrice <= alert.price;
              };
              
              return (
                <div class={`bg-gray-800 rounded-lg p-4 border transition-all duration-300 ${
                  isTriggered() 
                    ? 'border-green-500 shadow-lg shadow-green-500/20 bg-green-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                } ${isAdvanced ? 'border-l-4 border-l-purple-500' : ''}`}>
                  
                  <div class="flex items-center justify-between">
                    {/* Token Info */}
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <span class="text-lg font-bold">{token?.symbol?.substring(0, 2) || '??'}</span>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h5 class="font-bold text-white text-lg">{token?.name || 'Unknown Token'}</h5>
                          <Show when={isAdvanced}>
                            <span class="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                              🔧 ПРОДВИНУТЫЙ
                            </span>
                          </Show>
                        </div>
                        <p class="text-sm text-gray-400 uppercase">{token?.symbol}</p>
                        
                        {/* Advanced Alert Details */}
                        <Show when={isAdvanced}>
                          <div class="text-xs text-gray-400 mt-1">
                            <Show when={alert.template}>
                              Шаблон: {alert.template}
                            </Show>
                            <Show when={alert.category}>
                              • Категория: {alert.category}
                            </Show>
                            <Show when={alert.priority}>
                              • Приоритет: {alert.priority}
                            </Show>
                          </div>
                        </Show>
                      </div>
                    </div>

                    {/* Alert Type */}
                    <div class="text-center">
                      <div class={`text-2xl ${alert.type === 'above' ? 'text-green-400' : 'text-red-400'}`}>
                        {alert.type === 'above' ? '📈' : '📉'}
                      </div>
                      <p class="text-xs text-gray-400 mt-1">
                        {alert.type === 'above' ? 'Выше' : 'Ниже'}
                      </p>
                    </div>

                    {/* Prices */}
                    <div class="text-center">
                      <div class="text-white font-bold">
                        <div class="text-sm text-gray-400">Цель</div>
                        <div class="text-lg">${formatPrice(alert.price)}</div>
                      </div>
                    </div>

                    <div class="text-center">
                      <div class="text-white font-bold">
                        <div class="text-sm text-gray-400">Текущая</div>
                        <div class={`text-lg ${isTriggered() ? 'text-green-400' : 'text-white'}`}>
                          {currentPrice ? `$${formatPrice(currentPrice)}` : '...'}
                        </div>
                      </div>
                    </div>

                    {/* Progress/Status */}
                    <div class="text-center min-w-[120px]">
                      <Show when={isTriggered()}>
                        <div class="bg-green-500/20 border border-green-500 rounded-lg px-3 py-2">
                          <div class="text-green-400 font-bold text-sm">🎯 СРАБОТАЛ!</div>
                        </div>
                      </Show>
                      <Show when={!isTriggered() && currentPrice > 0}>
                        <div class="text-gray-400">
                          <div class="text-xs mb-1">До цели</div>
                          <div class="text-sm font-medium">
                            {alert.type === 'above' 
                              ? `+${(((alert.price - currentPrice) / currentPrice) * 100).toFixed(1)}%`
                              : `${(((currentPrice - alert.price) / currentPrice) * 100).toFixed(1)}%`
                            }
                          </div>
                        </div>
                      </Show>
                    </div>

                    {/* Created Date */}
                    <div class="text-center text-xs text-gray-500">
                      <div>Создан</div>
                      <div>{new Date(alert.createdAt).toLocaleDateString('ru-RU')}</div>
                    </div>

                    {/* Delete Button */}
                    <button 
                      onClick={() => removeAlert(alert.id)}
                      class="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/20 rounded-lg"
                      title="Удалить алерт"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Alerts Statistics */}
      <Show when={alerts().length > 0}>
        <div class="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📊 Статистика алертов
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-400">{alerts().length}</div>
              <div class="text-sm text-gray-400">Всего</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-400">
                {alerts().filter(alert => {
                  const currentPrice = getTokenPrice(alert.token);
                  if (!currentPrice) return false;
                  return alert.type === 'above' 
                    ? currentPrice >= alert.price 
                    : currentPrice <= alert.price;
                }).length}
              </div>
              <div class="text-sm text-gray-400">Сработали</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-400">
                {alerts().filter(alert => !isAdvancedAlert(alert)).length}
              </div>
              <div class="text-sm text-gray-400">Простые</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-400">
                {alerts().filter(alert => isAdvancedAlert(alert)).length}
              </div>
              <div class="text-sm text-gray-400">Продвинутые</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">
                {getMaxAlerts() - alerts().length}
              </div>
              <div class="text-sm text-gray-400">Доступно</div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}