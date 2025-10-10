import { createSignal, createEffect, For, Show } from 'solid-js';

/**
 * Калькулятор инвестиционной прибыли
 */
export function InvestmentCalculator() {
  const [selectedToken, setSelectedToken] = createSignal(null);
  const [investmentAmount, setInvestmentAmount] = createSignal('');
  const [purchaseDate, setPurchaseDate] = createSignal('');
  const [purchasePrice, setPurchasePrice] = createSignal('');
  const [results, setResults] = createSignal(null);
  const [loading, setLoading] = createSignal(false);
  const [historicalPrice, setHistoricalPrice] = createSignal(null);

  // Популярные токены
  const popularTokens = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
    { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
    { id: 'algorand', symbol: 'ALGO', name: 'Algorand' }
  ];

  // Получение исторической цены
  const getHistoricalPrice = async (tokenId, date) => {
    try {
      const formattedDate = date.split('-').reverse().join('-'); // DD-MM-YYYY
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${tokenId}/history?date=${formattedDate}`
      );
      const data = await response.json();
      return data.market_data?.current_price?.usd || 0;
    } catch (error) {
      console.error('Ошибка получения исторической цены:', error);
      return 0;
    }
  };

  // Получение текущей цены
  const getCurrentPrice = async (tokenId) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      );
      const data = await response.json();
      return data[tokenId]?.usd || 0;
    } catch (error) {
      console.error('Ошибка получения текущей цены:', error);
      return 0;
    }
  };

  // Расчет инвестиций
  const calculateInvestment = async () => {
    if (!selectedToken() || !investmentAmount() || !purchaseDate()) return;

    setLoading(true);
    try {
      const token = selectedToken();
      const amount = parseFloat(investmentAmount());
      
      let buyPrice;
      if (purchasePrice()) {
        buyPrice = parseFloat(purchasePrice());
      } else {
        buyPrice = await getHistoricalPrice(token.id, purchaseDate());
        setHistoricalPrice(buyPrice);
      }

      const currentPrice = await getCurrentPrice(token.id);
      
      if (buyPrice > 0 && currentPrice > 0) {
        const tokensAmount = amount / buyPrice;
        const currentValue = tokensAmount * currentPrice;
        const profit = currentValue - amount;
        const profitPercentage = ((currentPrice - buyPrice) / buyPrice) * 100;
        
        const purchaseDateObj = new Date(purchaseDate());
        const currentDate = new Date();
        const holdingDays = Math.floor((currentDate - purchaseDateObj) / (1000 * 60 * 60 * 24));
        const annualizedReturn = (Math.pow(currentPrice / buyPrice, 365 / holdingDays) - 1) * 100;

        setResults({
          token: token,
          investmentAmount: amount,
          purchasePrice: buyPrice,
          currentPrice: currentPrice,
          tokensAmount: tokensAmount,
          currentValue: currentValue,
          profit: profit,
          profitPercentage: profitPercentage,
          holdingDays: holdingDays,
          annualizedReturn: isFinite(annualizedReturn) ? annualizedReturn : 0
        });
      }
    } catch (error) {
      console.error('Ошибка расчета:', error);
    } finally {
      setLoading(false);
    }
  };

  // Эффект для автоматического заполнения цены
  createEffect(() => {
    if (selectedToken() && purchaseDate() && !purchasePrice()) {
      const timer = setTimeout(async () => {
        const price = await getHistoricalPrice(selectedToken().id, purchaseDate());
        setHistoricalPrice(price);
      }, 500);
      return () => clearTimeout(timer);
    }
  });

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <div class="bg-gray-800 rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            💰 Калькулятор прибыли
          </h3>
          <p class="text-gray-400 text-sm">Рассчитайте доходность ваших инвестиций</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Форма расчета */}
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Выберите токен
            </label>
            <div class="grid grid-cols-2 gap-2">
              <For each={popularTokens}>
                {(token) => (
                  <button
                    onClick={() => setSelectedToken(token)}
                    class={`p-3 rounded-lg border text-left transition-colors ${
                      selectedToken()?.id === token.id
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div class="font-medium">{token.symbol}</div>
                    <div class="text-xs text-gray-400">{token.name}</div>
                  </button>
                )}
              </For>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Сумма инвестиции (USD)
            </label>
            <input
              type="number"
              placeholder="1000"
              value={investmentAmount()}
              onInput={(e) => setInvestmentAmount(e.target.value)}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Дата покупки
            </label>
            <input
              type="date"
              value={purchaseDate()}
              onInput={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Цена покупки (опционально)
            </label>
            <input
              type="number"
              placeholder={historicalPrice() ? `Историческая: $${historicalPrice()}` : 'Авто-заполнение'}
              value={purchasePrice()}
              onInput={(e) => setPurchasePrice(e.target.value)}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <Show when={historicalPrice() && !purchasePrice()}>
              <p class="text-xs text-gray-400 mt-1">
                Историческая цена на {purchaseDate()}: ${historicalPrice()}
              </p>
            </Show>
          </div>

          <button
            onClick={calculateInvestment}
            disabled={!selectedToken() || !investmentAmount() || !purchaseDate() || loading()}
            class="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Show when={loading()}>
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </Show>
            {loading() ? 'Расчет...' : 'Рассчитать'}
          </button>
        </div>

        {/* Результаты */}
        <div class="bg-gray-900 rounded-lg p-4">
          <Show when={!results()}>
            <div class="flex items-center justify-center h-full min-h-[300px]">
              <div class="text-center">
                <div class="text-6xl mb-4">💰</div>
                <p class="text-gray-400 text-lg mb-2">Расчет инвестиций</p>
                <p class="text-gray-500 text-sm">Заполните форму для расчета прибыли</p>
              </div>
            </div>
          </Show>

          <Show when={results()}>
            <div class="space-y-4">
              <div class="text-center pb-4 border-b border-gray-700">
                <h4 class="text-lg font-bold text-white mb-2">
                  {results().token.name} ({results().token.symbol})
                </h4>
                <div class="text-sm text-gray-400">
                  Период удержания: {results().holdingDays} дней
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-800 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-1">Инвестировано</div>
                  <div class="text-lg font-bold text-white">
                    {formatCurrency(results().investmentAmount)}
                  </div>
                </div>

                <div class="bg-gray-800 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-1">Текущая стоимость</div>
                  <div class="text-lg font-bold text-white">
                    {formatCurrency(results().currentValue)}
                  </div>
                </div>

                <div class="bg-gray-800 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-1">Цена покупки</div>
                  <div class="text-lg font-bold text-white">
                    ${formatNumber(results().purchasePrice)}
                  </div>
                </div>

                <div class="bg-gray-800 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-1">Текущая цена</div>
                  <div class="text-lg font-bold text-white">
                    ${formatNumber(results().currentPrice)}
                  </div>
                </div>

                <div class="bg-gray-800 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-1">Количество токенов</div>
                  <div class="text-lg font-bold text-white">
                    {formatNumber(results().tokensAmount)}
                  </div>
                </div>

                <div class="bg-gray-800 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-1">Годовая доходность</div>
                  <div class={`text-lg font-bold ${
                    results().annualizedReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {results().annualizedReturn >= 0 ? '+' : ''}{results().annualizedReturn.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div class={`bg-gradient-to-r ${
                results().profit >= 0 
                  ? 'from-green-600/20 to-green-500/20 border-green-500/50' 
                  : 'from-red-600/20 to-red-500/20 border-red-500/50'
              } border rounded-lg p-4`}>
                <div class="text-center">
                  <div class="text-sm text-gray-300 mb-2">
                    {results().profit >= 0 ? 'Прибыль' : 'Убыток'}
                  </div>
                  <div class={`text-2xl font-bold ${
                    results().profit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {results().profit >= 0 ? '+' : ''}{formatCurrency(results().profit)}
                  </div>
                  <div class={`text-lg ${
                    results().profit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ({results().profitPercentage >= 0 ? '+' : ''}{results().profitPercentage.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div class="text-xs text-gray-400 text-center">
                * Расчет основан на исторических данных CoinGecko
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}