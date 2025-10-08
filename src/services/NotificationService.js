/**
 * Продвинутая система уведомлений
 * Поддерживает различные каналы, приоритеты и умное группирование
 */

import { Priority, NotificationChannel } from '../models/AlertTypes';

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.recentNotifications = [];
    this.soundEnabled = true;
    this.browserNotificationsEnabled = false;
    this.maxRecentNotifications = 50;
    this.groupingWindow = 60000; // 1 минута для группировки
    
    this.initializeBrowserNotifications();
    this.loadSettings();
  }

  /**
   * Инициализация браузерных уведомлений
   */
  async initializeBrowserNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.browserNotificationsEnabled = true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        this.browserNotificationsEnabled = permission === 'granted';
      }
    }
  }

  /**
   * Загрузка настроек из localStorage
   */
  loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
      this.soundEnabled = settings.soundEnabled !== false;
      this.browserNotificationsEnabled = settings.browserNotificationsEnabled !== false;
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Сохранение настроек
   */
  saveSettings() {
    try {
      localStorage.setItem('notification_settings', JSON.stringify({
        soundEnabled: this.soundEnabled,
        browserNotificationsEnabled: this.browserNotificationsEnabled
      }));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Отправка уведомления
   */
  async notify(alert, currentData, historicalData) {
    const notification = this.createNotification(alert, currentData, historicalData);
    
    // Проверка на дублирование (умное группирование)
    if (this.shouldGroupNotification(notification)) {
      this.groupNotification(notification);
      return;
    }

    // Добавляем в очередь
    this.notificationQueue.push(notification);
    this.recentNotifications.unshift(notification);
    
    // Ограничиваем размер истории
    if (this.recentNotifications.length > this.maxRecentNotifications) {
      this.recentNotifications = this.recentNotifications.slice(0, this.maxRecentNotifications);
    }

    // Отправляем по всем каналам
    await this.sendToChannels(notification, alert.notificationChannels);

    // Сохраняем в localStorage
    this.saveNotificationHistory();
  }

  /**
   * Создание объекта уведомления
   */
  createNotification(alert, currentData, historicalData) {
    const priority = Priority[alert.priority.toUpperCase()] || Priority.MEDIUM;
    
    return {
      id: Date.now().toString() + Math.random(),
      alertId: alert.id,
      alertName: alert.name,
      title: this.generateTitle(alert, currentData),
      message: this.generateMessage(alert, currentData, historicalData),
      priority: priority,
      timestamp: new Date().toISOString(),
      tokenId: alert.tokenId,
      tokenName: alert.tokenName,
      tokenSymbol: alert.tokenSymbol,
      currentPrice: currentData.price,
      priceChange: historicalData?.startPrice 
        ? ((currentData.price - historicalData.startPrice) / historicalData.startPrice * 100).toFixed(2)
        : null,
      read: false,
      grouped: false,
      groupCount: 1
    };
  }

  /**
   * Генерация заголовка уведомления
   */
  generateTitle(alert, currentData) {
    const priority = Priority[alert.priority.toUpperCase()] || Priority.MEDIUM;
    return `${priority.icon} ${alert.name}`;
  }

  /**
   * Генерация сообщения уведомления
   */
  generateMessage(alert, currentData, historicalData) {
    let message = alert.notificationMessage || alert.description;
    
    // Добавляем контекстную информацию
    message += `\n\n💰 Текущая цена: $${currentData.price.toFixed(6)}`;
    
    if (historicalData?.startPrice) {
      const change = ((currentData.price - historicalData.startPrice) / historicalData.startPrice * 100);
      const changeIcon = change > 0 ? '📈' : '📉';
      message += `\n${changeIcon} Изменение: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    }
    
    if (currentData.volume) {
      message += `\n📊 Объем 24ч: $${this.formatNumber(currentData.volume)}`;
    }
    
    if (currentData.rank) {
      message += `\n🏆 Рейтинг: #${currentData.rank}`;
    }
    
    return message;
  }

  /**
   * Проверка необходимости группировки
   */
  shouldGroupNotification(notification) {
    const recentSimilar = this.recentNotifications.find(n => 
      n.alertId === notification.alertId &&
      n.tokenId === notification.tokenId &&
      (Date.now() - new Date(n.timestamp).getTime()) < this.groupingWindow
    );
    
    return !!recentSimilar;
  }

  /**
   * Группировка уведомлений
   */
  groupNotification(notification) {
    const existingNotification = this.recentNotifications.find(n => 
      n.alertId === notification.alertId &&
      n.tokenId === notification.tokenId &&
      (Date.now() - new Date(n.timestamp).getTime()) < this.groupingWindow
    );
    
    if (existingNotification) {
      existingNotification.groupCount++;
      existingNotification.grouped = true;
      existingNotification.timestamp = new Date().toISOString();
      this.saveNotificationHistory();
    }
  }

  /**
   * Отправка по каналам
   */
  async sendToChannels(notification, channels) {
    for (const channel of channels) {
      switch (channel) {
        case NotificationChannel.BROWSER:
          await this.sendBrowserNotification(notification);
          break;
        case NotificationChannel.SOUND:
          this.playSound(notification.priority);
          break;
        case NotificationChannel.VISUAL:
          this.showVisualNotification(notification);
          break;
        // EMAIL будет добавлен позже при интеграции с backend
      }
    }
  }

  /**
   * Браузерное уведомление
   */
  async sendBrowserNotification(notification) {
    if (!this.browserNotificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message.split('\n').slice(0, 3).join('\n'), // Первые 3 строки
        icon: this.getIconForPriority(notification.priority),
        badge: '/favicon.ico',
        tag: notification.alertId, // Группировка по alertId
        requireInteraction: notification.priority.level === 'critical',
        timestamp: new Date(notification.timestamp).getTime()
      });

      browserNotif.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotif.close();
      };
    } catch (error) {
      console.error('Error sending browser notification:', error);
    }
  }

  /**
   * Воспроизведение звука
   */
  playSound(priority) {
    if (!this.soundEnabled) return;

    try {
      // Создаем AudioContext для генерации звуков
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Разные частоты для разных приоритетов
      const frequencies = {
        critical: [800, 1000, 800],
        high: [600, 800],
        medium: [500],
        low: [400]
      };

      const freqs = frequencies[priority.level] || frequencies.medium;
      let currentTime = audioContext.currentTime;

      freqs.forEach((freq, index) => {
        oscillator.frequency.setValueAtTime(freq, currentTime);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        currentTime += 0.3;
      });

      oscillator.start(audioContext.currentTime);
      oscillator.stop(currentTime);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Визуальное уведомление (для отображения в UI)
   */
  showVisualNotification(notification) {
    // Создаем событие для UI
    window.dispatchEvent(new CustomEvent('visual-notification', {
      detail: notification
    }));
  }

  /**
   * Получить иконку для приоритета
   */
  getIconForPriority(priority) {
    // В реальном приложении здесь были бы пути к реальным иконкам
    return '/favicon.ico';
  }

  /**
   * Форматирование больших чисел
   */
  formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  /**
   * Отметить уведомление как прочитанное
   */
  markAsRead(notificationId) {
    const notification = this.recentNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotificationHistory();
    }
  }

  /**
   * Отметить все как прочитанные
   */
  markAllAsRead() {
    this.recentNotifications.forEach(n => n.read = true);
    this.saveNotificationHistory();
  }

  /**
   * Очистить историю уведомлений
   */
  clearHistory() {
    this.recentNotifications = [];
    this.saveNotificationHistory();
  }

  /**
   * Получить количество непрочитанных
   */
  getUnreadCount() {
    return this.recentNotifications.filter(n => !n.read).length;
  }

  /**
   * Получить историю уведомлений
   */
  getNotificationHistory() {
    return this.recentNotifications;
  }

  /**
   * Сохранить историю в localStorage
   */
  saveNotificationHistory() {
    try {
      localStorage.setItem('notification_history', JSON.stringify(this.recentNotifications));
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }

  /**
   * Загрузить историю из localStorage
   */
  loadNotificationHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
      this.recentNotifications = history;
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
  }

  /**
   * Включить/выключить звук
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSettings();
    return this.soundEnabled;
  }

  /**
   * Включить/выключить браузерные уведомления
   */
  async toggleBrowserNotifications() {
    if (!this.browserNotificationsEnabled) {
      await this.initializeBrowserNotifications();
    } else {
      this.browserNotificationsEnabled = false;
      this.saveSettings();
    }
    return this.browserNotificationsEnabled;
  }
}

// Экспортируем singleton
export const notificationService = new NotificationService();
