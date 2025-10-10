/**
 * Простая авторизация для демонстрации
 * Использует localStorage для хранения состояния
 */

import { createSignal, createEffect } from 'solid-js';
import { LogIn, LogOut, User } from 'lucide-solid';

// Глобальное состояние авторизации
const [isAuthenticated, setIsAuthenticated] = createSignal(false);
const [currentUser, setCurrentUser] = createSignal(null);

export { isAuthenticated, currentUser };

// Экспортируем функцию для получения текущего пользователя
export const getCurrentUser = () => currentUser();

/**
 * Компонент авторизации
 */
export function AuthComponent() {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showMessage, setShowMessage] = createSignal('');

  // Проверяем сохраненного пользователя при загрузке
  createEffect(() => {
    const savedUser = localStorage.getItem('demo_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  });

  // Предустановленные тестовые аккаунты
  const testAccounts = [
    { email: 'admin@test.com', password: '123456', name: 'Администратор', role: 'admin', subscription: 'premium' },
    { email: 'user@test.com', password: 'password', name: 'Пользователь', role: 'user', subscription: 'free' },
    { email: 'demo@test.com', password: 'demo123', name: 'Демо пользователь', role: 'demo', subscription: 'free' },
    { email: 'trader@test.com', password: 'trader', name: 'Трейдер', role: 'trader', subscription: 'premium' },
    { email: 'premium@test.com', password: 'premium', name: 'Premium User', role: 'user', subscription: 'premium' }
  ];

  const handleLogin = () => {
    if (!email() || !password()) {
      setShowMessage('❌ Введите email и пароль');
      setTimeout(() => setShowMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setShowMessage('🔐 Проверяем данные...');
    
    // Имитируем задержку сервера
    setTimeout(() => {
      // Проверяем предустановленные аккаунты
      const account = testAccounts.find(acc => 
        acc.email.toLowerCase() === email().toLowerCase() && acc.password === password()
      );

      if (account) {
        const user = {
          id: Date.now(),
          email: account.email,
          name: account.name,
          role: account.role,
          subscription: account.subscription || 'free'
        };
        
        localStorage.setItem('demo_user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowMessage('✅ Успешный вход!');
        setIsSubmitting(false);
        setEmail('');
        setPassword('');
      } else {
        // Если аккаунт не найден, создаем новый (как раньше)
        if (password().length < 6) {
          setShowMessage('❌ Пароль должен быть не менее 6 символов');
          setIsSubmitting(false);
          setTimeout(() => setShowMessage(''), 3000);
          return;
        }

        const user = {
          id: Date.now(),
          email: email(),
          name: email().split('@')[0],
          role: 'guest',
          subscription: 'free'
        };
        
        localStorage.setItem('demo_user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowMessage('✅ Новый аккаунт создан!');
        setIsSubmitting(false);
        setEmail('');
        setPassword('');
      }
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_alerts');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowMessage('Вы вышли из системы');
  };

  // Функция для обновления подписки
  const upgradeSubscription = () => {
    const user = getCurrentUser();
    if (user) {
      const updatedUser = { ...user, subscription: 'premium' };
      localStorage.setItem('demo_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setShowMessage('✅ Подписка обновлена до Premium!');
      setTimeout(() => setShowMessage(''), 3000);
    }
  };

  // Экспортируем функцию для использования в других компонентах
  window.upgradeSubscription = upgradeSubscription;

  // Если пользователь авторизован, показываем информацию о нём
  if (isAuthenticated()) {
    return (
      <div class="flex items-center space-x-4">
        <div class="bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 px-3 py-1 rounded-full text-sm font-medium">
          Demo Mode
        </div>
        <div class="flex items-center space-x-2 text-gray-300">
          <User class="w-4 h-4" />
          <span class="text-sm font-medium">{currentUser().name}</span>
          <span class="text-xs text-gray-500">({currentUser().role})</span>
        </div>
        <div class="text-xs text-gray-400">
          {currentUser().email}
        </div>
        <button
          onClick={handleLogout}
          class="flex items-center space-x-2 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all duration-200 text-sm"
        >
          <LogOut class="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </div>
    );
  }

  // Если не авторизован, показываем форму входа
  return (
    <div class="min-h-[80vh] flex items-center justify-center">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold mb-4 gradient-text">
            Добро пожаловать
          </h2>
          <p class="text-gray-400 mb-8">
            Войдите для управления алертами
          </p>
        </div>
        
        <div class="bg-dark-card border border-gray-700 rounded-2xl p-8">
          <div class="space-y-6">
          <div class="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6">
            <h3 class="text-blue-400 font-medium mb-3">🔑 Тестовые аккаунты:</h3>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-3 gap-2 text-gray-300">
                <div><strong>admin@test.com</strong></div>
                <div>123456</div>
                <div class="text-purple-400">💎 Premium</div>
              </div>
              <div class="grid grid-cols-3 gap-2 text-gray-300">
                <div><strong>user@test.com</strong></div>
                <div>password</div>
                <div class="text-gray-400">🆓 Free</div>
              </div>
              <div class="grid grid-cols-3 gap-2 text-gray-300">
                <div><strong>premium@test.com</strong></div>
                <div>premium</div>
                <div class="text-purple-400">💎 Premium</div>
              </div>
              <div class="grid grid-cols-3 gap-2 text-gray-300">
                <div><strong>trader@test.com</strong></div>
                <div>trader</div>
                <div class="text-purple-400">💎 Premium</div>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-3">
              💡 Или используйте любой другой email и пароль (мин. 6 символов) - будет создан Free аккаунт
            </p>
          </div>            {/* Email Input */}
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.target.value)}
                class="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent text-white placeholder-gray-400"
                placeholder="Выберите из списка выше или введите свой"
                required
              />
            </div>
            
            {/* Password Input */}
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password()}
                onInput={(e) => setPassword(e.target.value)}
                class="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent text-white placeholder-gray-400"
                placeholder="Используйте пароль из списка выше"
                required
              />
            </div>
            
            {/* Message */}
            {showMessage() && (
              <div class="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                <div class="text-sm font-medium text-white">
                  {showMessage()}
                </div>
              </div>
            )}
            
            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isSubmitting()}
              class="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-accent-teal to-blue-600 text-white font-medium rounded-lg hover:from-accent-teal/80 hover:to-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <LogIn class="w-5 h-5" />
              <span>{isSubmitting() ? 'Вход...' : 'Войти'}</span>
            </button>
            
            <div class="text-center text-xs text-gray-500 space-y-1">
              <div>🚀 <strong>Демо версия Token Alert Manager</strong></div>
              <div>Управление криптовалютными алертами</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}