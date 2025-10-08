/**
 * Личный кабинет пользователя
 * Полноценная страница с профилем, тарифом и статистикой
 */

import { createSignal, createEffect } from 'solid-js';
import { 
  User, 
  Star, 
  Bell, 
  Settings, 
  Calendar, 
  CreditCard, 
  Edit3, 
  Save, 
  X,
  Crown,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-solid';
import { currentUser } from './SimpleAuth';
import { simpleAPI } from './simpleAPI';

/**
 * Компонент личного кабинета
 */
export function UserProfile() {
  // Состояние формы
  const [isEditing, setIsEditing] = createSignal(false);
  const [firstName, setFirstName] = createSignal('');
  const [lastName, setLastName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [bio, setBio] = createSignal('');
  
  // Статистика пользователя
  const [stats, setStats] = createSignal({
    totalAlerts: 0,
    activeAlerts: 0,
    triggeredAlerts: 0,
    savedMoney: 0
  });

  // Информация о тарифе
  const [subscription, setSubscription] = createSignal({
    plan: 'Free',
    price: '0₽',
    alertsLimit: 5,
    alertsUsed: 0,
    validUntil: null,
    features: ['5 алертов', 'Email уведомления', 'Базовая поддержка']
  });

  // Загружаем данные при инициализации
  createEffect(() => {
    if (currentUser()) {
      loadUserProfile();
      loadUserStats();
      loadSubscriptionInfo();
    }
  });

  // Загрузка профиля пользователя
  const loadUserProfile = () => {
    const user = currentUser();
    const savedProfile = localStorage.getItem(`profile_${user.id}`);
    
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    } else {
      // Генерируем случайные данные для демо
      const names = ['Александр', 'Дмитрий', 'Михаил', 'Андрей', 'Сергей'];
      const surnames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов'];
      
      setFirstName(names[Math.floor(Math.random() * names.length)]);
      setLastName(surnames[Math.floor(Math.random() * surnames.length)]);
      setPhone('+7 (999) 123-45-67');
      setBio('Активный трейдер криптовалют. Интересуюсь DeFi и новыми технологиями блокчейн.');
    }
  };

  // Загрузка статистики
  const loadUserStats = () => {
    const alerts = simpleAPI.getAlerts();
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(alert => alert.is_active).length;
    const triggeredAlerts = alerts.filter(alert => alert.is_triggered).length;
    
    setStats({
      totalAlerts,
      activeAlerts,
      triggeredAlerts,
      savedMoney: Math.floor(Math.random() * 50000) + 10000 // Демо данные
    });
  };

  // Загрузка информации о подписке
  const loadSubscriptionInfo = () => {
    const user = currentUser();
    const plans = {
      'admin': {
        plan: 'Admin Pro',
        price: '∞₽',
        alertsLimit: 999,
        alertsUsed: stats().totalAlerts,
        validUntil: new Date(2025, 11, 31),
        features: ['Безлимит алертов', 'Все уведомления', 'Приоритетная поддержка', 'API доступ']
      },
      'trader': {
        plan: 'Pro Trader',
        price: '2999₽',
        alertsLimit: 100,
        alertsUsed: stats().totalAlerts,
        validUntil: new Date(2025, 2, 15),
        features: ['100 алертов', 'SMS + Email', 'Техническая поддержка', 'Аналитика']
      },
      'user': {
        plan: 'Standard',
        price: '999₽',
        alertsLimit: 25,
        alertsUsed: stats().totalAlerts,
        validUntil: new Date(2025, 1, 28),
        features: ['25 алертов', 'Email уведомления', 'Базовая поддержка']
      },
      'demo': {
        plan: 'Free Trial',
        price: '0₽',
        alertsLimit: 5,
        alertsUsed: stats().totalAlerts,
        validUntil: new Date(2025, 0, 31),
        features: ['5 алертов', 'Email уведомления', 'Пробный период']
      }
    };

    const userPlan = plans[user?.role] || plans['demo'];
    setSubscription(userPlan);
  };

  // Сохранение профиля
  const saveProfile = () => {
    const user = currentUser();
    const profile = {
      firstName: firstName(),
      lastName: lastName(),
      phone: phone(),
      bio: bio(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));
    setIsEditing(false);
  };

  // Отмена редактирования
  const cancelEdit = () => {
    loadUserProfile(); // Восстанавливаем данные
    setIsEditing(false);
  };

  return (
    <div class="max-w-6xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div class="mb-8">
        <h1 class="text-3xl font-bold gradient-text mb-2">Личный кабинет</h1>
        <p class="text-gray-400">Управляйте своим профилем и подпиской</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - Профиль */}
        <div class="lg:col-span-2 space-y-6">
          {/* Карточка профиля */}
          <div class="bg-dark-card border border-gray-700 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-white">Информация о профиле</h2>
              {!isEditing() ? (
                <button
                  onClick={() => setIsEditing(true)}
                  class="flex items-center space-x-2 px-4 py-2 bg-accent-teal/20 text-accent-teal border border-accent-teal/30 rounded-lg hover:bg-accent-teal/30 transition-all duration-200"
                >
                  <Edit3 class="w-4 h-4" />
                  <span>Редактировать</span>
                </button>
              ) : (
                <div class="flex space-x-2">
                  <button
                    onClick={saveProfile}
                    class="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-all duration-200"
                  >
                    <Save class="w-4 h-4" />
                    <span>Сохранить</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    class="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all duration-200"
                  >
                    <X class="w-4 h-4" />
                    <span>Отмена</span>
                  </button>
                </div>
              )}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Аватар и основная информация */}
              <div class="flex flex-col items-center space-y-4">
                <div class="w-24 h-24 bg-gradient-to-r from-accent-red to-accent-teal rounded-full flex items-center justify-center">
                  <User class="w-12 h-12 text-white" />
                </div>
                <div class="text-center">
                  <h3 class="text-lg font-semibold text-white">
                    {firstName()} {lastName()}
                  </h3>
                  <p class="text-gray-400">{currentUser()?.email}</p>
                  <div class="mt-2 px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full text-sm">
                    {currentUser()?.role === 'admin' ? 'Администратор' : 
                     currentUser()?.role === 'trader' ? 'Про трейдер' :
                     currentUser()?.role === 'user' ? 'Пользователь' : 'Демо'}
                  </div>
                </div>
              </div>

              {/* Форма данных */}
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Имя
                  </label>
                  {isEditing() ? (
                    <input
                      type="text"
                      value={firstName()}
                      onInput={(e) => setFirstName(e.target.value)}
                      class="w-full px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent text-white"
                    />
                  ) : (
                    <p class="px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white">
                      {firstName() || 'Не указано'}
                    </p>
                  )}
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Фамилия
                  </label>
                  {isEditing() ? (
                    <input
                      type="text"
                      value={lastName()}
                      onInput={(e) => setLastName(e.target.value)}
                      class="w-full px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent text-white"
                    />
                  ) : (
                    <p class="px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white">
                      {lastName() || 'Не указано'}
                    </p>
                  )}
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Телефон
                  </label>
                  {isEditing() ? (
                    <input
                      type="tel"
                      value={phone()}
                      onInput={(e) => setPhone(e.target.value)}
                      class="w-full px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent text-white"
                    />
                  ) : (
                    <p class="px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white">
                      {phone() || 'Не указан'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* О себе */}
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                О себе
              </label>
              {isEditing() ? (
                <textarea
                  value={bio()}
                  onInput={(e) => setBio(e.target.value)}
                  rows="3"
                  class="w-full px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent text-white resize-none"
                  placeholder="Расскажите немного о себе..."
                />
              ) : (
                <p class="px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white min-h-[80px]">
                  {bio() || 'Информация не указана'}
                </p>
              )}
            </div>
          </div>

          {/* Статистика */}
          <div class="bg-dark-card border border-gray-700 rounded-2xl p-6">
            <h2 class="text-xl font-semibold text-white mb-6">Статистика</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-dark-bg p-4 rounded-lg border border-gray-600">
                <div class="flex items-center space-x-2 mb-2">
                  <Bell class="w-5 h-5 text-blue-400" />
                  <span class="text-sm text-gray-400">Всего алертов</span>
                </div>
                <p class="text-2xl font-bold text-white">{stats().totalAlerts}</p>
              </div>

              <div class="bg-dark-bg p-4 rounded-lg border border-gray-600">
                <div class="flex items-center space-x-2 mb-2">
                  <Zap class="w-5 h-5 text-green-400" />
                  <span class="text-sm text-gray-400">Активных</span>
                </div>
                <p class="text-2xl font-bold text-white">{stats().activeAlerts}</p>
              </div>

              <div class="bg-dark-bg p-4 rounded-lg border border-gray-600">
                <div class="flex items-center space-x-2 mb-2">
                  <TrendingUp class="w-5 h-5 text-yellow-400" />
                  <span class="text-sm text-gray-400">Сработало</span>
                </div>
                <p class="text-2xl font-bold text-white">{stats().triggeredAlerts}</p>
              </div>

              <div class="bg-dark-bg p-4 rounded-lg border border-gray-600">
                <div class="flex items-center space-x-2 mb-2">
                  <Star class="w-5 h-5 text-purple-400" />
                  <span class="text-sm text-gray-400">Заработано</span>
                </div>
                <p class="text-2xl font-bold text-white">{stats().savedMoney.toLocaleString()}₽</p>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - Подписка */}
        <div class="space-y-6">
          {/* Текущий тариф */}
          <div class="bg-dark-card border border-gray-700 rounded-2xl p-6">
            <div class="flex items-center space-x-2 mb-4">
              <Crown class="w-6 h-6 text-yellow-400" />
              <h2 class="text-xl font-semibold text-white">Текущий тариф</h2>
            </div>

            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">{subscription().plan}</h3>
              <p class="text-3xl font-bold gradient-text">{subscription().price}</p>
              {subscription().validUntil && (
                <p class="text-sm text-gray-400 mt-2">
                  Действует до {subscription().validUntil.toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Прогресс использования */}
            <div class="mb-6">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-400">Использовано алертов</span>
                <span class="text-white">
                  {subscription().alertsUsed} / {subscription().alertsLimit}
                </span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-accent-teal to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((subscription().alertsUsed / subscription().alertsLimit) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Возможности тарифа */}
            <div class="space-y-3">
              <h4 class="font-medium text-white">Возможности:</h4>
              {subscription().features.map((feature, index) => (
                <div class="flex items-center space-x-2">
                  <Shield class="w-4 h-4 text-green-400" />
                  <span class="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Кнопка управления подпиской */}
            <button class="w-full mt-6 px-4 py-3 bg-gradient-to-r from-accent-teal to-blue-600 text-white font-medium rounded-lg hover:from-accent-teal/80 hover:to-blue-600/80 transition-all duration-200">
              <div class="flex items-center justify-center space-x-2">
                <CreditCard class="w-5 h-5" />
                <span>Управление подпиской</span>
              </div>
            </button>
          </div>

          {/* Быстрые действия */}
          <div class="bg-dark-card border border-gray-700 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Быстрые действия</h3>
            
            <div class="space-y-3">
              <button class="w-full flex items-center space-x-3 px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg hover:border-accent-teal transition-all duration-200 text-left">
                <Settings class="w-5 h-5 text-gray-400" />
                <span class="text-white">Настройки уведомлений</span>
              </button>

              <button class="w-full flex items-center space-x-3 px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg hover:border-accent-teal transition-all duration-200 text-left">
                <Calendar class="w-5 h-5 text-gray-400" />
                <span class="text-white">История операций</span>
              </button>

              <button class="w-full flex items-center space-x-3 px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg hover:border-accent-teal transition-all duration-200 text-left">
                <Shield class="w-5 h-5 text-gray-400" />
                <span class="text-white">Безопасность</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}