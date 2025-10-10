import { createSignal, createEffect, For, Show, onMount, onCleanup } from 'solid-js';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Регистрируем компоненты Chart.js
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, TimeScale);

/**
 * Компонент сравнения графиков цен
 */
export function PriceChartsCompare() {
  const [selectedTokens, setSelectedTokens] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [timeFrame, setTimeFrame] = createSignal('30');
  const [chartData, setChartData] = createSignal(null);
  const [loading, setLoading] = createSignal(false);
  const [availableTokens, setAvailableTokens] = createSignal([]);
  const [chartInstance, setChartInstance] = createSignal(null);

  // Популярные токены для быстрого добавления
  const popularTokens = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon' }
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

  // Загрузка исторических данных
  const loadChartData = async () => {
    if (selectedTokens().length === 0) return;
    
    setLoading(true);
    try {
      const promises = selectedTokens().map(async (token) => {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${token.id}/market_chart?vs_currency=usd&days=${timeFrame()}`
        );
        const data = await response.json();
        return {
          label: token.symbol.toUpperCase(),
          data: data.prices.map(([timestamp, price]) => ({
            x: new Date(timestamp),
            y: price
          })),
          borderColor: getTokenColor(token.symbol),
          backgroundColor: getTokenColor(token.symbol) + '20',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4
        };
      });

      const datasets = await Promise.all(promises);
      setChartData({
        datasets
      });
      
      // Обновляем график если он уже создан
      if (chartInstance()) {
        chartInstance().data = { datasets };
        chartInstance().update();
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация цвета для токена
  const getTokenColor = (symbol) => {
    const colors = [
      '#f7931a', '#627eea', '#3c3c3d', '#9945ff', '#2a5ada',
      '#e6007a', '#e84142', '#8247e5', '#00d4aa', '#ff6838'
    ];
    const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Добавить токен
  const addToken = (token) => {
    if (selectedTokens().length >= 10) return;
    if (selectedTokens().some(t => t.id === token.id)) return;
    
    setSelectedTokens([...selectedTokens(), token]);
    setSearchQuery('');
    setAvailableTokens([]);
  };

  // Удалить токен
  const removeToken = (tokenId) => {
    setSelectedTokens(selectedTokens().filter(t => t.id !== tokenId));
  };

  // Эффект для загрузки данных
  createEffect(() => {
    if (selectedTokens().length > 0) {
      loadChartData();
    }
  });

  // Создание графика
  const createChart = () => {
    const ctx = document.getElementById('priceChart');
    if (!ctx || chartInstance()) return;

    const newChart = new Chart(ctx, {
      type: 'line',
      data: chartData() || { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#ffffff',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#374151',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                day: 'MMM dd',
                hour: 'MMM dd HH:mm'
              }
            },
            grid: {
              color: '#374151'
            },
            ticks: {
              color: '#9CA3AF'
            }
          },
          y: {
            grid: {
              color: '#374151'
            },
            ticks: {
              color: '#9CA3AF',
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      }
    });

    setChartInstance(newChart);
  };

  // Уничтожение графика
  const destroyChart = () => {
    if (chartInstance()) {
      chartInstance().destroy();
      setChartInstance(null);
    }
  };

  // Эффект для создания графика
  createEffect(() => {
    if (chartData() && chartData().datasets.length > 0) {
      createChart();
    }
  });

  // Эффект для поиска
  createEffect(() => {
    if (searchQuery()) {
      const timer = setTimeout(() => searchTokens(searchQuery()), 300);
      return () => clearTimeout(timer);
    }
  });

  // Очистка при размонтировании
  onCleanup(() => {
    destroyChart();
  });

  return (
    <div class="bg-gray-800 rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            📈 Сравнение графиков цен
          </h3>
          <p class="text-gray-400 text-sm">Сравните до 10 криптовалют на одном графике</p>
        </div>
      </div>

      {/* Временные периоды */}
      <div class="mb-6">
        <p class="text-gray-300 text-sm mb-3">Временной период:</p>
        <div class="flex flex-wrap gap-2">
          {[
            { id: '30', label: '30 дней' },
            { id: '90', label: '3 месяца' },
            { id: '180', label: '6 месяцев' },
            { id: '365', label: '1 год' },
            { id: '730', label: '2 года' }
          ].map(period => (
            <button
              onClick={() => setTimeFrame(period.id)}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFrame() === period.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Поиск и добавление токенов */}
      <div class="mb-6">
        <p class="text-gray-300 text-sm mb-3">
          Добавить криптовалюту ({selectedTokens().length}/10):
        </p>
        
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
                    onClick={() => addToken(token)}
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
              {(token) => (
                <button
                  onClick={() => addToken(token)}
                  disabled={selectedTokens().some(t => t.id === token.id) || selectedTokens().length >= 10}
                  class="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {token.symbol}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Выбранные токены */}
        <Show when={selectedTokens().length > 0}>
          <div class="flex flex-wrap gap-2">
            <For each={selectedTokens()}>
              {(token) => (
                <div class="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                  <span>{token.symbol.toUpperCase()}</span>
                  <button
                    onClick={() => removeToken(token.id)}
                    class="hover:bg-blue-700 rounded px-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* График */}
      <div class="bg-gray-900 rounded-lg p-4 min-h-[400px]">
        <Show when={loading()}>
          <div class="flex items-center justify-center h-96">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p class="text-gray-400">Загрузка данных...</p>
            </div>
          </div>
        </Show>

        <Show when={!loading() && selectedTokens().length === 0}>
          <div class="flex items-center justify-center h-96">
            <div class="text-center">
              <div class="text-6xl mb-4">📈</div>
              <p class="text-gray-400 text-lg mb-2">Выберите токены для сравнения</p>
              <p class="text-gray-500 text-sm">Добавьте до 10 криптовалют для анализа</p>
            </div>
          </div>
        </Show>

        <Show when={!loading() && selectedTokens().length > 0}>
          <div class="h-96">
            <canvas id="priceChart" width="100%" height="100%"></canvas>
          </div>
        </Show>
      </div>
    </div>
  );
}