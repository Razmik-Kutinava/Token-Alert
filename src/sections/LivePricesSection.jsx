import { For } from 'solid-js';

export function LivePricesSection({ tokens, livePrices, lastUpdated }) {
  return (
    <div class="mb-12">
      <div class="text-center mb-6">
        <h3 class="text-2xl font-bold mb-2">
          💰 Живое табло цен
        </h3>
        <p class="text-gray-400 mb-2">
          Актуальные цены криптовалют обновляются каждые 30 секунд
        </p>
        {lastUpdated() && (
          <p class="text-sm text-gray-500">
            Последнее обновление: {lastUpdated().toLocaleTimeString('ru-RU')}
          </p>
        )}
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <For each={tokens}>
          {(token) => {
            const price = () => livePrices()[token.id];
            const change24h = () => price()?.change24h || 0;
            
            return (
              <div class="bg-dark-card rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-lg font-semibold">{token.name}</span>
                  <span class="text-sm text-gray-400 uppercase">{token.symbol}</span>
                </div>
                
                <div class="mb-2">
                  <span class="text-2xl font-bold text-white">
                    {price() ? `$${price().usd.toFixed(price().usd < 1 ? 6 : 2)}` : '...'}
                  </span>
                </div>
                
                <div class={`text-sm font-medium ${
                  change24h() > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {change24h() > 0 ? '▲' : '▼'} {Math.abs(change24h()).toFixed(2)}%
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}