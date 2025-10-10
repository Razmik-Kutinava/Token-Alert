import { For, Show } from 'solid-js';
import { TrendingUp, Clock, ExternalLink, Zap, Shield, Users, BarChart3 } from 'lucide-solid';

/**
 * Секция новостей и преимуществ
 */
export function NewsAndBenefits({ userSubscription }) {
  
  // Новости криптовалют
  const cryptoNews = [
    {
      id: 1,
      title: 'Bitcoin достиг нового исторического максимума',
      summary: 'Первая криптовалюта преодолела отметку в $67,000 на фоне институционального интереса',
      time: '2 часа назад',
      source: 'CryptoDaily',
      category: 'market',
      trend: 'up'
    },
    {
      id: 2,
      title: 'Ethereum готовится к обновлению сети',
      summary: 'Запланированный хардфорк должен снизить комиссии на 40%',
      time: '4 часа назад',
      source: 'ETH News',
      category: 'tech',
      trend: 'neutral'
    },
    {
      id: 3,
      title: 'Регулирование криптовалют в ЕС',
      summary: 'Европарламент принял новые правила для цифровых активов',
      time: '6 часов назад',
      source: 'Reuters',
      category: 'regulation',
      trend: 'neutral'
    },
    {
      id: 4,
      title: 'DeFi протокол запускает новый продукт',
      summary: 'Платформа предлагает доходность до 15% годовых по стейблкоинам',
      time: '8 часов назад',
      source: 'DeFi Pulse',
      category: 'defi',
      trend: 'up'
    }
  ];

  // Преимущества платформы
  const platformBenefits = [
    {
      icon: <Zap class="w-6 h-6" />,
      title: 'Молниеносные уведомления',
      description: 'Получайте алерты в течение 3 секунд после достижения цены',
      isPremium: false
    },
    {
      icon: <Shield class="w-6 h-6" />,
      title: 'Банковская безопасность',
      description: 'Ваши данные защищены 256-битным шифрованием',
      isPremium: false
    },
    {
      icon: <BarChart3 class="w-6 h-6" />,
      title: 'Продвинутая аналитика',
      description: 'Детальные графики, индикаторы и торговые сигналы',
      isPremium: true
    },
    {
      icon: <Users class="w-6 h-6" />,
      title: 'Сообщество трейдеров',
      description: 'Эксклюзивный доступ к закрытому чату и сигналам экспертов',
      isPremium: true
    }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      market: 'bg-green-500/20 text-green-400',
      tech: 'bg-blue-500/20 text-blue-400',
      regulation: 'bg-yellow-500/20 text-yellow-400',
      defi: 'bg-purple-500/20 text-purple-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '📰';
  };

  return (
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Секция новостей */}
      <div>
        <div class="flex items-center gap-3 mb-6">
          <h3 class="text-2xl font-bold text-white">📰 Криптоновости</h3>
          <span class="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
            LIVE
          </span>
        </div>

        <div class="space-y-4">
          <For each={cryptoNews}>
            {(news) => (
              <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-lg">{getTrendIcon(news.trend)}</span>
                      <span class={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(news.category)}`}>
                        {news.category.toUpperCase()}
                      </span>
                    </div>
                    
                    <h4 class="font-bold text-white text-lg mb-2 line-clamp-2">
                      {news.title}
                    </h4>
                    
                    <p class="text-gray-400 text-sm mb-3 line-clamp-2">
                      {news.summary}
                    </p>
                    
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-gray-500 text-xs">
                        <Clock class="w-3 h-3" />
                        <span>{news.time}</span>
                        <span>•</span>
                        <span>{news.source}</span>
                      </div>
                      
                      <button class="text-blue-400 hover:text-blue-300 p-1">
                        <ExternalLink class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Показать больше новостей */}
        <div class="mt-4">
          <button class="w-full bg-gray-800 text-gray-300 py-3 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors font-medium">
            Загрузить еще новости
          </button>
        </div>
      </div>

      {/* Секция преимуществ */}
      <div>
        <h3 class="text-2xl font-bold text-white mb-6">✨ Преимущества платформы</h3>

        <div class="space-y-4">
          <For each={platformBenefits}>
            {(benefit) => {
              const hasAccess = () => !benefit.isPremium || userSubscription === 'premium';
              
              return (
                <div class={`p-6 rounded-xl border transition-all duration-300 ${
                  hasAccess() 
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                    : 'bg-gray-800/50 border-orange-500/30'
                }`}>
                  <div class="flex items-start gap-4">
                    <div class={`p-3 rounded-lg ${
                      hasAccess() 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-700 text-gray-500'
                    }`}>
                      {benefit.icon}
                    </div>
                    
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <h4 class={`font-bold text-lg ${
                          hasAccess() ? 'text-white' : 'text-gray-400'
                        }`}>
                          {benefit.title}
                        </h4>
                        
                        {benefit.isPremium && (
                          <span class={`px-2 py-1 rounded text-xs font-medium ${
                            hasAccess() 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {hasAccess() ? '✓ Premium' : '🔒 Premium'}
                          </span>
                        )}
                      </div>
                      
                      <p class={`text-sm ${
                        hasAccess() ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {benefit.description}
                      </p>
                      
                      {!hasAccess() && (
                        <div class="mt-3">
                          <button 
                            onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
                            class="text-orange-400 text-sm hover:text-orange-300 font-medium"
                          >
                            Обновить до Premium →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>

        {/* CTA блок */}
        <div class="mt-6 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
          <h4 class="text-xl font-bold text-white mb-2">🚀 Готовы к профессиональной торговле?</h4>
          <p class="text-gray-300 mb-4">
            Получите доступ ко всем премиум функциям и начните зарабатывать больше
          </p>
          
          <div class="flex gap-3">
            <button 
              onClick={() => window.upgradeSubscription && window.upgradeSubscription()}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {userSubscription === 'premium' ? 'Управлять подпиской' : 'Обновить до Premium'}
            </button>
            <button class="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              Узнать больше
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}