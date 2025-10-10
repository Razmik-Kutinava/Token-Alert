import { Show } from 'solid-js';
import { getCurrentUser } from '../SimpleAuth';

/**
 * Баннер сравнения тарифов Free vs Premium
 */
export function PricingBanner() {
  const user = getCurrentUser();
  const isPremium = () => user?.subscription === 'premium';

  return (
    <div class="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6 mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Free Plan */}
        <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-white">Free Plan</h3>
            <span class="bg-gray-600 text-white px-2 py-1 rounded text-xs">
              Текущий
            </span>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> До 5 простых алертов
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> 1 продвинутый алерт
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> Базовые графики
            </div>
            <div class="flex items-center gap-2 text-gray-400">
              <span class="text-red-400">✗</span> Сравнение до 3 токенов
            </div>
            <div class="flex items-center gap-2 text-gray-400">
              <span class="text-red-400">✗</span> Экспорт данных
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-bold text-white">$0</div>
            <div class="text-gray-400 text-sm">навсегда</div>
          </div>
        </div>

        {/* Upgrade Arrow */}
        <div class="text-center">
          <div class="text-4xl mb-2">🚀</div>
          <h2 class="text-xl font-bold text-white mb-2">
            Увеличьте возможности!
          </h2>
          <p class="text-gray-400 text-sm mb-4">
            Разблокируйте всю мощь криптоанализа
          </p>
          <Show when={!isPremium()}>
            <button 
              onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
              class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Апгрейд до Premium
            </button>
          </Show>
          <Show when={isPremium()}>
            <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg">
              💎 У вас Premium!
            </div>
          </Show>
        </div>

        {/* Premium Plan */}
        <div class="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/50 relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-medium">
            ПОПУЛЯРНЫЙ
          </div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-white">Premium</h3>
            <Show when={isPremium()}>
              <span class="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                Активен
              </span>
            </Show>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> До 20 простых алертов
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> Безлимит продвинутых
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> Сравнение до 10 токенов
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> ATH/ATL трекер
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> Калькулятор прибыли
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> Экспорт CSV/JSON/Excel
            </div>
            <div class="flex items-center gap-2 text-gray-300">
              <span class="text-green-400">✓</span> Приоритетная поддержка
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <div class="text-2xl font-bold text-white">$9.99</div>
              <div class="text-gray-400 text-sm">/ месяц</div>
            </div>
            <div class="text-purple-400 text-sm font-medium">
              Первые 7 дней бесплатно
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div class="flex items-center justify-center gap-2 text-gray-300">
          <span class="text-blue-400">🔒</span>
          <span class="text-sm">Безопасность данных</span>
        </div>
        <div class="flex items-center justify-center gap-2 text-gray-300">
          <span class="text-green-400">📱</span>
          <span class="text-sm">Уведомления 24/7</span>
        </div>
        <div class="flex items-center justify-center gap-2 text-gray-300">
          <span class="text-purple-400">⚡</span>
          <span class="text-sm">Мгновенные алерты</span>
        </div>
      </div>
    </div>
  );
}