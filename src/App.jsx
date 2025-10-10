import { createSignal, createEffect, onCleanup } from 'solid-js';
import { realAPI } from './realAPI';
import { AuthComponent, isAuthenticated, getCurrentUser } from './SimpleAuth';
import { UserProfile } from './UserProfile';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Dashboard } from './screens/Dashboard';
import { AnalyticsPage } from './screens/AnalyticsPage';
import PriceAPI from './services/priceAPI.jsx';

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
      const tokenIds = tokens.map(t => t.id);
      console.log('📋 Токены:', tokenIds.join(','));
      
      // Используем новый PriceAPI сервис
      const formattedPrices = await PriceAPI.getPrices(tokenIds);
      
      console.log('✅ Форматированные цены:', formattedPrices);
      setLivePrices(formattedPrices);
      setLastUpdated(new Date());
      setPricesLoading(false);
    } catch (error) {
      console.error('❌ Критическая ошибка загрузки цен:', error);
      setPricesLoading(false);
      
      // В крайнем случае используем базовые моковые данные
      const emergencyPrices = [
        { id: 'bitcoin', current_price: 63000, price_change_percentage_24h: 0 },
        { id: 'ethereum', current_price: 3400, price_change_percentage_24h: 0 }
      ];
      setLivePrices(emergencyPrices);
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