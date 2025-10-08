export function StatsSection() {
  return (
    <div class="bg-dark-card rounded-xl p-6 border border-gray-700 text-center mb-8">
      <h3 class="text-2xl font-bold mb-4">📈 Статистика платформы</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-3xl font-bold text-blue-400">10K+</div>
          <div class="text-gray-400">Активных пользователей</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-green-400">50K+</div>
          <div class="text-gray-400">Созданных алертов</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-purple-400">99.9%</div>
          <div class="text-gray-400">Время работы</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-yellow-400">100+</div>
          <div class="text-gray-400">Поддерживаемых монет</div>
        </div>
      </div>
    </div>
  );
}