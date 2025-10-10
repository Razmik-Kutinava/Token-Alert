import { createSignal, createEffect, For, Show } from 'solid-js';

/**
 * Трекер максимумов и минимумов (ATH/ATL)
 */
export function ATHATLTracker() {
  const [tokens, setTokens] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [watchlist, setWatchlist] = createSignal([]);
  const [availableTokens, setAvailableTokens] = createSignal([]);

  // Популярные токены для быстрого добавления
  const popularTokens = [
    'bitcoin', 'ethereum', 'cardano', 'solana', 'chainlink', 
    'polkadot', 'avalanche-2', 'polygon', 'cosmos', 'algorand'
  ];

  // Поиск токенов
  const searchTokens = async (query) => {
    if (!query || query.length < 2) return;
    
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
      const data = await response.json();
      setAvailableTokens(data.coins.slice(0, 10));
    } catch (error) {
      console.error('Ошибка поиска токенов:', error);
    }
  };

  // Загрузка данных ATH/ATL
  const loadATHATLData = async () => {
    if (watchlist().length === 0) return;
    
    setLoading(true);
    try {
      const promises = watchlist().map(async (tokenId) => {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );
        const data = await response.json();
        
        return {
          id: data.id,
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          image: data.image.small,
          current_price: data.market_data.current_price.usd,
          ath: data.market_data.ath.usd,
          ath_date: new Date(data.market_data.ath_date.usd),
          ath_change_percentage: data.market_data.ath_change_percentage.usd,
          atl: data.market_data.atl.usd,
          atl_date: new Date(data.market_data.atl_date.usd),
          atl_change_percentage: data.market_data.atl_change_percentage.usd,
          price_change_24h: data.market_data.price_change_percentage_24h,
          market_cap_rank: data.market_cap_rank
        };
      });

      const tokenData = await Promise.all(promises);
      setTokens(tokenData);
    } catch (error) {
      console.error('Ошибка загрузки ATH/ATL данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Добавить токен в watchlist
  const addToWatchlist = (tokenId) => {
    if (!watchlist().includes(tokenId) && watchlist().length < 20) {
      setWatchlist([...watchlist(), tokenId]);
    }
  };

  // Добавить токен из поиска
  const addTokenFromSearch = (token) => {
    if (!watchlist().includes(token.id) && watchlist().length < 20) {
      setWatchlist([...watchlist(), token.id]);
      setSearchQuery('');
      setAvailableTokens([]);
    }
  };

  // Удалить из watchlist
  const removeFromWatchlist = (tokenId) => {
    setWatchlist(watchlist().filter(id => id !== tokenId));
    setTokens(tokens().filter(token => token.id !== tokenId));
  };

  // Форматирование даты
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Форматирование числа
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  // Получение дней с ATH/ATL
  const getDaysFromDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Эффект для загрузки данных
  createEffect(() => {
    if (watchlist().length > 0) {
      loadATHATLData();
      const interval = setInterval(loadATHATLData, 60000); // Обновление каждую минуту
      return () => clearInterval(interval);
    }
  });

  // Эффект для поиска
  createEffect(() => {
    if (searchQuery()) {
      const timer = setTimeout(() => searchTokens(searchQuery()), 300);
      return () => clearTimeout(timer);
    }
  });

  return (
    <div class="bg-gray-800 rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            🏆 ATH/ATL Трекер
          </h3>
          <p class="text-gray-400 text-sm">Отслеживание исторических максимумов и минимумов</p>
        </div>
        <div class="text-sm text-gray-400">
          {watchlist().length}/20 токенов
        </div>
      </div>

      {/* Добавление токенов */}
      <div class="mb-6">
        <div class="mb-4">
          <p class="text-gray-300 text-sm mb-3">Добавить в отслеживание:</p>
          
          {/* Поиск токенов */}
          <div class="relative mb-4">
            <input
              type="text"
              placeholder="Поиск по названию или символу..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.target.value)}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            
            <Show when={availableTokens().length > 0}>
              <div class="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                <For each={availableTokens()}>
                  {(token) => (
                    <button
                      onClick={() => addTokenFromSearch(token)}
                      class="w-full px-4 py-3 text-left hover:bg-gray-600 flex items-center gap-3"
                    >
                      <img src={token.large} alt={token.name} class="w-6 h-6" />
                      <div>
                        <div class="text-white font-medium">{token.name}</div>
                        <div class="text-gray-400 text-sm">{token.symbol.toUpperCase()}</div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>

          {/* Популярные токены */}
          <div class="mb-4">
            <p class="text-gray-400 text-xs mb-2">Популярные:</p>
            <div class="flex flex-wrap gap-2">
              <For each={popularTokens}>
                {(tokenId) => (
                  <button
                    onClick={() => addToWatchlist(tokenId)}
                    disabled={watchlist().includes(tokenId) || watchlist().length >= 20}
                    class="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tokenId.replace('-', ' ').toUpperCase()}
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>

      {/* Таблица данных */}
      <div class="bg-gray-900 rounded-lg overflow-hidden">
        <Show when={loading()}>
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p class="text-gray-400">Загрузка данных ATH/ATL...</p>
            </div>
          </div>
        </Show>

        <Show when={!loading() && tokens().length === 0}>
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="text-6xl mb-4">🏆</div>
              <p class="text-gray-400 text-lg mb-2">Добавьте токены для отслеживания</p>
              <p class="text-gray-500 text-sm">Выберите криптовалюты для мониторинга ATH/ATL</p>
            </div>
          </div>
        </Show>

        <Show when={!loading() && tokens().length > 0}>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-800">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Токен
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Цена
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ATH
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    От ATH
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ATL
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    От ATL
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    24ч
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <For each={tokens()}>
                  {(token) => (
                    <tr class="hover:bg-gray-800">
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <img src={token.image} alt={token.name} class="w-8 h-8 rounded-full mr-3" />
                          <div>
                            <div class="text-sm font-medium text-white">{token.name}</div>
                            <div class="text-sm text-gray-400">{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-white">${formatNumber(token.current_price)}</div>
                        <div class="text-xs text-gray-400">#{token.market_cap_rank}</div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-white">${formatNumber(token.ath)}</div>
                        <div class="text-xs text-gray-400">{formatDate(token.ath_date)}</div>
                        <div class="text-xs text-gray-500">{getDaysFromDate(token.ath_date)} дней назад</div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class={`text-sm font-medium ${
                          token.ath_change_percentage < -50 ? 'text-red-400' :
                          token.ath_change_percentage < -20 ? 'text-orange-400' :
                          'text-yellow-400'
                        }`}>
                          {token.ath_change_percentage.toFixed(1)}%
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-white">${formatNumber(token.atl)}</div>
                        <div class="text-xs text-gray-400">{formatDate(token.atl_date)}</div>
                        <div class="text-xs text-gray-500">{getDaysFromDate(token.atl_date)} дней назад</div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class={`text-sm font-medium ${
                          token.atl_change_percentage > 1000 ? 'text-green-400' :
                          token.atl_change_percentage > 100 ? 'text-blue-400' :
                          'text-gray-400'
                        }`}>
                          +{formatNumber(token.atl_change_percentage)}%
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class={`text-sm font-medium ${
                          token.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {token.price_change_24h >= 0 ? '+' : ''}{token.price_change_24h.toFixed(2)}%
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeFromWatchlist(token.id)}
                          class="text-red-400 hover:text-red-300 text-sm"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>
    </div>
  );
}