import { Home, User, Wifi, WifiOff } from 'lucide-solid';
import { AuthComponent } from '../SimpleAuth';

export function Header({ currentPage, setCurrentPage, isOnline }) {
  return (
    <header class="bg-dark-card border-b border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-dark-card/90">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold">
              <span class="gradient-text">Token Alert Manager</span>
            </h1>
            
            {/* Navigation Menu */}
            <nav class="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentPage('dashboard')}
                class={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  currentPage() === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Home class="w-4 h-4" />
                <span>Главная</span>
              </button>
              <button
                onClick={() => setCurrentPage('analytics')}
                class={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  currentPage() === 'analytics'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span class="text-lg">📊</span>
                <span>Аналитика</span>
              </button>
              <button
                onClick={() => setCurrentPage('profile')}
                class={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  currentPage() === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <User class="w-4 h-4" />
                <span>Профиль</span>
              </button>
            </nav>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm">
              {isOnline() ? (
                <>
                  <Wifi class="w-4 h-4 text-green-400" />
                  <span class="hidden sm:inline text-green-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff class="w-4 h-4" />
                  <span class="hidden sm:inline">Offline</span>
                </>
              )}
            </div>
            
            <AuthComponent />
          </div>
        </div>
      </div>
    </header>
  );
}