import { createSignal, createEffect, onCleanup } from 'solid-js';
import { realAPI } from './realAPI';
import { AuthComponent, isAuthenticated } from './SimpleAuth';
import { advancedAPI } from './advancedAPI';
import { notificationService } from './services/NotificationService';
import { UserProfile } from './UserProfile';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Dashboard } from './screens/Dashboard';
import { AdvancedAlertsSection } from './sections/AdvancedAlertsSection';
import { NotificationCenter } from './components/NotificationCenter';

/**
 * Главное приложение Token Alert Manager с продвинутыми алертами
 */
function AppAdvanced() {
  // Сигналы для состояния приложения
  const [alerts, setAlerts] = createSignal([]);
  const [advancedAlerts, setAdvancedAlerts] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [toast, setToast] = createSignal(null);
  const [isOnline, setIsOnline] = createSignal(true);
  const [currentPage, setCurrentPage] = createSignal('dashboard'); // 'dashboard', 'advanced', 'profile'
  
  // Сигналы для живого табло цен
  const [livePrices, setLivePrices] = createSignal({});
  const [pricesLoading, setPricesLoading] = createSignal(true);
  const [lastUpdated, setLastUpdated] = createSignal(null);
  
  // Получаем токены из API
  const tokens = realAPI.getSupportedTokens();

  // Сигнал для нового простого алерта (обратная совместимость)
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
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      
      // Преобразуем данные в удобный формат
      const formattedPrices = {};
      Object.keys(data).forEach(tokenId => {
        formattedPrices[tokenId] = {
          usd: data[tokenId].usd,
          change24h: data[tokenId].usd_24h_change || 0,
          volume24h: data[tokenId].usd_24h_vol || 0,
          marketCap: data[tokenId].usd_market_cap || 0
        };
      });
      
      setLivePrices(formattedPrices);
      setLastUpdated(new Date());
      setPricesLoading(false);
      
      // Проверяем алерты после обновления цен
      await checkAdvancedAlerts();
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
      loadAdvancedAlerts();
    } else {
      setAdvancedAlerts([]);
    }
  });

  // Функция загрузки продвинутых алертов
  const loadAdvancedAlerts = async () => {
    try {
      setIsLoading(true);
      const userAlerts = await advancedAPI.getAlerts();
      setAdvancedAlerts(userAlerts);
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

  // Функция создания продвинутого алерта
  const createAdvancedAlert = async (alertData) => {
    try {
      const result = await advancedAPI.createAlert(alertData);
      
      if (result.success) {
        await loadAdvancedAlerts();
        showToast('🎯 Продвинутый алерт успешно создан!', 'success');
      } else {
        showToast(result.error || 'Ошибка создания алерта', 'error');
      }
    } catch (error) {
      console.error('Ошибка создания алерта:', error);
      showToast('Ошибка создания алерта', 'error');
    }
  };

  // Функция обновления алерта
  const updateAdvancedAlert = async (alertId, updates) => {
    try {
      const result = await advancedAPI.updateAlert(alertId, updates);
      
      if (result.success) {
        await loadAdvancedAlerts();
        showToast('Алерт обновлен', 'success');
      } else {
        showToast(result.error || 'Ошибка обновления алерта', 'error');
      }
    } catch (error) {
      console.error('Ошибка обновления алерта:', error);
      showToast('Ошибка обновления алерта', 'error');
    }
  };

  // Функция удаления алерта
  const deleteAdvancedAlert = async (alertId) => {
    try {
      if (!confirm('Удалить этот алерт?')) return;
      
      const result = await advancedAPI.deleteAlert(alertId);
      
      if (result.success) {
        await loadAdvancedAlerts();
        showToast('Алерт удален', 'success');
      } else {
        showToast(result.error || 'Ошибка удаления алерта', 'error');
      }
    } catch (error) {
      console.error('Ошибка удаления алерта:', error);
      showToast('Ошибка удаления алерта', 'error');
    }
  };

  // Функция приостановки алерта
  const pauseAlert = async (alertId) => {
    try {
      await updateAdvancedAlert(alertId, { isPaused: true });
    } catch (error) {
      console.error('Ошибка приостановки алерта:', error);
    }
  };

  // Функция возобновления алерта
  const resumeAlert = async (alertId) => {
    try {
      await updateAdvancedAlert(alertId, { isPaused: false });
    } catch (error) {
      console.error('Ошибка возобновления алерта:', error);
    }
  };

  // Проверка всех алертов
  const checkAdvancedAlerts = async () => {
    try {
      const triggeredAlerts = await advancedAPI.checkAlerts();
      
      // Отправляем уведомления для сработавших алертов
      for (const { alert, currentData, historicalData } of triggeredAlerts) {
        await notificationService.notify(alert, currentData, historicalData);
      }
      
      // Обновляем список если были изменения
      if (triggeredAlerts.length > 0) {
        await loadAdvancedAlerts();
      }
    } catch (error) {
      console.error('Ошибка проверки алертов:', error);
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
          {/* Header с центром уведомлений */}
          <header class="bg-dark-card border-b border-gray-700 sticky top-0 z-30">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-8">
                  <h1 class="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Token Alert Manager Pro
                  </h1>
                  
                  <nav class="hidden md:flex gap-4">
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      class={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage() === 'dashboard'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      📊 Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentPage('advanced')}
                      class={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage() === 'advanced'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      🚀 Продвинутые алерты
                    </button>
                    <button
                      onClick={() => setCurrentPage('profile')}
                      class={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage() === 'profile'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      👤 Профиль
                    </button>
                  </nav>
                </div>

                <div class="flex items-center gap-4">
                  {/* Статус сети */}
                  <div class={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                    isOnline() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <span class={`w-2 h-2 rounded-full ${isOnline() ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isOnline() ? 'Online' : 'Offline'}
                  </div>

                  {/* Центр уведомлений */}
                  <NotificationCenter />
                </div>
              </div>
            </div>
          </header>
          
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentPage() === 'profile' ? (
              <UserProfile />
            ) : currentPage() === 'advanced' ? (
              <AdvancedAlertsSection
                alerts={advancedAlerts}
                tokens={tokens}
                livePrices={livePrices}
                onCreateAlert={createAdvancedAlert}
                onUpdateAlert={updateAdvancedAlert}
                onDeleteAlert={deleteAdvancedAlert}
                onPauseAlert={pauseAlert}
                onResumeAlert={resumeAlert}
              />
            ) : (
              <Dashboard 
                tokens={tokens}
                livePrices={livePrices}
                lastUpdated={lastUpdated}
                alerts={alerts}
                newAlert={newAlert}
                setNewAlert={setNewAlert}
                addAlert={() => {}}
                removeAlert={() => {}}
                isOnline={isOnline}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default AppAdvanced;
