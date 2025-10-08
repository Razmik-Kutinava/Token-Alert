export function NetworkStatus({ isOnline }) {
  return (
    <div class="text-center">
      {isOnline() ? (
        <div class="inline-flex items-center gap-2 text-green-400 bg-green-500/20 px-4 py-2 rounded-lg border border-green-500">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Соединение установлено</span>
        </div>
      ) : (
        <div class="inline-flex items-center gap-2 text-red-400 bg-red-500/20 px-4 py-2 rounded-lg border border-red-500">
          <div class="w-2 h-2 bg-red-400 rounded-full"></div>
          <span>Отсутствует подключение к интернету</span>
        </div>
      )}
    </div>
  );
}