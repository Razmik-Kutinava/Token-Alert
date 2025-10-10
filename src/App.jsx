import { createSignal, createEffect, onCleanup } from 'solid-js';
import { realAPI } from './realAPI';
import { AuthComponent, isAuthenticated, getCurrentUser } from './SimpleAuth';
import { UserProfile } from './UserProfile';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Dashboard } from './screens/Dashboard';
import { AnalyticsPage } from './screens/AnalyticsPage';

/**
 * Главное приложение Token Alert Manager
 */
function App() {
  // Сигналы для состояния приложения
  const [isLoading, setIsLoading] = createSignal(true);
  const [toast, setToast] = createSignal(null);
  const [isOnline, setIsOnline] = createSignal(true);
  const [currentPage, setCurrentPage] = createSignal('dashboard'); // Навигация между страницами
  
  // Сигналы для живого табло цен
  const [livePrices, setLivePrices] = createSignal([]);
  const [pricesLoading, setPricesLoading] = createSignal(true);
  const [lastUpdated, setLastUpdated] = createSignal(null);
  
  // Сигналы для формы
  const [selectedToken, setSelectedToken] = createSignal('bitcoin');
  const [condition, setCondition] = createSignal('less');
  const [targetPrice, setTargetPrice] = createSignal('');
  const [notificationType, setNotificationType] = createSignal('web');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  
  // Получаем токены из API
  const tokens = realAPI.getSupportedTokens();

  // Обработчики состояния сети
  createEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    onCleanup(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  });

  // Функция загрузки цен
  const fetchLivePrices = async () => {
    try {
      if (!isOnline()) {
        console.log('🔌 Офлайн режим');
        return;
      }
      
      console.log('🔄 Загружаем цены...');
      const tokenIds = tokens.map(t => t.id).join(',');
      console.log('📋 Токены:', tokenIds);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const data = await response.json();
      console.log('📊 Данные API:', data);
      
      // Преобразуем данные в удобный формат для AlertsSection
      const formattedPrices = [];
      Object.keys(data).forEach(tokenId => {
        formattedPrices.push({
          id: tokenId,
          current_price: data[tokenId].usd,
          price_change_percentage_24h: data[tokenId].usd_24h_change || 0
        });
      });
      
      console.log('✅ Форматированные цены:', formattedPrices);
      setLivePrices(formattedPrices);
      setLastUpdated(new Date());
      setPricesLoading(false);
    } catch (error) {
      console.error('❌ Ошибка загрузки цен:', error);
      console.log('🎭 Используем моковые данные из-за CORS...');
      setPricesLoading(false);
      
      // Устанавливаем моковые данные при ошибке CORS
      const mockPrices = [
        { id: 'bitcoin', current_price: 63245.67, price_change_percentage_24h: 2.34 },
        { id: 'ethereum', current_price: 3456.78, price_change_percentage_24h: -1.23 },
        { id: 'solana', current_price: 145.23, price_change_percentage_24h: 5.67 },
        { id: 'cardano', current_price: 0.45, price_change_percentage_24h: -0.89 },
        { id: 'polkadot', current_price: 5.67, price_change_percentage_24h: 1.45 },
        { id: 'avalanche-2', current_price: 28.90, price_change_percentage_24h: 3.21 },
        { id: 'chainlink', current_price: 12.45, price_change_percentage_24h: -2.10 },
        { id: 'polygon', current_price: 0.89, price_change_percentage_24h: 4.56 }
      ];
      
      console.log('🎭 Моковые данные установлены:', mockPrices);
      setLivePrices(mockPrices);
      setLastUpdated(new Date());
    }
  };

  // Эффект для загрузки цен при старте и периодического обновления
  createEffect(() => {
    fetchLivePrices();
    
    const interval = setInterval(() => {
      if (isOnline()) {
        fetchLivePrices();
      }
    }, 30000); // Обновление каждые 30 секунд
    
    onCleanup(() => clearInterval(interval));
  });

  // Загрузка данных при аутентификации  
  createEffect(() => {
    if (isAuthenticated()) {
      // Alert Engine будет загружать свои данные автоматически
    }
  });

  // Функция показа уведомлений
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div class="min-h-screen bg-dark-bg text-white">
      <Toast toast={toast()} />
      
      {!isAuthenticated() ? (
        <div class="flex items-center justify-center min-h-screen">
          <div class="max-w-md w-full mx-4">
            <AuthComponent />
          </div>
        </div>
      ) : (
        <>
          <Header 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isOnline={isOnline}
          />
          
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentPage() === 'profile' ? (
              <UserProfile />
            ) : currentPage() === 'analytics' ? (
              <AnalyticsPage 
                user={getCurrentUser()} 
                tokens={tokens}
                livePrices={livePrices}
              />
            ) : (
              <Dashboard 
                tokens={tokens}
                livePrices={livePrices}
                lastUpdated={lastUpdated}
                isOnline={isOnline}
                user={getCurrentUser()}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;