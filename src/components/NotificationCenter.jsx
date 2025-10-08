import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import { notificationService } from '../services/NotificationService';

/**
 * Центр уведомлений
 */
export function NotificationCenter() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [notifications, setNotifications] = createSignal([]);
  const [unreadCount, setUnreadCount] = createSignal(0);
  const [visualNotification, setVisualNotification] = createSignal(null);

  // Загружаем историю уведомлений
  createEffect(() => {
    notificationService.loadNotificationHistory();
    setNotifications(notificationService.getNotificationHistory());
    setUnreadCount(notificationService.getUnreadCount());
  });

  // Слушаем визуальные уведомления
  createEffect(() => {
    const handleVisualNotification = (event) => {
      const notification = event.detail;
      setVisualNotification(notification);
      
      // Обновляем список
      setNotifications(notificationService.getNotificationHistory());
      setUnreadCount(notificationService.getUnreadCount());

      // Скрываем через 5 секунд
      setTimeout(() => {
        if (visualNotification()?.id === notification.id) {
          setVisualNotification(null);
        }
      }, 5000);
    };

    window.addEventListener('visual-notification', handleVisualNotification);
    
    onCleanup(() => {
      window.removeEventListener('visual-notification', handleVisualNotification);
    });
  });

  /**
   * Отметить как прочитанное
   */
  const markAsRead = (id) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getNotificationHistory());
    setUnreadCount(notificationService.getUnreadCount());
  };

  /**
   * Отметить все как прочитанные
   */
  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotificationHistory());
    setUnreadCount(0);
  };

  /**
   * Очистить историю
   */
  const clearHistory = () => {
    if (confirm('Очистить всю историю уведомлений?')) {
      notificationService.clearHistory();
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  /**
   * Форматирование времени
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Меньше минуты
    if (diff < 60000) {
      return 'только что';
    }

    // Меньше часа
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} мин назад`;
    }

    // Меньше дня
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ч назад`;
    }

    // Больше дня
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Закрыть визуальное уведомление
   */
  const closeVisualNotification = () => {
    setVisualNotification(null);
  };

  return (
    <>
      {/* Визуальное всплывающее уведомление */}
      <Show when={visualNotification()}>
        <div class="fixed top-20 right-4 z-50 max-w-md animate-slide-in">
          <div class={`bg-dark-card border-2 rounded-lg shadow-2xl overflow-hidden ${
            visualNotification().priority.level === 'critical'
              ? 'border-red-500 shadow-red-500/30'
              : visualNotification().priority.level === 'high'
              ? 'border-orange-500 shadow-orange-500/30'
              : visualNotification().priority.level === 'medium'
              ? 'border-yellow-500 shadow-yellow-500/30'
              : 'border-green-500 shadow-green-500/30'
          }`}>
            <div class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="font-bold text-lg mb-2">
                    {visualNotification().title}
                  </div>
                  <div class="text-sm text-gray-300 whitespace-pre-line">
                    {visualNotification().message.split('\n').slice(0, 4).join('\n')}
                  </div>
                </div>
                <button
                  onClick={closeVisualNotification}
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Прогресс-бар исчезновения */}
            <div class="h-1 bg-gray-700">
              <div 
                class={`h-full ${
                  visualNotification().priority.level === 'critical'
                    ? 'bg-red-500'
                    : visualNotification().priority.level === 'high'
                    ? 'bg-orange-500'
                    : visualNotification().priority.level === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style="animation: progress 5s linear"
              />
            </div>
          </div>
        </div>
      </Show>

      {/* Кнопка центра уведомлений */}
      <div class="relative">
        <button
          onClick={() => setIsOpen(!isOpen())}
          class="relative p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg 
            class="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          
          <Show when={unreadCount() > 0}>
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount() > 9 ? '9+' : unreadCount()}
            </span>
          </Show>
        </button>

        {/* Панель уведомлений */}
        <Show when={isOpen()}>
          <div class="fixed inset-0 z-40" onClick={() => setIsOpen(false)}>
            <div 
              class="absolute top-16 right-4 w-96 max-h-[600px] bg-dark-card border border-gray-700 rounded-lg shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div class="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-lg">Уведомления</h3>
                  <Show when={unreadCount() > 0}>
                    <p class="text-sm text-gray-400">
                      {unreadCount()} непрочитанных
                    </p>
                  </Show>
                </div>
                
                <div class="flex gap-2">
                  <Show when={unreadCount() > 0}>
                    <button
                      onClick={markAllAsRead}
                      class="text-sm text-blue-400 hover:text-blue-300"
                      title="Отметить все как прочитанные"
                    >
                      ✓ Все
                    </button>
                  </Show>
                  <Show when={notifications().length > 0}>
                    <button
                      onClick={clearHistory}
                      class="text-sm text-red-400 hover:text-red-300"
                      title="Очистить историю"
                    >
                      🗑️
                    </button>
                  </Show>
                </div>
              </div>

              {/* Список уведомлений */}
              <div class="flex-1 overflow-y-auto">
                <Show
                  when={notifications().length > 0}
                  fallback={
                    <div class="p-8 text-center text-gray-400">
                      <div class="text-4xl mb-2">🔔</div>
                      <p>Уведомлений пока нет</p>
                    </div>
                  }
                >
                  <For each={notifications()}>
                    {(notification) => (
                      <div 
                        class={`p-4 border-b border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-500/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div class="flex items-start gap-3">
                          {/* Иконка приоритета */}
                          <div class="text-2xl flex-shrink-0">
                            {notification.priority.icon}
                          </div>

                          {/* Содержимое */}
                          <div class="flex-1 min-w-0">
                            <div class="font-semibold mb-1 flex items-center gap-2">
                              {notification.alertName}
                              <Show when={!notification.read}>
                                <span class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              </Show>
                            </div>
                            
                            <div class="text-sm text-gray-400 mb-2">
                              {notification.tokenName} ({notification.tokenSymbol?.toUpperCase()})
                            </div>

                            <div class="flex items-center gap-4 text-sm">
                              <div>
                                <span class="text-gray-400">Цена:</span>
                                <span class="ml-1 font-semibold">
                                  ${notification.currentPrice?.toFixed(6)}
                                </span>
                              </div>
                              <Show when={notification.priceChange}>
                                <div class={notification.priceChange > 0 ? 'text-green-400' : 'text-red-400'}>
                                  {notification.priceChange > 0 ? '📈' : '📉'}
                                  {notification.priceChange > 0 ? '+' : ''}
                                  {notification.priceChange}%
                                </div>
                              </Show>
                            </div>

                            <Show when={notification.grouped && notification.groupCount > 1}>
                              <div class="mt-2 text-xs bg-gray-700 rounded px-2 py-1 inline-block">
                                🔄 Сработал {notification.groupCount}x
                              </div>
                            </Show>

                            <div class="text-xs text-gray-500 mt-2">
                              {formatTime(notification.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
