-- Создание таблиц для Token Alert Manager

-- Таблица для хранения пользовательских алертов
CREATE TABLE IF NOT EXISTS alerts (
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

-- Таблица для хранения истории цен (опционально)
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  token_name TEXT NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  change_24h DECIMAL(10, 4),
  market_cap BIGINT,
  volume_24h BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_token_id ON alerts(token_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_token_id ON price_history(token_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);

-- Включение Row Level Security (RLS)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для таблицы alerts
-- Пользователи могут видеть только свои алерты
CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут создавать алерты для себя
CREATE POLICY "Users can insert own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои алерты
CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи могут удалять свои алерты
CREATE POLICY "Users can delete own alerts" ON alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для таблицы price_history (только чтение для всех аутентифицированных пользователей)
CREATE POLICY "Authenticated users can view price history" ON price_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в таблице alerts
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();