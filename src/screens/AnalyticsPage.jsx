import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import cryptoAPI from '../services/cryptoAPI';

export function AnalyticsPage({ user, tokens, livePrices }) {
  const isPremium = () => user?.subscription === 'premium';
  
  // Состояния для компонентов
  const [selectedTokens, setSelectedTokens] = createSignal(['bitcoin', 'ethereum', 'cardano', 'solana', 'binancecoin']);
  const [timeFrame, setTimeFrame] = createSignal('30дней');
  const [athAtlData, setAthAtlData] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [chartData, setChartData] = createSignal([]);
  const [apiStatus, setApiStatus] = createSignal('connecting'); // connecting, online, offline
  
  // Калькулятор состояния
  const [calcToken, setCalcToken] = createSignal('bitcoin');
  const [investAmount, setInvestAmount] = createSignal('1000');
  const [buyDate, setBuyDate] = createSignal('2024-01-01');
  const [sellDate, setSellDate] = createSignal('2024-10-10');
  const [fees, setFees] = createSignal('0.1');
  const [reinvest, setReinvest] = createSignal(false);
  const [calcResult, setCalcResult] = createSignal(null);
  const [calcLoading, setCalcLoading] = createSignal(false);
  
  // Экспорт состояния
  const [exportFormat, setExportFormat] = createSignal('CSV');
  const [dataType, setDataType] = createSignal('prices');

  const popularTokens = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' }
  ];

  const timeFrames = ['30дней', '3месяца', '6месяцев', '1год', '2года'];

  // Загрузка ATH/ATL данных
  const loadATHATLData = async () => {
    setLoading(true);
    setApiStatus('connecting');
    
    try {
      console.log('🔄 Загрузка данных для токенов:', selectedTokens());
      
      // Получаем рыночные данные
      const marketData = await cryptoAPI.getCoinsMarket(selectedTokens().slice(0, 5).join(','));
      console.log('📊 Рыночные данные получены:', marketData);

      if (!marketData || marketData.length === 0) {
        console.warn('⚠️ Нет рыночных данных');
        setApiStatus('offline');
        setAthAtlData([]);
        return;
      }

      setApiStatus('online');

      // Получаем детальные данные для каждой монеты
      const detailPromises = marketData.map(async (coin) => {
        try {
          console.log(`🔍 Загружаем детали для ${coin.id}...`);
          const details = await cryptoAPI.getCoinDetails(coin.id);
          
          if (!details) {
            console.warn(`⚠️ Нет деталей для ${coin.id}`);
            return null;
          }

          const current = coin.current_price;
          const ath = details.market_data.ath.usd;
          const atl = details.market_data.atl.usd;

          const result = {
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image,
            current: current,
            ath: ath,
            atl: atl,
            athPercent: ((current - ath) / ath * 100),
            atlPercent: ((current - atl) / atl * 100),
            athDate: new Date(details.market_data.ath_date.usd).toLocaleDateString('ru-RU'),
            atlDate: new Date(details.market_data.atl_date.usd).toLocaleDateString('ru-RU'),
            change24h: coin.price_change_percentage_24h || 0
          };

          console.log(`✅ Данные для ${coin.symbol}:`, result);
          return result;
        } catch (error) {
          console.error(`❌ Ошибка загрузки деталей для ${coin.id}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(detailPromises);
      const validResults = results.filter(Boolean);
      
      console.log('✅ Все данные загружены:', validResults);
      setAthAtlData(validResults);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      setApiStatus('offline');
      setAthAtlData([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных для графиков сравнения
  const loadChartData = async () => {
    if (selectedTokens().length === 0) {
      setChartData([]);
      return;
    }

    console.log('📊 Загрузка графиков для:', selectedTokens());
    
    try {
      const days = timeFrame() === '30дней' ? 30 : 
                   timeFrame() === '3месяца' ? 90 :
                   timeFrame() === '6месяцев' ? 180 :
                   timeFrame() === '1год' ? 365 : 730;

      const chartPromises = selectedTokens().map(async (tokenId) => {
        try {
          const data = await cryptoAPI.getChartData(tokenId, days);
          const token = popularTokens.find(t => t.id === tokenId);
          
          return {
            id: tokenId,
            name: token?.name || tokenId,
            symbol: token?.symbol || tokenId.toUpperCase(),
            prices: data.prices || [],
            color: getTokenColor(tokenId)
          };
        } catch (error) {
          console.error(`❌ Ошибка графика для ${tokenId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(chartPromises);
      const validResults = results.filter(Boolean);
      
      console.log('✅ Графики загружены:', validResults.length);
      setChartData(validResults);
    } catch (error) {
      console.error('❌ Ошибка загрузки графиков:', error);
      setChartData([]);
    }
  };

  // Цвета для токенов
  const getTokenColor = (tokenId) => {
    const colors = {
      'bitcoin': '#f7931a',
      'ethereum': '#627eea', 
      'binancecoin': '#f3ba2f',
      'cardano': '#0033ad',
      'solana': '#9945ff',
      'chainlink': '#375bd2',
      'polkadot': '#e6007a',
      'avalanche-2': '#e84142'
    };
    return colors[tokenId] || '#64748b';
  };

  // Расчет прибыли
  const calculateProfit = async () => {
    if (!investAmount() || !buyDate() || !sellDate()) {
      setCalcResult({ error: 'Заполните все обязательные поля' });
      return;
    }
    
    setCalcLoading(true);
    try {
      console.log('💰 Расчет прибыли для:', calcToken(), buyDate(), sellDate());
      
      // Получаем историческую цену на дату покупки и продажи
      const [buyPrice, sellPrice] = await Promise.all([
        cryptoAPI.getHistoricalPrice(calcToken(), buyDate()),
        cryptoAPI.getHistoricalPrice(calcToken(), sellDate())
      ]);
      
      console.log('📈 Цены получены:', { buyPrice, sellPrice });
      
      if (!buyPrice || !sellPrice) {
        setCalcResult({ error: 'Не удалось получить исторические цены' });
        return;
      }
      
      const investment = parseFloat(investAmount());
      const feePercent = parseFloat(fees()) / 100;
      
      // Расчеты
      const tokensAmount = investment / buyPrice;
      const sellValue = tokensAmount * sellPrice;
      const totalFees = investment * feePercent + sellValue * feePercent;
      const profit = sellValue - investment - totalFees;
      const profitPercent = (profit / investment) * 100;
      
      const result = {
        buyPrice,
        sellPrice,
        tokensAmount,
        investment,
        sellValue,
        totalFees,
        profit,
        profitPercent,
        duration: Math.ceil((new Date(sellDate()) - new Date(buyDate())) / (1000 * 60 * 60 * 24))
      };
      
      console.log('✅ Результат расчета:', result);
      setCalcResult(result);
    } catch (error) {
      console.error('❌ Ошибка расчета:', error);
      setCalcResult({ error: 'Ошибка расчета прибыли: ' + error.message });
    } finally {
      setCalcLoading(false);
    }
  };

  // Экспорт данных
  const exportData = async (format) => {
    const data = athAtlData();
    if (!data.length) return;

    let content, filename, mimeType;

    if (format === 'CSV') {
      const csvHeader = 'Токен,Название,Текущая цена,ATH,ATL,% от ATH,% от ATL,Дата ATH,Дата ATL,Изменение 24ч\n';
      const csvContent = data.map(row => 
        `${row.symbol},${row.name},${row.current},${row.ath},${row.atl},${row.athPercent.toFixed(2)}%,${row.atlPercent.toFixed(2)}%,${row.athDate},${row.atlDate},${row.change24h?.toFixed(2)}%`
      ).join('\n');
      
      content = csvHeader + csvContent;
      filename = `crypto-analytics-${Date.now()}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else if (format === 'JSON') {
      content = JSON.stringify(data, null, 2);
      filename = `crypto-analytics-${Date.now()}.json`;
      mimeType = 'application/json;charset=utf-8;';
    } else if (format === 'Excel' && isPremium()) {
      try {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(data.map(row => ({
          'Токен': row.symbol,
          'Название': row.name,
          'Текущая цена ($)': row.current,
          'ATH ($)': row.ath,
          'ATL ($)': row.atl,
          '% от ATH': row.athPercent.toFixed(2) + '%',
          '% от ATL': row.atlPercent.toFixed(2) + '%',
          'Дата ATH': row.athDate,
          'Дата ATL': row.atlDate,
          'Изменение 24ч (%)': row.change24h?.toFixed(2) + '%'
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Crypto Analytics');
        
        filename = `crypto-analytics-${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
        return;
      } catch (error) {
        console.error('Ошибка экспорта Excel:', error);
        return;
      }
    }

    if (content) {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  // Добавление/удаление токенов
  const toggleToken = (tokenId) => {
    const current = selectedTokens();
    if (current.includes(tokenId)) {
      setSelectedTokens(current.filter(id => id !== tokenId));
    } else if (current.length < 10) {
      setSelectedTokens([...current, tokenId]);
    }
  };

  // Автозагрузка данных
  createEffect(() => {
    if (selectedTokens().length > 0) {
      loadATHATLData();
      loadChartData();
    }
  });

  // Загрузка графиков при изменении временного периода
  createEffect(() => {
    timeFrame(); // следим за изменением timeFrame
    if (selectedTokens().length > 0) {
      loadChartData();
    }
  });

  onMount(() => {
    loadATHATLData();
    loadChartData();
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      if (!loading()) {
        console.log('🔄 Автообновление данных...');
        loadATHATLData();
        loadChartData();
      }
    }, 30000);

    // Очищаем интервал при размонтировании
    return () => clearInterval(interval);
  });

  const PremiumGate = ({ children, feature }) => (
    <Show 
      when={isPremium()} 
      fallback={
        <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
          <div class="relative z-10">
            <div class="text-6xl mb-4">🔒</div>
            <h3 class="text-xl font-bold text-white mb-2">{feature}</h3>
            <p class="text-gray-400 mb-4">Доступно только в Premium подписке</p>
            <button 
              onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
              class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-semibold"
            >
              🚀 Обновить до Premium
            </button>
          </div>
        </div>
      }
    >
      {children}
    </Show>
  );

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Супер крутой заголовок */}
      <div class="relative mb-8 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
        <div class="relative p-8 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="text-6xl animate-pulse">📊</div>
              <div>
                <h1 class="text-4xl font-black mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Исторические данные и анализ
                </h1>
                <p class="text-xl text-white/90 font-medium">
                  Глубокий анализ рынка с данными за 2+ года
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              {/* API Статус */}
              <div class={`px-4 py-2 rounded-full flex items-center gap-2 ${
                apiStatus() === 'online' ? 'bg-green-500/20 border border-green-500/30' :
                apiStatus() === 'offline' ? 'bg-red-500/20 border border-red-500/30' :
                'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                <div class={`w-3 h-3 rounded-full ${
                  apiStatus() === 'online' ? 'bg-green-400 animate-pulse' :
                  apiStatus() === 'offline' ? 'bg-red-400' :
                  'bg-yellow-400 animate-ping'
                }`}></div>
                <span class="text-white text-sm font-semibold">
                  {apiStatus() === 'online' ? '🟢 API Подключен' :
                   apiStatus() === 'offline' ? '🔴 API Офлайн' :
                   '🟡 Подключение...'}
                </span>
              </div>
              
              {/* Premium Badge */}
              <div class="bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-3 rounded-full shadow-lg">
                <span class="text-white font-bold flex items-center gap-2">
                  <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  Premium
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки периодов */}
      <div class="mb-8">
        <label class="block text-white font-bold text-lg mb-4">⏱️ Временной период:</label>
        <div class="flex flex-wrap gap-3">
          <For each={timeFrames}>
            {(period) => (
              <button
                onClick={() => setTimeFrame(period)}
                class={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  timeFrame() === period
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:scale-105'
                }`}
              >
                {period}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Сравнение графиков */}
      <PremiumGate feature="Сравнение графиков">
        <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 mb-8 shadow-xl">
          <h3 class="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            📈 Сравнение графиков цен
          </h3>
          <p class="text-gray-300 mb-6">Сравните до 10 криптовалют на одном графике</p>
          
          <div class="mb-6">
            <label class="block text-white font-semibold mb-3">
              💰 Выбранные токены ({selectedTokens().length}/10):
            </label>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
              <For each={popularTokens}>
                {(token) => (
                  <button
                    onClick={() => toggleToken(token.id)}
                    class={`p-3 rounded-xl font-semibold transition-all duration-300 ${
                      selectedTokens().includes(token.id)
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white scale-105 shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:scale-105'
                    }`}
                  >
                    {token.symbol}
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="h-96 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl border border-gray-600/50 p-4 backdrop-blur-sm">
            <Show 
              when={chartData().length > 0}
              fallback={
                <div class="h-full flex items-center justify-center text-center text-gray-300">
                  <div>
                    <div class="text-8xl mb-4">📊</div>
                    <h4 class="text-xl font-bold mb-2">Интерактивный график сравнения</h4>
                    <p class="text-gray-400">Выберите криптовалюты для отображения динамики цен</p>
                  </div>
                </div>
              }
            >
              <div class="h-full">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-white font-bold">Динамика цен ({timeFrame()})</h4>
                  <div class="flex gap-2 flex-wrap">
                    <For each={chartData()}>
                      {(chart) => (
                        <div class="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-lg">
                          <div 
                            class="w-3 h-3 rounded-full"
                            style={{ "background-color": chart.color }}
                          ></div>
                          <span class="text-sm text-white font-medium">{chart.symbol}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
                
                <div class="relative h-80">
                  <svg class="w-full h-full" viewBox="0 0 800 300">
                    {/* Сетка */}
                    <defs>
                      <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#374151" stroke-width="1" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Линии графиков */}
                    <For each={chartData()}>
                      {(chart) => {
                        if (!chart.prices || chart.prices.length === 0) return null;
                        
                        // Нормализуем данные для SVG
                        const maxPrice = Math.max(...chartData().flatMap(c => c.prices?.map(p => p[1]) || []));
                        const minPrice = Math.min(...chartData().flatMap(c => c.prices?.map(p => p[1]) || []));
                        const priceRange = maxPrice - minPrice;
                        
                        const points = chart.prices.map((price, index) => {
                          const x = (index / (chart.prices.length - 1)) * 750 + 25;
                          const y = 275 - ((price[1] - minPrice) / priceRange) * 250;
                          return `${x},${y}`;
                        }).join(' ');
                        
                        return (
                          <polyline
                            points={points}
                            fill="none"
                            stroke={chart.color}
                            stroke-width="2"
                            opacity="0.8"
                          />
                        );
                      }}
                    </For>
                  </svg>
                  
                  {/* Информация о ценах */}
                  <div class="absolute top-2 right-2 bg-gray-900/80 rounded-lg p-3 backdrop-blur-sm">
                    <For each={chartData()}>
                      {(chart) => {
                        const currentPrice = chart.prices?.[chart.prices.length - 1]?.[1];
                        const firstPrice = chart.prices?.[0]?.[1];
                        const change = currentPrice && firstPrice ? 
                          ((currentPrice - firstPrice) / firstPrice * 100) : 0;
                        
                        return (
                          <div class="flex items-center justify-between gap-4 mb-1">
                            <div class="flex items-center gap-2">
                              <div 
                                class="w-2 h-2 rounded-full"
                                style={{ "background-color": chart.color }}
                              ></div>
                              <span class="text-xs text-white">{chart.symbol}</span>
                            </div>
                            <div class="text-right">
                              <div class="text-xs text-white">
                                ${currentPrice?.toFixed(2) || '0.00'}
                              </div>
                              <div class={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </PremiumGate>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* ATH/ATL Трекер */}
        <PremiumGate feature="ATH/ATL трекер">
          <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 shadow-xl">
            <h3 class="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              🏆 ATH/ATL трекер
            </h3>
            
            <Show 
              when={!loading() && athAtlData().length > 0}
              fallback={
                <div class="text-center py-12">
                  <Show when={loading()}>
                    <div class="text-6xl mb-4 animate-bounce">⏳</div>
                    <div class="text-xl text-gray-300 font-semibold">Загрузка данных из API...</div>
                    <div class="text-sm text-gray-400 mt-2">
                      {apiStatus() === 'connecting' && '🔄 Подключение к CoinGecko API...'}
                      {apiStatus() === 'online' && '✅ Получение актуальных данных...'}
                      {apiStatus() === 'offline' && '⚠️ Используются демо данные'}
                    </div>
                  </Show>
                  <Show when={!loading() && athAtlData().length === 0}>
                    <div class="text-6xl mb-4">📊</div>
                    <div class="text-xl text-gray-300">Нет данных для отображения</div>
                    <button 
                      onClick={loadATHATLData}
                      class="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                    >
                      🔄 Попробовать снова
                    </button>
                  </Show>
                </div>
              }
            >
              <div class="mb-4 text-center">
                <div class="text-sm text-gray-400">
                  📡 Данные загружены: {new Date().toLocaleTimeString('ru-RU')} | 
                  Статус API: {apiStatus() === 'online' ? '🟢 Онлайн' : apiStatus() === 'offline' ? '🔴 Офлайн' : '🟡 Подключение'}
                </div>
              </div>
              
              <div class="flex justify-between items-center mb-4">
                <button 
                  onClick={loadATHATLData}
                  disabled={loading()}
                  class="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {loading() ? (
                    <>
                      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Обновление...
                    </>
                  ) : (
                    <>
                      🔄 Обновить данные
                    </>
                  )}
                </button>
                
                <div class="text-sm text-gray-400">
                  📊 Показано: {athAtlData().length} токенов | 
                  🔄 Автообновление: каждые 30 сек
                </div>
              </div>
              
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-600">
                      <th class="text-left py-3 text-gray-300 font-bold">Токен</th>
                      <th class="text-right py-3 text-gray-300 font-bold">Текущая</th>
                      <th class="text-right py-3 text-gray-300 font-bold">ATH</th>
                      <th class="text-right py-3 text-gray-300 font-bold">ATL</th>
                      <th class="text-right py-3 text-gray-300 font-bold">% от ATH</th>
                      <th class="text-right py-3 text-gray-300 font-bold">% от ATL</th>
                      <th class="text-right py-3 text-gray-300 font-bold">24ч</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={athAtlData()}>
                      {(token) => (
                        <tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                          <td class="py-4">
                            <div class="flex items-center gap-3">
                              <img 
                                src={token.image} 
                                alt={token.symbol} 
                                class="w-8 h-8 rounded-full"
                                onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHR0ZXh0IHg9IjE2IiB5PSIyMSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Pz88L3RleHQ+Cjwvc3ZnPgo='}
                              />
                              <div>
                                <div class="font-bold text-white">{token.symbol}</div>
                                <div class="text-xs text-gray-400">{token.name}</div>
                              </div>
                            </div>
                          </td>
                          <td class="text-right text-white font-semibold">
                            ${token.current?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </td>
                          <td class="text-right text-green-400 font-semibold">
                            ${token.ath?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td class="text-right text-red-400 font-semibold">
                            ${token.atl?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                          </td>
                          <td class={`text-right font-bold ${token.athPercent >= -10 ? 'text-green-400' : token.athPercent >= -50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {token.athPercent?.toFixed(1)}%
                          </td>
                          <td class={`text-right font-bold ${token.atlPercent >= 1000 ? 'text-green-400' : token.atlPercent >= 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                            +{token.atlPercent?.toLocaleString('en-US', { maximumFractionDigits: 0 })}%
                          </td>
                          <td class={`text-right font-bold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h?.toFixed(2)}%
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </PremiumGate>

        {/* Калькулятор прибыли */}
        <PremiumGate feature="Калькулятор прибыли">
          <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 shadow-xl">
            <h3 class="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              💰 Калькулятор прибыли
            </h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-gray-300 font-semibold mb-2">🪙 Токен</label>
                <select 
                  value={calcToken()}
                  onChange={(e) => setCalcToken(e.target.value)}
                  class="w-full bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-yellow-500 focus:outline-none"
                >
                  <For each={popularTokens}>
                    {(token) => (
                      <option value={token.id}>{token.name} ({token.symbol})</option>
                    )}
                  </For>
                </select>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-300 font-semibold mb-2">💵 Сумма инвестиций ($)</label>
                  <input 
                    type="number" 
                    value={investAmount()}
                    onInput={(e) => setInvestAmount(e.target.value)}
                    placeholder="1000"
                    class="w-full bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-gray-300 font-semibold mb-2">📈 Комиссии (%)</label>
                  <input 
                    type="number" 
                    value={fees()}
                    onInput={(e) => setFees(e.target.value)}
                    placeholder="0.1"
                    step="0.01"
                    class="w-full bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-300 font-semibold mb-2">📅 Дата покупки</label>
                  <input 
                    type="date"
                    value={buyDate()}
                    onInput={(e) => setBuyDate(e.target.value)}
                    max="2024-10-10"
                    class="w-full bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-gray-300 font-semibold mb-2">📅 Дата продажи</label>
                  <input 
                    type="date"
                    value={sellDate()}
                    onInput={(e) => setSellDate(e.target.value)}
                    max="2024-10-10"
                    class="w-full bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="reinvest" 
                  checked={reinvest()}
                  onChange={(e) => setReinvest(e.target.checked)}
                  class="w-5 h-5 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                />
                <label for="reinvest" class="text-gray-300 font-semibold">🔄 Реинвестирование прибыли</label>
              </div>
              
              <button 
                onClick={calculateProfit}
                disabled={calcLoading()}
                class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-bold text-lg disabled:opacity-50"
              >
                {calcLoading() ? '⏳ Расчет...' : '🚀 Рассчитать прибыль'}
              </button>
              
              <Show when={calcResult()}>
                <div class="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-500/30">
                  <Show when={calcResult().error}>
                    <div class="text-red-400 font-semibold">❌ {calcResult().error}</div>
                  </Show>
                  <Show when={!calcResult().error}>
                    <h4 class="text-lg font-bold text-white mb-3">📊 Результаты расчета:</h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span class="text-gray-400">💰 Инвестиция:</span>
                        <span class="text-white font-semibold ml-2">${calcResult().investment?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">🪙 Количество токенов:</span>
                        <span class="text-white font-semibold ml-2">{calcResult().tokensAmount?.toFixed(6)}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">📈 Цена покупки:</span>
                        <span class="text-white font-semibold ml-2">${calcResult().buyPrice?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">📈 Цена продажи:</span>
                        <span class="text-white font-semibold ml-2">${calcResult().sellPrice?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">💸 Комиссии:</span>
                        <span class="text-red-400 font-semibold ml-2">-${calcResult().totalFees?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">⏱️ Период:</span>
                        <span class="text-white font-semibold ml-2">{calcResult().duration} дней</span>
                      </div>
                      <div class="col-span-2 mt-2 pt-2 border-t border-gray-600">
                        <div class={`text-lg font-bold ${calcResult().profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          🎯 Прибыль: {calcResult().profit >= 0 ? '+' : ''}${calcResult().profit?.toFixed(2)} 
                          ({calcResult().profitPercent >= 0 ? '+' : ''}{calcResult().profitPercent?.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        </PremiumGate>
      </div>

      {/* Экспорт данных */}
      <PremiumGate feature="Экспорт данных">
        <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl mb-8">
          <h3 class="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            📋 Экспорт данных
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-gray-300 font-semibold mb-2">📊 Тип данных</label>
                <select 
                  value={dataType()}
                  onChange={(e) => setDataType(e.target.value)}
                  class="w-full bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="prices">Исторические цены</option>
                  <option value="volumes">Объемы торгов</option>
                  <option value="market_cap">Рыночная капитализация</option>
                  <option value="all">Все данные</option>
                </select>
              </div>
              
              <div>
                <label class="block text-gray-300 font-semibold mb-3">📁 Формат экспорта</label>
                <div class="flex gap-3">
                  <button 
                    onClick={() => exportData('CSV')}
                    class="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-300 font-semibold"
                  >
                    📄 CSV
                  </button>
                  <button 
                    onClick={() => exportData('JSON')}
                    class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold"
                  >
                    🗂️ JSON
                  </button>
                  <button 
                    onClick={() => isPremium() ? exportData('Excel') : window.upgradeSubscription && window.upgradeSubscription()}
                    class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
                  >
                    📊 Excel*
                  </button>
                </div>
                <p class="text-gray-400 text-sm mt-2">*Excel доступен только в Premium</p>
              </div>
            </div>
            
            <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
              <h4 class="text-white font-semibold mb-3">👀 Предварительный просмотр</h4>
              <div class="text-xs text-gray-400 font-mono bg-black/30 p-3 rounded-lg overflow-x-auto">
                <div class="text-green-400"># Crypto Analytics Export</div>
                <div class="text-blue-400">Токен,Название,Цена,ATH,ATL,%ATH</div>
                <div>BTC,Bitcoin,{athAtlData()[0]?.current?.toLocaleString() || '43250'},69000,3200,-37.3%</div>
                <div>ETH,Ethereum,{athAtlData()[1]?.current?.toLocaleString() || '2680'},4878,0.43,+623444%</div>
                <div class="text-gray-600">...</div>
              </div>
              <div class="mt-3 text-sm text-gray-400">
                📈 Данные включают: {athAtlData().length} токенов
              </div>
            </div>
          </div>
        </div>
      </PremiumGate>

      {/* CTA для Free пользователей */}
      <Show when={!isPremium()}>
        <div class="bg-gradient-to-br from-purple-900/80 to-pink-900/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/50 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
          <div class="relative z-10">
            <div class="text-8xl mb-6">🚀</div>
            <h3 class="text-3xl font-bold text-white mb-4">
              Раскройте потенциал профессиональной аналитики
            </h3>
            <p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Получите доступ к полному набору аналитических инструментов, интерактивным графикам, 
              калькулятору прибыли и возможности экспорта данных в Excel.
            </p>
            
            <button 
              onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
              class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-xl scale-105 hover:scale-110"
            >
              💎 Обновить до Premium ($9.99/мес)
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}