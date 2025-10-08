import { createClient } from '@supabase/supabase-js'

// Конфигурация Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)

// Проверка подключения
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('alerts').select('count', { count: 'exact' })
    if (error) {
      console.error('Ошибка подключения к Supabase:', error)
      return false
    }
    console.log('✅ Подключение к Supabase успешно!')
    return true
  } catch (err) {
    console.error('❌ Не удалось подключиться к Supabase:', err)
    return false
  }
}