import { createSignal, For, Show } from 'solid-js';
import { BookOpen, Download, Clock, Star, ChevronRight, FileText, Play } from 'lucide-solid';

/**
 * Образовательный портал с файлами обучения
 */
export function EducationPortal({ userSubscription }) {
  const [selectedCategory, setSelectedCategory] = createSignal('beginner');

  // Образовательные материалы
  const educationMaterials = [
    {
      id: 'crypto-basics',
      title: 'Основы криптовалют',
      description: 'Что такое криптовалюты, как они работают и зачем они нужны',
      category: 'beginner',
      duration: '15 мин',
      rating: 4.8,
      downloads: 1250,
      isPremium: false,
      fileSize: '2.1 MB',
      type: 'pdf'
    },
    {
      id: 'blockchain-explained',
      title: 'Блокчейн для начинающих',
      description: 'Понятное объяснение технологии блокчейн без сложных терминов',
      category: 'beginner',
      duration: '20 мин',
      rating: 4.9,
      downloads: 980,
      isPremium: false,
      fileSize: '3.4 MB',
      type: 'pdf'
    },
    {
      id: 'wallets-guide',
      title: 'Кошельки и безопасность',
      description: 'Как выбрать и настроить криптокошелек, основы безопасности',
      category: 'beginner',
      duration: '25 мин',
      rating: 4.7,
      downloads: 1100,
      isPremium: false,
      fileSize: '4.2 MB',
      type: 'pdf'
    },
    {
      id: 'trading-basics',
      title: 'Основы торговли',
      description: 'Базовые принципы торговли криптовалютами, типы ордеров',
      category: 'intermediate',
      duration: '35 мин',
      rating: 4.6,
      downloads: 850,
      isPremium: true,
      fileSize: '5.8 MB',
      type: 'pdf'
    },
    {
      id: 'technical-analysis',
      title: 'Технический анализ',
      description: 'Чтение графиков, индикаторы, паттерны и сигналы',
      category: 'intermediate',
      duration: '45 мин',
      rating: 4.8,
      downloads: 720,
      isPremium: true,
      fileSize: '7.2 MB',
      type: 'pdf'
    },
    {
      id: 'defi-guide',
      title: 'DeFi и децентрализованные финансы',
      description: 'Протоколы DeFi, yield farming, стейкинг и ликвидность',
      category: 'advanced',
      duration: '40 мин',
      rating: 4.9,
      downloads: 650,
      isPremium: true,
      fileSize: '6.5 MB',
      type: 'pdf'
    },
    {
      id: 'nft-complete',
      title: 'NFT: полное руководство',
      description: 'Создание, покупка и продажа NFT, метаданные и маркетплейсы',
      category: 'advanced',
      duration: '30 мин',
      rating: 4.5,
      downloads: 580,
      isPremium: true,
      fileSize: '4.9 MB',
      type: 'pdf'
    },
    {
      id: 'portfolio-management',
      title: 'Управление портфелем',
      description: 'Диверсификация, ребалансировка, управление рисками',
      category: 'advanced',
      duration: '50 мин',
      rating: 4.7,
      downloads: 690,
      isPremium: true,
      fileSize: '8.1 MB',
      type: 'pdf'
    }
  ];

  const categories = [
    { id: 'beginner', name: 'Для новичков', icon: '🌱' },
    { id: 'intermediate', name: 'Средний уровень', icon: '📈' },
    { id: 'advanced', name: 'Продвинутый', icon: '🚀' }
  ];

  const filteredMaterials = () => 
    educationMaterials.filter(material => material.category === selectedCategory());

  const canAccess = (material) => {
    if (!material.isPremium) return true;
    return userSubscription === 'premium';
  };

  const handleDownload = (material) => {
    if (!canAccess(material)) {
      // Показываем предложение апгрейда
      if (window.upgradeSubscription) {
        const upgrade = confirm('Этот материал доступен только в Premium подписке. Хотите обновиться сейчас?');
        if (upgrade) {
          window.upgradeSubscription();
        }
      } else {
        alert('Этот материал доступен только в Premium подписке');
      }
      return;
    }
    
    // Имитация скачивания
    alert(`Скачивание: ${material.title}`);
  };

  return (
    <div class="mb-8">
      {/* Заголовок */}
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <BookOpen class="w-7 h-7 text-blue-400" />
          📚 Образовательный портал
        </h3>
        <p class="text-gray-400">
          Изучайте криптовалюты с нашими подробными руководствами
        </p>
      </div>

      {/* Категории */}
      <div class="flex flex-wrap gap-2 mb-6">
        <For each={categories}>
          {(category) => (
            <button
              onClick={() => setSelectedCategory(category.id)}
              class={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory() === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          )}
        </For>
      </div>

      {/* Материалы */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <For each={filteredMaterials()}>
          {(material) => {
            const hasAccess = () => canAccess(material);
            
            return (
              <div class={`bg-gray-800 rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                hasAccess() 
                  ? 'border-gray-700 hover:border-gray-600' 
                  : 'border-orange-500/30 bg-gray-800/50'
              }`}>
                {/* Заголовок и статус */}
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h4 class="font-bold text-white text-lg mb-1">{material.title}</h4>
                    <p class="text-gray-400 text-sm">{material.description}</p>
                  </div>
                  
                  <div class="flex flex-col items-end gap-1">
                    {material.isPremium && (
                      <span class={`px-2 py-1 rounded text-xs font-medium ${
                        hasAccess() 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {hasAccess() ? '✓ Premium' : '🔒 Premium'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Метаданные */}
                <div class="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <div class="flex items-center gap-1">
                    <Clock class="w-4 h-4" />
                    <span>{material.duration}</span>
                  </div>
                  
                  <div class="flex items-center gap-1">
                    <Star class="w-4 h-4 text-yellow-400" />
                    <span>{material.rating}</span>
                  </div>
                  
                  <div class="flex items-center gap-1">
                    <Download class="w-4 h-4" />
                    <span>{material.downloads}</span>
                  </div>
                </div>

                {/* Размер файла и тип */}
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2 text-gray-400 text-sm">
                    <FileText class="w-4 h-4" />
                    <span>PDF • {material.fileSize}</span>
                  </div>
                </div>

                {/* Действия */}
                <div class="flex gap-2">
                  <button
                    onClick={() => handleDownload(material)}
                    disabled={!hasAccess()}
                    class={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      hasAccess()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Download class="w-4 h-4" />
                    <span>{hasAccess() ? 'Скачать' : 'Требуется Premium'}</span>
                  </button>
                  
                  {hasAccess() && (
                    <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                      <Play class="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Уведомление для Premium контента */}
                {!hasAccess() && (
                  <div class="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p class="text-orange-400 text-sm">
                      💎 Этот материал доступен только в Premium подписке
                    </p>
                  </div>
                )}
              </div>
            );
          }}
        </For>
      </div>

      {/* Статистика внизу */}
      <div class="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div class="flex items-center justify-between text-sm">
          <div class="text-gray-400">
            Всего материалов: <span class="text-white font-medium">{educationMaterials.length}</span>
          </div>
          <div class="text-gray-400">
            Доступно в {userSubscription === 'premium' ? 'Premium' : 'Free'}: 
            <span class="text-white font-medium ml-1">
              {educationMaterials.filter(m => canAccess(m)).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}