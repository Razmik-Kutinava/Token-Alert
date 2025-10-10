import { Home, BarChart3, User } from 'lucide-solid';
import { AuthComponent, isAuthenticated, getCurrentUser } from '../SimpleAuth';
import { Show } from 'solid-js';

export function Header({ currentPage, setCurrentPage, isOnline }) {
  return (
    <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-6">
            <h1 class="text-xl font-bold">
              <span class="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                CryptoMultiTool
              </span>
              <span class="text-xs text-gray-400 ml-2">для новичков</span>
            </h1>
            
            {/* Navigation Menu - только 2 основные вкладки */}
            <Show when={isAuthenticated()}>
              <nav class="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  class={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                    currentPage() === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Home class="w-4 h-4" />
                  <span>Дашборд</span>
                </button>
                
                <button
                  onClick={() => setCurrentPage('analytics')}
                  class={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                    currentPage() === 'analytics'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <BarChart3 class="w-4 h-4" />
                  <span>Аналитика</span>
                </button>
              </nav>
            </Show>
          </div>
          
          <div class="flex items-center gap-4">
            {/* Статус подключения */}
            <div class={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
              isOnline() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div class={`w-2 h-2 rounded-full ${
                isOnline() ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              {isOnline() ? 'Online' : 'Offline'}
            </div>

            {/* Информация о пользователе в углу */}
            <Show when={isAuthenticated()}>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <div class="text-sm font-medium text-white">
                    {getCurrentUser()?.email?.split('@')[0]}
                  </div>
                  <div class={`text-xs ${
                    getCurrentUser()?.subscription === 'premium' 
                      ? 'text-purple-400 font-medium' 
                      : 'text-gray-400'
                  }`}>
                    {getCurrentUser()?.subscription === 'premium' ? '💎 Premium' : 'Free'}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPage('profile')}
                  class={`p-2 rounded-lg transition-colors ${
                    currentPage() === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title="Профиль"
                >
                  <User class="w-4 h-4" />
                </button>
              </div>
            </Show>

            <Show when={!isAuthenticated()}>
              <AuthComponent />
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}