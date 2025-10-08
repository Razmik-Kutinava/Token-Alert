import { createSignal, createEffect, onCleanup } from 'solid-js';
import { realAPI } from './realAPI';
import { AuthComponent, isAuthenticated } from './SimpleAuth';
import { simpleAPI } from './simpleAPI';
import { UserProfile } from './UserProfile';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Dashboard } from './screens/Dashboard';

/**
 * Главное приложение Token Alert Manager
 */
function App() {
  // Сигналы для состояния приложения
  const [alerts, setAlerts] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [toast, setToast] = createSignal(null);
  const [isOnline, setIsOnline] = createSignal(true);
  const [currentPage, setCurrentPage] = createSignal('dashboard'); // Навигация между страницами
  
  // Сигналы для живого табло цен
  const [livePrices, setLivePrices] = createSignal({});
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

  // Сигнал для нового алерта
  const [newAlert, setNewAlert] = createSignal({
    token: '',
    type: 'above',
    price: 0
  });

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
      if (!isOnline()) return;
      
      const tokenIds = tokens.map(t => t.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      
      // Преобразуем данные в удобный формат
      const formattedPrices = {};
      Object.keys(data).forEach(tokenId => {
        formattedPrices[tokenId] = {
          usd: data[tokenId].usd,
          change24h: data[tokenId].usd_24h_change || 0
        };
      });
      
      setLivePrices(formattedPrices);
      setLastUpdated(new Date());
      setPricesLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки цен:', error);
      setPricesLoading(false);
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

  // Загрузка алертов при аутентификации
  createEffect(() => {
    if (isAuthenticated()) {
      loadAlerts();
    } else {
      setAlerts([]);
    }
  });

  // Функция загрузки алертов
  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const userAlerts = await simpleAPI.getAlerts();
      setAlerts(userAlerts);
    } catch (error) {
      console.error('Ошибка загрузки алертов:', error);
      showToast('Ошибка загрузки алертов', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция показа уведомлений
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Функция добавления алерта
  const addAlert = async () => {
    if (!newAlert().token || !newAlert().price) {
      showToast('Заполните все поля', 'error');
      return;
    }

    try {
      const alert = {
        id: Date.now(),
        token: newAlert().token,
        type: newAlert().type,
        price: newAlert().price,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await simpleAPI.addAlert(alert);
      setAlerts(prev => [...prev, alert]);
      
      // Сброс формы
      setNewAlert({
        token: '',
        type: 'above',
        price: 0
      });
      
      showToast('Алерт успешно создан!', 'success');
    } catch (error) {
      console.error('Ошибка создания алерта:', error);
      showToast('Ошибка создания алерта', 'error');
    }
  };

  // Функция удаления алерта
  const removeAlert = async (alertId) => {
    try {
      await simpleAPI.removeAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      showToast('Алерт удален', 'success');
    } catch (error) {
      console.error('Ошибка удаления алерта:', error);
      showToast('Ошибка удаления алерта', 'error');
    }
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
            ) : (
              <Dashboard 
                tokens={tokens}
                livePrices={livePrices}
                lastUpdated={lastUpdated}
                alerts={alerts}
                newAlert={newAlert}
                setNewAlert={setNewAlert}
                addAlert={addAlert}
                removeAlert={removeAlert}
                isOnline={isOnline}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;