import { Check, X, Bell } from 'lucide-solid';

export function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div class={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      toast.type === 'success' ? 'bg-green-600' : 
      toast.type === 'error' ? 'bg-red-600' : 
      'bg-blue-600'
    }`}>
      <div class="flex items-center gap-2">
        {toast.type === 'success' && <Check class="w-5 h-5" />}
        {toast.type === 'error' && <X class="w-5 h-5" />}
        {toast.type === 'info' && <Bell class="w-5 h-5" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}