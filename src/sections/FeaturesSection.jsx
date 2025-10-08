export function FeaturesSection() {
  return (
    <div class="grid md:grid-cols-3 gap-8 mb-12">
      <div class="bg-dark-card rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
        <div class="text-3xl mb-4">⚡</div>
        <h3 class="text-xl font-semibold mb-2">Мгновенные уведомления</h3>
        <p class="text-gray-400">
          Получайте push-уведомления сразу при достижении заданной цены
        </p>
      </div>
      
      <div class="bg-dark-card rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
        <div class="text-3xl mb-4">📊</div>
        <h3 class="text-xl font-semibold mb-2">Точные данные</h3>
        <p class="text-gray-400">
          Актуальные цены с ведущих криптобирж обновляются в реальном времени
        </p>
      </div>
      
      <div class="bg-dark-card rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
        <div class="text-3xl mb-4">🎯</div>
        <h3 class="text-xl font-semibold mb-2">Умные алерты</h3>
        <p class="text-gray-400">
          Настройте множественные условия и получайте только важные сигналы
        </p>
      </div>
    </div>
  );
}