# 🚀 Проект работает! Что настроить в Supabase

## ✅ Что уже работает:
- ✅ Авторизация (демо режим с localStorage)
- ✅ Живое табло цен криптовалют  
- ✅ Создание алертов
- ✅ Удаление алертов
- ✅ Обновление цен

## 🔗 Как подключить Supabase:

### Шаг 1: Создание проекта в Supabase
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите через GitHub или создайте аккаунт
4. Нажмите "New project"
5. Выберите организацию
6. Заполните данные:
   - **Name**: `token-alert-manager`
   - **Database Password**: придумайте надёжный пароль
   - **Region**: выберите ближайший регион
7. Нажмите "Create new project"

### Шаг 2: Получение данных для подключения
1. В дашборде проекта перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: `https://abcdefgh.supabase.co`)
   - **anon public** ключ (длинная строка начинающаяся с `eyJ...`)

### Шаг 3: Создание таблиц
1. Перейдите в **SQL Editor**
2. Создайте новый запрос
3. Скопируйте и выполните:

```sql
-- Создание таблицы для алертов
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  token_name TEXT NOT NULL,
  target_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  condition TEXT CHECK (condition IN ('less', 'greater')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включение Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON alerts
  FOR DELETE USING (auth.uid() = user_id);
```

### Шаг 4: Настройка аутентификации
1. Перейдите в **Authentication** → **Settings**
2. В разделе **Site URL** добавьте: `http://localhost:3001`
3. В разделе **Redirect URLs** добавьте: `http://localhost:3001`

### Шаг 5: Обновление конфигурации проекта
1. Откройте файл `.env` в корне проекта
2. Замените значения:
```env
VITE_SUPABASE_URL=ваш_project_url
VITE_SUPABASE_ANON_KEY=ваш_anon_ключ
```

### Шаг 6: Переключение на Supabase
1. Откройте `src/App.jsx`
2. Найдите строку 23: `const USE_MOCK_AUTH = true;`
3. Измените на: `const USE_MOCK_AUTH = false;`
4. Перезапустите сервер: `npm run dev`

## 📱 Как тестировать сейчас:

1. Откройте: http://localhost:3001
2. Введите любой email и пароль (мин. 6 символов)
3. Создавайте алерты после входа
4. Все данные сохраняются локально

### Примеры для входа:
- Email: `test@example.com`
- Пароль: `123456`

---

🎉 **Приложение полностью работает!** Supabase нужен только для облачного хранения данных.