# Настройка Supabase для Token Alert Manager

## 1. Получение данных из Supabase Dashboard

1. Откройте ваш проект в Supabase Dashboard
2. Перейдите в Settings → API
3. Скопируйте следующие данные:
   - **Project URL** (например: https://xyzcompany.supabase.co)
   - **anon public key** (длинный JWT токен)

## 2. Настройка переменных окружения

Откройте файл `.env` в корне проекта и замените значения:

```env
VITE_SUPABASE_URL=ваш_project_url
VITE_SUPABASE_ANON_KEY=ваш_anon_public_key
```

## 3. Создание таблиц в базе данных

1. В Supabase Dashboard перейдите в SQL Editor
2. Скопируйте содержимое файла `database-setup.sql`
3. Вставьте в SQL Editor и нажмите "RUN"

Или выполните команды по частям:

### Создание таблицы alerts:
```sql
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  token_name TEXT NOT NULL,
  target_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  alert_type TEXT CHECK (alert_type IN ('above', 'below')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_at TIMESTAMP WITH TIME ZONE
);
```

### Создание таблицы price_history:
```sql
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  token_name TEXT NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  change_24h DECIMAL(10, 4),
  market_cap BIGINT,
  volume_24h BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Включение Row Level Security:
```sql
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
```

## 4. Тестирование подключения

После настройки запустите проект и проверьте консоль браузера:
- Должно появиться сообщение "✅ Подключение к Supabase успешно!"

## 5. Возможные проблемы

- **Ошибка CORS**: Убедитесь, что ваш localhost добавлен в Site URL в Authentication settings
- **Ошибка подключения**: Проверьте правильность URL и ключа API
- **Ошибки с таблицами**: Убедитесь, что все SQL команды выполнены успешно