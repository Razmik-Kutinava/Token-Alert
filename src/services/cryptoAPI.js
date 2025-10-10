/**
 * API сервис для работы с криптовалютными данными
 */

// Fallback данные если API не работает
const fallbackData = {
  coins: [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      current_price: 43250.00,
      market_cap: 847000000000,
      price_change_percentage_24h: 2.5,
      ath: 69000.00,
      atl: 3200.00,
      ath_date: '2021-11-10T14:24:11.849Z',
      atl_date: '2013-07-06T00:00:00.000Z'
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      current_price: 2680.00,
      market_cap: 322000000000,
      price_change_percentage_24h: 1.8,
      ath: 4878.26,
      atl: 0.432979,
      ath_date: '2021-11-10T14:24:19.604Z',
      atl_date: '2015-10-20T00:00:00.000Z'
    },
    {
      id: 'binancecoin',
      symbol: 'BNB',
      name: 'BNB',
      image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
      current_price: 590.00,
      market_cap: 85000000000,
      price_change_percentage_24h: -0.5,
      ath: 686.31,
      atl: 0.0398177,
      ath_date: '2021-05-10T07:24:17.097Z',
      atl_date: '2017-10-19T00:00:00.000Z'
    },
    {
      id: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      current_price: 0.358,
      market_cap: 12500000000,
      price_change_percentage_24h: 3.2,
      ath: 3.09,
      atl: 0.01925275,
      ath_date: '2021-09-02T06:00:10.474Z',
      atl_date: '2020-03-13T02:22:55.391Z'
    },
    {
      id: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      current_price: 145.00,
      market_cap: 68000000000,
      price_change_percentage_24h: 5.7,
      ath: 259.96,
      atl: 0.500801,
      ath_date: '2021-11-06T21:54:35.825Z',
      atl_date: '2020-05-11T19:35:23.449Z'
    }
  ]
};

// История цен для калькулятора
const priceHistory = {
  bitcoin: {
    '2024-01-01': 42000,
    '2024-02-01': 43500,
    '2024-03-01': 41800,
    '2024-04-01': 44200,
    '2024-05-01': 46800,
    '2024-06-01': 45300,
    '2024-07-01': 47200,
    '2024-08-01': 48900,
    '2024-09-01': 46500,
    '2024-10-01': 43250
  },
  ethereum: {
    '2024-01-01': 2400,
    '2024-02-01': 2650,
    '2024-03-01': 2580,
    '2024-04-01': 2720,
    '2024-05-01': 2890,
    '2024-06-01': 2750,
    '2024-07-01': 2950,
    '2024-08-01': 3100,
    '2024-09-01': 2850,
    '2024-10-01': 2680
  }
};

class CryptoAPI {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.useProxy = true; // Использовать прокси для обхода CORS
  }

  // Получение списка монет с рыночными данными
  async getCoinsMarket(ids = 'bitcoin,ethereum,binancecoin,cardano,solana') {
    try {
      const url = this.useProxy 
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(`${this.baseURL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`)}`
        : `${this.baseURL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      if (this.useProxy) {
        const result = await response.json();
        data = JSON.parse(result.contents);
      } else {
        data = await response.json();
      }

      return data;
    } catch (error) {
      console.warn('API недоступен, используем fallback данные:', error);
      return fallbackData.coins.filter(coin => ids.includes(coin.id));
    }
  }

  // Получение детальной информации о монете
  async getCoinDetails(coinId) {
    try {
      const url = this.useProxy
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(`${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true`)}`
        : `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      if (this.useProxy) {
        const result = await response.json();
        data = JSON.parse(result.contents);
      } else {
        data = await response.json();
      }

      return data;
    } catch (error) {
      console.warn(`Детали для ${coinId} недоступны, используем fallback:`, error);
      const fallbackCoin = fallbackData.coins.find(coin => coin.id === coinId);
      if (fallbackCoin) {
        return {
          id: fallbackCoin.id,
          name: fallbackCoin.name,
          symbol: fallbackCoin.symbol,
          image: { small: fallbackCoin.image, large: fallbackCoin.image },
          market_data: {
            current_price: { usd: fallbackCoin.current_price },
            ath: { usd: fallbackCoin.ath },
            atl: { usd: fallbackCoin.atl },
            ath_date: { usd: fallbackCoin.ath_date },
            atl_date: { usd: fallbackCoin.atl_date }
          }
        };
      }
      return null;
    }
  }

  // Получение исторической цены на определенную дату
  async getHistoricalPrice(coinId, date) {
    try {
      // Пробуем использовать API
      const formattedDate = date.split('-').reverse().join('-'); // DD-MM-YYYY
      const url = this.useProxy
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(`${this.baseURL}/coins/${coinId}/history?date=${formattedDate}`)}`
        : `${this.baseURL}/coins/${coinId}/history?date=${formattedDate}`;

      const response = await fetch(url);
      
      if (response.ok) {
        let data;
        if (this.useProxy) {
          const result = await response.json();
          data = JSON.parse(result.contents);
        } else {
          data = await response.json();
        }

        return data.market_data?.current_price?.usd || 0;
      }
    } catch (error) {
      console.warn(`Историческая цена для ${coinId} недоступна, используем приблизительные данные:`, error);
    }

    // Fallback к приблизительным историческим данным
    const history = priceHistory[coinId];
    if (history) {
      // Ищем ближайшую дату
      const targetDate = new Date(date);
      const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      if (history[targetMonth]) {
        return history[targetMonth];
      }

      // Если точной даты нет, берем среднее между соседними
      const dates = Object.keys(history).sort();
      for (let i = 0; i < dates.length - 1; i++) {
        if (targetDate >= new Date(dates[i]) && targetDate <= new Date(dates[i + 1])) {
          return (history[dates[i]] + history[dates[i + 1]]) / 2;
        }
      }

      // Если дата слишком старая или новая, возвращаем ближайшую
      if (targetDate < new Date(dates[0])) {
        return history[dates[0]];
      }
      return history[dates[dates.length - 1]];
    }

    // Если данных совсем нет, возвращаем текущую цену с небольшой вариацией
    const currentCoin = fallbackData.coins.find(coin => coin.id === coinId);
    if (currentCoin) {
      const variation = (Math.random() - 0.5) * 0.3; // ±15% вариация
      return currentCoin.current_price * (1 + variation);
    }

    return 0;
  }

  // Получение графических данных
  async getChartData(coinId, days = 30) {
    try {
      const url = this.useProxy
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(`${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`)}`
        : `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

      const response = await fetch(url);
      
      if (response.ok) {
        let data;
        if (this.useProxy) {
          const result = await response.json();
          data = JSON.parse(result.contents);
        } else {
          data = await response.json();
        }

        return data;
      }
    } catch (error) {
      console.warn(`График для ${coinId} недоступен:`, error);
    }

    // Генерируем фейковые данные для графика
    const coin = fallbackData.coins.find(c => c.id === coinId);
    if (!coin) return { prices: [], volumes: [], market_caps: [] };

    const prices = [];
    const volumes = [];
    const market_caps = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days; i >= 0; i--) {
      const time = now - (i * dayMs);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% вариация
      const price = coin.current_price * (1 + variation);
      
      prices.push([time, price]);
      volumes.push([time, Math.random() * 1000000000]);
      market_caps.push([time, price * 21000000]); // Приблизительный market cap
    }

    return { prices, volumes, market_caps };
  }

  // Поиск монет
  async searchCoins(query) {
    try {
      const url = this.useProxy
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(`${this.baseURL}/search?query=${query}`)}`
        : `${this.baseURL}/search?query=${query}`;

      const response = await fetch(url);
      
      if (response.ok) {
        let data;
        if (this.useProxy) {
          const result = await response.json();
          data = JSON.parse(result.contents);
        } else {
          data = await response.json();
        }

        return data.coins || [];
      }
    } catch (error) {
      console.warn('Поиск недоступен, используем fallback:', error);
    }

    // Fallback поиск
    return fallbackData.coins.filter(coin => 
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const cryptoAPI = new CryptoAPI();
export default cryptoAPI;