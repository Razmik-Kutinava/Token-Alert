import { For } from 'solid-js';
import { Github, Twitter, Mail, Shield, FileText, HelpCircle, MessageCircle } from 'lucide-solid';

/**
 * Футер сайта
 */
export function SiteFooter() {
  
  const footerLinks = {
    product: [
      { name: 'Возможности', href: '#features' },
      { name: 'Цены', href: '#pricing' },
      { name: 'API', href: '#api' },
      { name: 'Документация', href: '#docs' }
    ],
    learn: [
      { name: 'Обучающие материалы', href: '#education' },
      { name: 'Блог', href: '#blog' },
      { name: 'Руководства', href: '#guides' },
      { name: 'Вебинары', href: '#webinars' }
    ],
    support: [
      { name: 'Центр поддержки', href: '#support' },
      { name: 'Сообщество', href: '#community' },
      { name: 'Статус системы', href: '#status' },
      { name: 'Связаться с нами', href: '#contact' }
    ],
    legal: [
      { name: 'Политика конфиденциальности', href: '#privacy' },
      { name: 'Условия использования', href: '#terms' },
      { name: 'Файлы cookie', href: '#cookies' },
      { name: 'Лицензии', href: '#licenses' }
    ]
  };

  const socialLinks = [
    { 
      name: 'GitHub', 
      icon: <Github class="w-5 h-5" />, 
      href: 'https://github.com',
      color: 'hover:text-gray-300'
    },
    { 
      name: 'Twitter', 
      icon: <Twitter class="w-5 h-5" />, 
      href: 'https://twitter.com',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'Telegram', 
      icon: <MessageCircle class="w-5 h-5" />, 
      href: 'https://t.me',
      color: 'hover:text-blue-500'
    },
    { 
      name: 'Email', 
      icon: <Mail class="w-5 h-5" />, 
      href: 'mailto:support@cryptomultitool.com',
      color: 'hover:text-green-400'
    }
  ];

  const quickStats = [
    { label: 'Активных пользователей', value: '50,000+' },
    { label: 'Поддерживаемых монет', value: '500+' },
    { label: 'Отправлено уведомлений', value: '1M+' },
    { label: 'Время работы', value: '99.9%' }
  ];

  return (
    <footer class="bg-gray-900 border-t border-gray-800 mt-16">
      {/* Основной контент футера */}
      <div class="max-w-7xl mx-auto px-6 py-12">
        
        {/* Верхняя часть с логотипом и статистикой */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Логотип и описание */}
          <div class="lg:col-span-1">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">₿</span>
              </div>
              <h3 class="text-xl font-bold text-white">CryptoMultiTool</h3>
            </div>
            
            <p class="text-gray-400 mb-6 leading-relaxed">
              Универсальная платформа для работы с криптовалютами. Отслеживайте цены, 
              создавайте алерты, изучайте рынок и принимайте обоснованные инвестиционные решения.
            </p>
            
            {/* Социальные сети */}
            <div class="flex items-center gap-4">
              <span class="text-gray-500 text-sm">Следите за нами:</span>
              <div class="flex gap-3">
                <For each={socialLinks}>
                  {(social) => (
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      class={`text-gray-400 transition-colors ${social.color}`}
                      title={social.name}
                    >
                      {social.icon}
                    </a>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Быстрая статистика */}
          <div class="lg:col-span-2">
            <h4 class="text-lg font-bold text-white mb-6">📊 Наши достижения</h4>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <For each={quickStats}>
                {(stat) => (
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-400 mb-1">{stat.value}</div>
                    <div class="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Ссылки по категориям */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          {/* Продукт */}
          <div>
            <h4 class="font-bold text-white mb-4">Продукт</h4>
            <ul class="space-y-2">
              <For each={footerLinks.product}>
                {(link) => (
                  <li>
                    <a href={link.href} class="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Обучение */}
          <div>
            <h4 class="font-bold text-white mb-4">Обучение</h4>
            <ul class="space-y-2">
              <For each={footerLinks.learn}>
                {(link) => (
                  <li>
                    <a href={link.href} class="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Поддержка */}
          <div>
            <h4 class="font-bold text-white mb-4">Поддержка</h4>
            <ul class="space-y-2">
              <For each={footerLinks.support}>
                {(link) => (
                  <li>
                    <a href={link.href} class="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Правовая информация */}
          <div>
            <h4 class="font-bold text-white mb-4">Правовая информация</h4>
            <ul class="space-y-2">
              <For each={footerLinks.legal}>
                {(link) => (
                  <li>
                    <a href={link.href} class="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </div>

        {/* Важные уведомления */}
        <div class="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div class="flex items-start gap-3">
            <Shield class="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 class="font-medium text-white mb-1">⚠️ Важное предупреждение</h5>
              <p class="text-gray-400 text-sm leading-relaxed">
                Криптовалютные инвестиции связаны с высокими рисками. Цены могут значительно колебаться. 
                Инвестируйте только те средства, потерю которых вы можете себе позволить. 
                Проведите собственное исследование перед принятием инвестиционных решений.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя часть */}
      <div class="border-t border-gray-800 bg-gray-950">
        <div class="max-w-7xl mx-auto px-6 py-6">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Копирайт */}
            <div class="text-gray-400 text-sm">
              © 2024 CryptoMultiTool. Все права защищены.
            </div>

            {/* Быстрые ссылки */}
            <div class="flex items-center gap-6 text-sm">
              <a href="#status" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Все системы работают</span>
              </a>
              
              <a href="#privacy" class="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                <FileText class="w-4 h-4" />
                <span>Конфиденциальность</span>
              </a>
              
              <a href="#help" class="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                <HelpCircle class="w-4 h-4" />
                <span>Помощь</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}