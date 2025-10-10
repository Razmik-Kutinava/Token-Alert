import { createSignal, For, Show } from 'solid-js';
import { BarChart3, TrendingUp, Activity, DollarSign, Target, Download } from 'lucide-solid';

export function AnalyticsPage({ user, tokens, livePrices }) {
  const isPremium = () => user?.subscription === 'premium';
  
  const [selectedTimeRange, setSelectedTimeRange] = createSignal('7d');
  
  const PremiumGate = ({ children, feature }) => (
    <Show 
      when={isPremium()} 
      fallback={
        <div class="bg-gray-800/50 rounded-xl p-8 border border-orange-500/30 text-center">
          <div class="text-6xl mb-4">🔒</div>
          <h3 class="text-xl font-bold text-white mb-2">{feature}</h3>
          <p class="text-gray-400 mb-4">Доступно только в Premium подписке</p>
          <button 
            onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
            class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Обновить до Premium
          </button>
        </div>
      }
    >
      {children}
    </Show>
  );

  return (
    <div class="min-h-screen">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <BarChart3 class="w-8 h-8 text-blue-400" />
          📊 Продвинутая аналитика
        </h1>
        <p class="text-gray-400">
          Профессиональные инструменты для анализа рынка криптовалют
        </p>
      </div>

      <PremiumGate feature="Интерактивные графики">
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 class="text-xl font-bold text-white mb-6">📈 Сравнительный анализ цен</h3>
          
          <div class="h-96 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
            <div class="text-center">
              <div class="text-4xl mb-4">📊</div>
              <p class="text-gray-400">Интерактивный график будет здесь</p>
              <p class="text-gray-500 text-sm mt-2">
                Графики цен в реальном времени
              </p>
            </div>
          </div>
        </div>
      </PremiumGate>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <PremiumGate feature="Рейтинг активов">
          <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 class="text-xl font-bold text-white mb-6">🏆 Топ исполнители</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <div>
                    <div class="font-bold text-white">SOL</div>
                    <div class="text-gray-400 text-sm">Solana</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-green-400 font-bold">+45.8%</div>
                  <div class="text-gray-400 text-sm">$2.1B</div>
                </div>
              </div>
            </div>
          </div>
        </PremiumGate>

        <PremiumGate feature="Экспорт данных">
          <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Download class="w-6 h-6" />
              📋 Экспорт данных
            </h3>
            
            <div class="bg-gray-900 rounded-lg p-4">
              <h4 class="font-medium text-white mb-2">Исторические данные</h4>
              <p class="text-gray-400 text-sm mb-4">
                Экспортируйте данные о ценах за любой период
              </p>
              <div class="flex gap-2">
                <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  CSV
                </button>
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  JSON
                </button>
                <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                  Excel
                </button>
              </div>
            </div>
          </div>
        </PremiumGate>
      </div>

      <Show when={!isPremium()}>
        <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-8 border border-purple-500/30 text-center mb-8">
          <div class="text-6xl mb-4">🚀</div>
          <h3 class="text-2xl font-bold text-white mb-4">
            Раскройте потенциал профессиональной аналитики
          </h3>
          <p class="text-gray-300 mb-6 max-w-2xl mx-auto">
            Получите доступ к полному набору аналитических инструментов, интерактивным графикам и возможности экспорта данных.
          </p>
          
          <button 
            onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
            class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Обновить до Premium ($9.99/мес)
          </button>
        </div>
      </Show>
    </div>
  );
}