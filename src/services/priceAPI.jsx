// Сервис для работы с API цен криптовалют
// Поддерживает fallback на моковые данные для production

class PriceAPI {
  constructor() {
    this.isProduction = !import.meta.env.DEV && 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1');
    
    this.mockData = [
      { id: 'bitcoin', current_price: 63245.67, price_change_percentage_24h: 2.34, symbol: 'BTC' },
      { id: 'ethereum', current_price: 3456.78, price_change_percentage_24h: -1.23, symbol: 'ETH' },
      { id: 'solana', current_price: 145.23, price_change_percentage_24h: 5.67, symbol: 'SOL' },
      { id: 'cardano', current_price: 0.45, price_change_percentage_24h: -0.89, symbol: 'ADA' },
      { id: 'polkadot', current_price: 6.78, price_change_percentage_24h: 3.45, symbol: 'DOT' },
      { id: 'avalanche-2', current_price: 27.82, price_change_percentage_24h: 1.20, symbol: 'AVAX' },
      { id: 'chainlink', current_price: 22.22, price_change_percentage_24h: 2.82, symbol: 'LINK' },
      { id: 'polygon', current_price: 0.89, price_change_percentage_24h: 0.00, symbol: 'MATIC' }
    ];
    
    console.log('💰 Price API initialized:', {
      isProduction: this.isProduction,
      willUseMockData: this.isProduction
    });
  }

  async fetchPrices(tokenIds) {
    // В production сразу возвращаем моковые данные
    if (this.isProduction) {
      console.log('🎭 Production: используем моковые данные для избежания CORS');
      return this.getMockPrices(tokenIds);
    }

    // В development пытаемся получить реальные данные
    try {
      console.log('🔄 Development: загружаем реальные цены от CoinGecko...');
      const tokenIdsString = Array.isArray(tokenIds) ? tokenIds.join(',') : tokenIds;
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIdsString}&vs_currencies=usd&include_24hr_change=true`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Добавляем timeout для быстрого fallback
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Реальные данные получены от CoinGecko');
      
      return this.formatApiData(data);
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки от CoinGecko, используем моковые данные:', error.message);
      return this.getMockPrices(tokenIds);
    }
  }

  formatApiData(data) {
    const formattedPrices = [];
    Object.keys(data).forEach(tokenId => {
      formattedPrices.push({
        id: tokenId,
        current_price: data[tokenId].usd,
        price_change_percentage_24h: data[tokenId].usd_24h_change || 0
      });
    });
    return formattedPrices;
  }

  getMockPrices(requestedTokenIds) {
    let tokensToReturn = this.mockData;
    
    // Фильтруем только запрошенные токены, если указаны
    if (requestedTokenIds) {
      const idsArray = Array.isArray(requestedTokenIds) 
        ? requestedTokenIds 
        : requestedTokenIds.split(',');
      
      tokensToReturn = this.mockData.filter(token => 
        idsArray.includes(token.id)
      );
    }
    
    // Добавляем небольшую рандомизацию цен для реалистичности
    return tokensToReturn.map(token => ({
      ...token,
      current_price: token.current_price * (0.95 + Math.random() * 0.1), // ±5%
      price_change_percentage_24h: token.price_change_percentage_24h + (Math.random() - 0.5) * 2 // ±1%
    }));
  }

  // Статический метод для быстрого доступа
  static async getPrices(tokenIds) {
    const api = new PriceAPI();
    return await api.fetchPrices(tokenIds);
  }
}

export default PriceAPI;