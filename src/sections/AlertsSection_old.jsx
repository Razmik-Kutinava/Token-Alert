import { For, Show } from 'solid-js';

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
  const getMaxAlerts = () => {
    return user?.subscription === 'premium' ? 20 : 5;
  };

  const getTokenPrice = (tokenId) => {
    return livePrices()?.find(token => token.id === tokenId)?.current_price || 0;
  };

  const getTokenByID = (tokenId) => {
    return tokens.find(token => token.id === tokenId);
  };

  const formatPrice = (price) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
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
      
      {/* Add Alert Form */}
      <div class="bg-dark-card rounded-xl p-6 border border-gray-700 mb-6 max-w-md mx-auto">
        <h4 class="text-lg font-semibold mb-4">Создать новый алерт</h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Криптовалюта
            </label>
            <select 
              value={newAlert().token}
              onInput={(e) => setNewAlert(prev => ({...prev, token: e.target.value}))}
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите цену"
            />
          </div>
          
          <button 
            onClick={addAlert}
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Создать алерт
          </button>
        </div>
      </div>
      
      {/* Alerts List */}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <For each={alerts()}>
          {(alert) => {
            const token = tokens.find(t => t.id === alert.token);
            const currentPrice = () => livePrices()[alert.token]?.usd;
            const isTriggered = () => {
              if (!currentPrice()) return false;
              return alert.type === 'above' 
                ? currentPrice() >= alert.price 
                : currentPrice() <= alert.price;
            };
            
            return (
              <div class={`bg-dark-card rounded-xl p-4 border transition-all duration-300 ${
                isTriggered() 
                  ? 'border-green-500 shadow-lg shadow-green-500/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}>
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h5 class="font-semibold text-lg">{token?.name || 'Unknown Token'}</h5>
                    <p class="text-sm text-gray-400 uppercase">{token?.symbol}</p>
                  </div>
                  <button 
                    onClick={() => removeAlert(alert.id)}
                    class="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Тип:</span>
                    <span class={alert.type === 'above' ? 'text-green-400' : 'text-red-400'}>
                      {alert.type === 'above' ? '📈 Выше' : '📉 Ниже'}
                    </span>
                  </div>
                  
                  <div class="flex justify-between">
                    <span class="text-gray-400">Цель:</span>
                    <span class="font-semibold">${alert.price.toFixed(6)}</span>
                  </div>
                  
                  <div class="flex justify-between">
                    <span class="text-gray-400">Текущая:</span>
                    <span class="font-semibold">
                      {currentPrice() ? `$${currentPrice().toFixed(6)}` : '...'}
                    </span>
                  </div>
                  
                  {isTriggered() && (
                    <div class="mt-3 p-2 bg-green-500/20 border border-green-500 rounded-lg text-center">
                      <span class="text-green-400 font-semibold">🎯 АЛЕРТ СРАБОТАЛ!</span>
                    </div>
                  )}
                </div>
                
                <div class="mt-3 text-xs text-gray-500">
                  Создан: {new Date(alert.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
            );
          }}
        </For>
      </div>
      
      {alerts().length === 0 && (
        <div class="text-center text-gray-400 py-8">
          <div class="text-4xl mb-4">🔔</div>
          <p>У вас пока нет активных алертов</p>
          <p class="text-sm">Создайте свой первый алерт выше</p>
        </div>
      )}
    </div>
  );
}