import { For, Show, createSignal } from 'solid-js';
import { X, TrendingUp, TrendingDown } from 'lucide-solid';

/**
 * Расширенное табло курсов с модальным окном
 */
export function AdvancedPriceBoard({ tokens, livePrices, lastUpdated }) {
  const [showAllCoins, setShowAllCoins] = createSignal(false);

  // Показываем первые 8 токенов на главном экране
  const mainTokens = () => tokens.slice(0, 8);
  
  const formatPrice = (price) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  };

  const getTokenData = (token) => {
    const pricesArray = Array.isArray(livePrices()) ? livePrices() : [];
    return pricesArray.find(t => t.id === token.id);
  };

  return (
    <div class="mb-8">
      {/* Заголовок */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-2xl font-bold text-white">💰 Курсы криптовалют</h3>
          <p class="text-gray-400 text-sm">
            Актуальные цены • Обновляется каждые 30 секунд
          </p>
          {lastUpdated() && (
            <p class="text-gray-500 text-xs">
              Последнее обновление: {lastUpdated().toLocaleTimeString('ru-RU')}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setShowAllCoins(true)}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <span>Показать все</span>
          <span class="bg-blue-500 text-white px-2 py-1 rounded text-xs">
            {tokens.length}
          </span>
        </button>
      </div>

      {/* Главное табло - 8 карточек */}
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <For each={mainTokens()}>
          {(token) => {
            const tokenData = () => getTokenData(token);
            const price = () => tokenData()?.current_price;
            const change24h = () => tokenData()?.price_change_percentage_24h || 0;
            const isPositive = () => change24h() >= 0;
            
            return (
              <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="font-bold text-white text-lg">{token.symbol}</h4>
                    <p class="text-gray-400 text-sm">{token.name}</p>
                  </div>
                  <div class={`p-2 rounded-lg ${isPositive() ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isPositive() ? 
                      <TrendingUp class="w-4 h-4 text-green-400" /> : 
                      <TrendingDown class="w-4 h-4 text-red-400" />
                    }
                  </div>
                </div>
                
                <div class="space-y-1">
                  <div class="text-xl font-bold text-white">
                    {price() ? `$${formatPrice(price())}` : '...'}
                  </div>
                  
                  <div class={`text-sm font-medium flex items-center gap-1 ${
                    isPositive() ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>{isPositive() ? '▲' : '▼'}</span>
                    <span>{Math.abs(change24h()).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          }}
        </For>
      </div>

      {/* Модальное окно со всеми монетами */}
      <Show when={showAllCoins()}>
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div class="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Заголовок модального окна */}
            <div class="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h3 class="text-xl font-bold text-white">Все криптовалюты</h3>
                <p class="text-gray-400 text-sm">Полный список поддерживаемых монет</p>
              </div>
              <button
                onClick={() => setShowAllCoins(false)}
                class="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {/* Список всех монет */}
            <div class="p-6 overflow-y-auto max-h-[60vh]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <For each={tokens}>
                  {(token) => {
                    const tokenData = () => getTokenData(token);
                    const price = () => tokenData()?.current_price;
                    const change24h = () => tokenData()?.price_change_percentage_24h || 0;
                    const isPositive = () => change24h() >= 0;
                    
                    return (
                      <div class="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                        <div class="flex items-center justify-between">
                          {/* Информация о токене */}
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <span class="text-sm font-bold text-white">
                                {token.symbol.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div class="font-medium text-white">{token.symbol}</div>
                              <div class="text-gray-400 text-sm">{token.name}</div>
                            </div>
                          </div>

                          {/* Цена и изменение */}
                          <div class="text-right">
                            <div class="font-bold text-white">
                              {price() ? `$${formatPrice(price())}` : '...'}
                            </div>
                            <div class={`text-sm font-medium ${
                              isPositive() ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {isPositive() ? '+' : ''}{change24h().toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            {/* Подвал модального окна */}
            <div class="p-6 border-t border-gray-700 bg-gray-900/50">
              <div class="flex items-center justify-between">
                <div class="text-gray-400 text-sm">
                  Всего поддерживается {tokens.length} криптовалют
                </div>
                <button
                  onClick={() => setShowAllCoins(false)}
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}