/**
 * Типы продвинутых алертов для Token Alert Manager
 */

// Основные типы алертов
export const AlertType = {
  // Ценовые алерты Pro
  PRICE_ABSOLUTE: 'price_absolute',              // Простая цена: выше/ниже X
  PRICE_PERCENTAGE: 'price_percentage',          // Процентное изменение: +15% за 4ч
  PRICE_ATH: 'price_ath',                        // Новый исторический максимум
  PRICE_ATL: 'price_atl',                        // Новый исторический минимум
  PRICE_SUPPORT_RESISTANCE: 'price_support_resistance', // Пробитие уровня
  PRICE_MOVING_AVERAGE: 'price_moving_average', // Скользящие средние
  
  // Объемные алерты
  VOLUME_ABSOLUTE: 'volume_absolute',            // Объем > X
  VOLUME_SPIKE: 'volume_spike',                  // Объем выше среднего в N раз
  VOLUME_UNUSUAL: 'volume_unusual',              // Необычная активность
  
  // Рыночные алерты
  MARKET_CAP: 'market_cap',                      // Изменение капитализации
  RANK_CHANGE: 'rank_change',                    // Изменение позиции в рейтинге
  NEW_LISTING: 'new_listing',                    // Новая монета в топ-N
  
  // Соотношения и пары
  RATIO_PAIR: 'ratio_pair',                      // ETH/BTC > X
  DOMINANCE: 'dominance',                        // BTC dominance < X%
  
  // Составные условия
  COMPLEX: 'complex'                             // Комплексное условие (AND/OR/NOT)
};

// Условия сравнения
export const Condition = {
  ABOVE: 'above',                  // Выше
  BELOW: 'below',                  // Ниже
  EQUALS: 'equals',                // Равно
  CROSSES_ABOVE: 'crosses_above',  // Пересекает снизу вверх
  CROSSES_BELOW: 'crosses_below',  // Пересекает сверху вниз
  INCREASES_BY: 'increases_by',    // Увеличивается на
  DECREASES_BY: 'decreases_by',    // Уменьшается на
  ENTERS_RANGE: 'enters_range',    // Входит в диапазон
  EXITS_RANGE: 'exits_range',      // Выходит из диапазона
  SPIKE: 'spike',                  // Резкий скачок
  DROP: 'drop'                     // Резкое падение
};

// Временные фреймы
export const TimeFrame = {
  MINUTE_5: '5m',
  MINUTE_15: '15m',
  HOUR_1: '1h',
  HOUR_4: '4h',
  HOUR_24: '24h',
  DAY_7: '7d',
  DAY_30: '30d'
};

// Приоритеты алертов
export const Priority = {
  CRITICAL: {
    level: 'critical',
    icon: '🔴',
    color: 'red',
    sound: 'critical',
    label: 'Критический'
  },
  HIGH: {
    level: 'high',
    icon: '🟠',
    color: 'orange',
    sound: 'high',
    label: 'Важный'
  },
  MEDIUM: {
    level: 'medium',
    icon: '🟡',
    color: 'yellow',
    sound: 'medium',
    label: 'Средний'
  },
  LOW: {
    level: 'low',
    icon: '🟢',
    color: 'green',
    sound: 'low',
    label: 'Информационный'
  }
};

// Категории алертов
export const AlertCategory = {
  PORTFOLIO: {
    id: 'portfolio',
    name: 'Портфельные',
    icon: '💼',
    description: 'Алерты по вашим монетам'
  },
  MARKET: {
    id: 'market',
    name: 'Рыночные',
    icon: '📊',
    description: 'Общие рыночные события'
  },
  TRADING: {
    id: 'trading',
    name: 'Трейдинговые',
    icon: '📈',
    description: 'Сигналы входа/выхода'
  },
  NEWS: {
    id: 'news',
    name: 'Новости',
    icon: '📰',
    description: 'Новые проекты и события'
  }
};

// Логические операторы для комплексных условий
export const LogicalOperator = {
  AND: 'and',
  OR: 'or',
  NOT: 'not'
};

// Каналы уведомлений
export const NotificationChannel = {
  BROWSER: 'browser',
  EMAIL: 'email',
  SOUND: 'sound',
  VISUAL: 'visual'
};

// Периоды скользящих средних
export const MovingAveragePeriod = {
  MA_20: 20,
  MA_50: 50,
  MA_100: 100,
  MA_200: 200
};
