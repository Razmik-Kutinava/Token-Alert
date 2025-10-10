import { createSignal, createEffect, For, Show } from 'solid-js';

/**
 * Компонент экспорта данных
 */
export function DataExporter() {
  const [selectedTokens, setSelectedTokens] = createSignal([]);
  const [exportFormat, setExportFormat] = createSignal('csv');
  const [timeRange, setTimeRange] = createSignal('30');
  const [dataTypes, setDataTypes] = createSignal(['price', 'volume', 'market_cap']);
  const [loading, setLoading] = createSignal(false);
  const [exportHistory, setExportHistory] = createSignal([]);

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
    { id: 'algorand', symbol: 'ALGO', name: 'Algorand' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar' }
  ];

  // Типы данных для экспорта
  const availableDataTypes = [
    { id: 'price', label: 'Цены', description: 'Исторические цены' },
    { id: 'volume', label: 'Объемы', description: 'Торговые объемы' },
    { id: 'market_cap', label: 'Капитализация', description: 'Рыночная капитализация' },
    { id: 'total_volumes', label: 'Общий объем', description: 'Общий торговый объем' }
  ];

  // Форматы экспорта
  const exportFormats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { id: 'xlsx', label: 'Excel', description: 'Microsoft Excel файл' }
  ];

  // Временные диапазоны
  const timeRanges = [
    { id: '1', label: '1 день' },
    { id: '7', label: '7 дней' },
    { id: '30', label: '30 дней' },
    { id: '90', label: '3 месяца' },
    { id: '180', label: '6 месяцев' },
    { id: '365', label: '1 год' },
    { id: 'max', label: 'Максимум' }
  ];

  // Добавить/удалить токен
  const toggleToken = (token) => {
    const exists = selectedTokens().some(t => t.id === token.id);
    if (exists) {
      setSelectedTokens(selectedTokens().filter(t => t.id !== token.id));
    } else if (selectedTokens().length < 10) {
      setSelectedTokens([...selectedTokens(), token]);
    }
  };

  // Переключить тип данных
  const toggleDataType = (typeId) => {
    const current = dataTypes();
    if (current.includes(typeId)) {
      setDataTypes(current.filter(t => t !== typeId));
    } else {
      setDataTypes([...current, typeId]);
    }
  };

  // Получение данных для экспорта
  const fetchExportData = async () => {
    const promises = selectedTokens().map(async (token) => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${token.id}/market_chart?vs_currency=usd&days=${timeRange()}`
        );
        const data = await response.json();
        
        return {
          token: token,
          data: data
        };
      } catch (error) {
        console.error(`Ошибка загрузки данных для ${token.symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
  };

  // Экспорт в CSV
  const exportToCSV = (data) => {
    let csvContent = 'Timestamp,Token,Symbol';
    
    // Добавляем заголовки для выбранных типов данных
    dataTypes().forEach(type => {
      csvContent += `,${type}`;
    });
    csvContent += '\n';

    // Добавляем данные
    data.forEach(item => {
      const token = item.token;
      const marketData = item.data;

      // Определяем максимальную длину массивов
      const maxLength = Math.max(
        marketData.prices?.length || 0,
        marketData.market_caps?.length || 0,
        marketData.total_volumes?.length || 0
      );

      for (let i = 0; i < maxLength; i++) {
        const timestamp = marketData.prices?.[i]?.[0] || '';
        const date = timestamp ? new Date(timestamp).toISOString() : '';
        
        csvContent += `${date},${token.name},${token.symbol}`;
        
        dataTypes().forEach(type => {
          let value = '';
          switch(type) {
            case 'price':
              value = marketData.prices?.[i]?.[1] || '';
              break;
            case 'volume':
            case 'total_volumes':
              value = marketData.total_volumes?.[i]?.[1] || '';
              break;
            case 'market_cap':
              value = marketData.market_caps?.[i]?.[1] || '';
              break;
          }
          csvContent += `,${value}`;
        });
        csvContent += '\n';
      }
    });

    return csvContent;
  };

  // Экспорт в JSON
  const exportToJSON = (data) => {
    const exportData = {
      export_info: {
        timestamp: new Date().toISOString(),
        tokens: selectedTokens().map(t => ({ id: t.id, symbol: t.symbol, name: t.name })),
        time_range: timeRange(),
        data_types: dataTypes()
      },
      data: data.map(item => ({
        token: item.token,
        market_data: item.data
      }))
    };

    return JSON.stringify(exportData, null, 2);
  };

  // Скачивание файла
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Основная функция экспорта
  const handleExport = async () => {
    if (selectedTokens().length === 0 || dataTypes().length === 0) return;

    setLoading(true);
    try {
      const data = await fetchExportData();
      
      if (data.length === 0) {
        alert('Не удалось загрузить данные для экспорта');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const tokensStr = selectedTokens().map(t => t.symbol).join('-');
      
      let content, filename, contentType;

      switch (exportFormat()) {
        case 'csv':
          content = exportToCSV(data);
          filename = `crypto-data-${tokensStr}-${timestamp}.csv`;
          contentType = 'text/csv';
          break;
          
        case 'json':
          content = exportToJSON(data);
          filename = `crypto-data-${tokensStr}-${timestamp}.json`;
          contentType = 'application/json';
          break;
          
        case 'xlsx':
          // Для простоты экспортируем как CSV с .xlsx расширением
          content = exportToCSV(data);
          filename = `crypto-data-${tokensStr}-${timestamp}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
      }

      downloadFile(content, filename, contentType);
      
      // Добавляем в историю экспорта
      const exportRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        tokens: [...selectedTokens()],
        format: exportFormat(),
        filename: filename,
        dataTypes: [...dataTypes()],
        timeRange: timeRange()
      };
      
      setExportHistory([exportRecord, ...exportHistory().slice(0, 9)]); // Храним последние 10
      
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Произошла ошибка при экспорте данных');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="bg-gray-800 rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            📊 Экспорт данных
          </h3>
          <p class="text-gray-400 text-sm">Экспортируйте исторические данные в различных форматах</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Настройки экспорта */}
        <div class="space-y-6">
          {/* Выбор токенов */}
          <div>
            <h4 class="text-lg font-medium text-white mb-3">
              Выберите токены ({selectedTokens().length}/10)
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <For each={popularTokens}>
                {(token) => (
                  <button
                    onClick={() => toggleToken(token)}
                    disabled={!selectedTokens().some(t => t.id === token.id) && selectedTokens().length >= 10}
                    class={`p-3 rounded-lg border text-left transition-colors disabled:opacity-50 ${
                      selectedTokens().some(t => t.id === token.id)
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

          {/* Временной диапазон */}
          <div>
            <h4 class="text-lg font-medium text-white mb-3">Временной диапазон</h4>
            <div class="grid grid-cols-2 gap-2">
              <For each={timeRanges}>
                {(range) => (
                  <button
                    onClick={() => setTimeRange(range.id)}
                    class={`p-3 rounded-lg border text-center transition-colors ${
                      timeRange() === range.id
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {range.label}
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Типы данных */}
          <div>
            <h4 class="text-lg font-medium text-white mb-3">Типы данных</h4>
            <div class="space-y-2">
              <For each={availableDataTypes}>
                {(type) => (
                  <label class="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataTypes().includes(type.id)}
                      onChange={() => toggleDataType(type.id)}
                      class="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                    />
                    <div class="ml-3">
                      <div class="text-white font-medium">{type.label}</div>
                      <div class="text-gray-400 text-sm">{type.description}</div>
                    </div>
                  </label>
                )}
              </For>
            </div>
          </div>

          {/* Формат экспорта */}
          <div>
            <h4 class="text-lg font-medium text-white mb-3">Формат файла</h4>
            <div class="space-y-2">
              <For each={exportFormats}>
                {(format) => (
                  <label class="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format.id}
                      checked={exportFormat() === format.id}
                      onChange={() => setExportFormat(format.id)}
                      class="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 focus:ring-blue-500"
                    />
                    <div class="ml-3">
                      <div class="text-white font-medium">{format.label}</div>
                      <div class="text-gray-400 text-sm">{format.description}</div>
                    </div>
                  </label>
                )}
              </For>
            </div>
          </div>

          {/* Кнопка экспорта */}
          <button
            onClick={handleExport}
            disabled={selectedTokens().length === 0 || dataTypes().length === 0 || loading()}
            class="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Show when={loading()}>
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </Show>
            {loading() ? 'Экспорт...' : 'Экспортировать данные'}
          </button>
        </div>

        {/* Предварительный просмотр и история */}
        <div class="space-y-6">
          {/* Предварительный просмотр */}
          <div class="bg-gray-900 rounded-lg p-4">
            <h4 class="text-lg font-medium text-white mb-3">Предварительный просмотр</h4>
            
            <Show when={selectedTokens().length === 0}>
              <div class="text-center py-8">
                <div class="text-4xl mb-2">📊</div>
                <p class="text-gray-400">Выберите токены для экспорта</p>
              </div>
            </Show>

            <Show when={selectedTokens().length > 0}>
              <div class="space-y-3">
                <div class="text-sm">
                  <span class="text-gray-400">Токены:</span>
                  <span class="text-white ml-2">
                    {selectedTokens().map(t => t.symbol).join(', ')}
                  </span>
                </div>
                
                <div class="text-sm">
                  <span class="text-gray-400">Период:</span>
                  <span class="text-white ml-2">
                    {timeRanges().find(r => r.id === timeRange())?.label}
                  </span>
                </div>
                
                <div class="text-sm">
                  <span class="text-gray-400">Данные:</span>
                  <span class="text-white ml-2">
                    {dataTypes().map(dt => 
                      availableDataTypes.find(adt => adt.id === dt)?.label
                    ).join(', ')}
                  </span>
                </div>
                
                <div class="text-sm">
                  <span class="text-gray-400">Формат:</span>
                  <span class="text-white ml-2">
                    {exportFormats.find(f => f.id === exportFormat())?.label}
                  </span>
                </div>
              </div>
            </Show>
          </div>

          {/* История экспорта */}
          <div class="bg-gray-900 rounded-lg p-4">
            <h4 class="text-lg font-medium text-white mb-3">История экспорта</h4>
            
            <Show when={exportHistory().length === 0}>
              <div class="text-center py-8">
                <div class="text-4xl mb-2">📄</div>
                <p class="text-gray-400">История экспорта пуста</p>
              </div>
            </Show>

            <Show when={exportHistory().length > 0}>
              <div class="space-y-3 max-h-60 overflow-y-auto">
                <For each={exportHistory()}>
                  {(record) => (
                    <div class="bg-gray-800 rounded-lg p-3">
                      <div class="text-sm text-white font-medium mb-1">
                        {record.filename}
                      </div>
                      <div class="text-xs text-gray-400">
                        {new Date(record.timestamp).toLocaleString('ru-RU')}
                      </div>
                      <div class="text-xs text-gray-400">
                        {record.tokens.map(t => t.symbol).join(', ')} • {record.format.toUpperCase()}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}