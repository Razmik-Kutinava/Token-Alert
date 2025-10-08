/**
 * Готовые шаблоны алертов для различных стратегий
 */

import { AlertType, Priority, AlertCategory, TimeFrame } from './AlertTypes';

export const AlertTemplates = {
  // 🎯 Категория: Для новичков
  BEGINNER: {
    SIMPLE_PRICE_ALERT: {
      name: 'Простой ценовой алерт',
      description: 'Уведомление когда цена достигает определенного уровня',
      type: AlertType.PRICE_ABSOLUTE,
      category: AlertCategory.PORTFOLIO.id,
      priority: Priority.MEDIUM.level,
      icon: '📍',
      template: (tokenId, tokenName, targetPrice, condition = 'above') => ({
        name: `${tokenName} ${condition === 'above' ? 'выше' : 'ниже'} $${targetPrice}`,
        description: `Уведомить когда ${tokenName} ${condition === 'above' ? 'поднимется выше' : 'упадет ниже'} $${targetPrice}`,
        type: AlertType.PRICE_ABSOLUTE,
        category: AlertCategory.PORTFOLIO.id,
        priority: Priority.MEDIUM.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: condition,
          value: targetPrice,
          field: 'price'
        }],
        timeFrame: TimeFrame.HOUR_24,
        notificationChannels: ['browser', 'sound']
      })
    },

    PERCENT_CHANGE: {
      name: 'Изменение на X%',
      description: 'Уведомление при изменении цены на определенный процент',
      type: AlertType.PRICE_PERCENTAGE,
      category: AlertCategory.PORTFOLIO.id,
      priority: Priority.MEDIUM.level,
      icon: '📊',
      template: (tokenId, tokenName, percentChange, timeFrame = TimeFrame.HOUR_24) => ({
        name: `${tokenName} ${percentChange > 0 ? '+' : ''}${percentChange}% за ${timeFrame}`,
        description: `Уведомить при изменении ${tokenName} на ${percentChange}%`,
        type: AlertType.PRICE_PERCENTAGE,
        category: AlertCategory.PORTFOLIO.id,
        priority: Math.abs(percentChange) > 15 ? Priority.HIGH.level : Priority.MEDIUM.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: percentChange > 0 ? 'increases_by' : 'decreases_by',
          value: Math.abs(percentChange),
          field: 'price'
        }],
        timeFrame,
        notificationChannels: ['browser', 'sound']
      })
    }
  },

  // 📈 Категория: DCA (Dollar Cost Averaging)
  DCA: {
    BUY_THE_DIP: {
      name: 'Купить на просадке',
      description: 'Алерт когда цена падает на 10% - хорошее время для DCA',
      type: AlertType.PRICE_PERCENTAGE,
      category: AlertCategory.TRADING.id,
      priority: Priority.HIGH.level,
      icon: '💰',
      template: (tokenId, tokenName, dipPercent = -10) => ({
        name: `${tokenName}: Просадка ${Math.abs(dipPercent)}% - DCA возможность`,
        description: `DCA сигнал: ${tokenName} упал на ${Math.abs(dipPercent)}% за 24ч`,
        type: AlertType.PRICE_PERCENTAGE,
        category: AlertCategory.TRADING.id,
        priority: Priority.HIGH.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'decreases_by',
          value: Math.abs(dipPercent),
          field: 'price'
        }],
        timeFrame: TimeFrame.HOUR_24,
        notificationChannels: ['browser', 'sound', 'visual'],
        tags: ['dca', 'buy-opportunity']
      })
    },

    ACCUMULATION_ZONE: {
      name: 'Зона накопления',
      description: 'Цена в определенном диапазоне - хорошо для накопления',
      type: AlertType.PRICE_ABSOLUTE,
      category: AlertCategory.TRADING.id,
      priority: Priority.MEDIUM.level,
      icon: '🎯',
      template: (tokenId, tokenName, minPrice, maxPrice) => ({
        name: `${tokenName}: Зона накопления $${minPrice}-$${maxPrice}`,
        description: `DCA: ${tokenName} в зоне накопления`,
        type: AlertType.COMPLEX,
        category: AlertCategory.TRADING.id,
        priority: Priority.MEDIUM.level,
        tokenId,
        tokenName,
        conditions: [
          {
            type: AlertType.PRICE_ABSOLUTE,
            operator: 'above',
            value: minPrice,
            field: 'price'
          },
          {
            type: AlertType.PRICE_ABSOLUTE,
            operator: 'below',
            value: maxPrice,
            field: 'price'
          }
        ],
        logicalOperator: 'and',
        timeFrame: TimeFrame.HOUR_24,
        notificationChannels: ['browser'],
        tags: ['dca', 'accumulation']
      })
    }
  },

  // 🚨 Категория: Риск-менеджмент
  RISK_MANAGEMENT: {
    CRITICAL_DROP: {
      name: 'Критическое падение',
      description: 'Алерт при резком падении цены - возможна продажа',
      type: AlertType.PRICE_PERCENTAGE,
      category: AlertCategory.PORTFOLIO.id,
      priority: Priority.CRITICAL.level,
      icon: '🚨',
      template: (tokenId, tokenName, dropPercent = -20) => ({
        name: `${tokenName}: КРИТИЧЕСКОЕ ПАДЕНИЕ ${Math.abs(dropPercent)}%`,
        description: `⚠️ ВНИМАНИЕ: ${tokenName} упал на ${Math.abs(dropPercent)}% за короткое время!`,
        type: AlertType.PRICE_PERCENTAGE,
        category: AlertCategory.PORTFOLIO.id,
        priority: Priority.CRITICAL.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'decreases_by',
          value: Math.abs(dropPercent),
          field: 'price'
        }],
        timeFrame: TimeFrame.HOUR_1,
        cooldownPeriod: 600000, // 10 минут
        notificationChannels: ['browser', 'sound', 'visual'],
        tags: ['risk', 'critical', 'sell-signal']
      })
    },

    TAKE_PROFIT: {
      name: 'Взять профит',
      description: 'Достигнута цель по прибыли - время фиксировать',
      type: AlertType.PRICE_PERCENTAGE,
      category: AlertCategory.TRADING.id,
      priority: Priority.HIGH.level,
      icon: '💎',
      template: (tokenId, tokenName, profitPercent = 50) => ({
        name: `${tokenName}: Профит +${profitPercent}% 🎉`,
        description: `Take profit: ${tokenName} вырос на ${profitPercent}%`,
        type: AlertType.PRICE_PERCENTAGE,
        category: AlertCategory.TRADING.id,
        priority: Priority.HIGH.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'increases_by',
          value: profitPercent,
          field: 'price'
        }],
        timeFrame: TimeFrame.DAY_7,
        notificationChannels: ['browser', 'sound', 'visual'],
        tags: ['take-profit', 'sell-signal']
      })
    },

    STOP_LOSS: {
      name: 'Стоп-лосс',
      description: 'Цена достигла уровня стоп-лосса',
      type: AlertType.PRICE_ABSOLUTE,
      category: AlertCategory.TRADING.id,
      priority: Priority.CRITICAL.level,
      icon: '🛑',
      template: (tokenId, tokenName, stopLossPrice) => ({
        name: `${tokenName}: СТОП-ЛОСС $${stopLossPrice}`,
        description: `⛔ Стоп-лосс: ${tokenName} достиг $${stopLossPrice}`,
        type: AlertType.PRICE_ABSOLUTE,
        category: AlertCategory.TRADING.id,
        priority: Priority.CRITICAL.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'below',
          value: stopLossPrice,
          field: 'price'
        }],
        timeFrame: TimeFrame.MINUTE_5,
        cooldownPeriod: 300000, // 5 минут
        notificationChannels: ['browser', 'sound', 'visual'],
        tags: ['stop-loss', 'critical', 'sell-now']
      })
    }
  },

  // 🔥 Категория: Рыночные события
  MARKET_EVENTS: {
    NEW_ATH: {
      name: 'Новый максимум',
      description: 'Монета достигла нового исторического максимума',
      type: AlertType.PRICE_ATH,
      category: AlertCategory.MARKET.id,
      priority: Priority.HIGH.level,
      icon: '🚀',
      template: (tokenId, tokenName) => ({
        name: `${tokenName}: НОВЫЙ ATH! 🚀`,
        description: `${tokenName} достиг нового исторического максимума!`,
        type: AlertType.PRICE_ATH,
        category: AlertCategory.MARKET.id,
        priority: Priority.HIGH.level,
        tokenId,
        tokenName,
        conditions: [],
        timeFrame: TimeFrame.HOUR_1,
        cooldownPeriod: 3600000, // 1 час
        notificationChannels: ['browser', 'sound', 'visual'],
        tags: ['ath', 'milestone', 'bullish']
      })
    },

    HIGH_VOLUME: {
      name: 'Высокий объем',
      description: 'Необычно высокий объем торгов - что-то происходит',
      type: AlertType.VOLUME_SPIKE,
      category: AlertCategory.MARKET.id,
      priority: Priority.HIGH.level,
      icon: '📊',
      template: (tokenId, tokenName, multiplier = 3) => ({
        name: `${tokenName}: Высокий объем (${multiplier}x)`,
        description: `Объем торгов ${tokenName} в ${multiplier}+ раз выше среднего!`,
        type: AlertType.VOLUME_SPIKE,
        category: AlertCategory.MARKET.id,
        priority: Priority.HIGH.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'spike',
          value: multiplier,
          field: 'volume'
        }],
        timeFrame: TimeFrame.HOUR_24,
        cooldownPeriod: 1800000, // 30 минут
        notificationChannels: ['browser', 'sound'],
        tags: ['volume', 'unusual-activity']
      })
    },

    RANK_JUMP: {
      name: 'Прыжок в рейтинге',
      description: 'Монета значительно изменила позицию в топе',
      type: AlertType.RANK_CHANGE,
      category: AlertCategory.NEWS.id,
      priority: Priority.MEDIUM.level,
      icon: '📈',
      template: (tokenId, tokenName, rankChange = 10) => ({
        name: `${tokenName}: Изменение рейтинга на ${rankChange} мест`,
        description: `${tokenName} изменил позицию в рейтинге на ${rankChange}+ мест`,
        type: AlertType.RANK_CHANGE,
        category: AlertCategory.NEWS.id,
        priority: Priority.MEDIUM.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'change',
          value: rankChange,
          field: 'rank'
        }],
        timeFrame: TimeFrame.DAY_7,
        cooldownPeriod: 86400000, // 24 часа
        notificationChannels: ['browser'],
        tags: ['rank', 'market-movement']
      })
    }
  },

  // ⚡ Категория: Скальпинг
  SCALPING: {
    QUICK_PROFIT_5: {
      name: 'Быстрая прибыль 5%',
      description: 'Для скальперов - быстрый рост 5% за час',
      type: AlertType.PRICE_PERCENTAGE,
      category: AlertCategory.TRADING.id,
      priority: Priority.HIGH.level,
      icon: '⚡',
      template: (tokenId, tokenName) => ({
        name: `${tokenName}: Быстрый +5% за час`,
        description: `Скальпинг: ${tokenName} вырос на 5% за час`,
        type: AlertType.PRICE_PERCENTAGE,
        category: AlertCategory.TRADING.id,
        priority: Priority.HIGH.level,
        tokenId,
        tokenName,
        conditions: [{
          operator: 'increases_by',
          value: 5,
          field: 'price'
        }],
        timeFrame: TimeFrame.HOUR_1,
        cooldownPeriod: 1800000, // 30 минут
        notificationChannels: ['browser', 'sound'],
        tags: ['scalping', 'quick-trade']
      })
    },

    VOLATILITY_SPIKE: {
      name: 'Всплеск волатильности',
      description: 'Резкие движения цены - возможности для скальпинга',
      type: AlertType.COMPLEX,
      category: AlertCategory.TRADING.id,
      priority: Priority.HIGH.level,
      icon: '💥',
      template: (tokenId, tokenName) => ({
        name: `${tokenName}: Всплеск волатильности`,
        description: `Высокая волатильность ${tokenName} - скальпинг возможности`,
        type: AlertType.COMPLEX,
        category: AlertCategory.TRADING.id,
        priority: Priority.HIGH.level,
        tokenId,
        tokenName,
        conditions: [
          {
            type: AlertType.PRICE_PERCENTAGE,
            operator: 'increases_by',
            value: 3,
            field: 'price'
          },
          {
            type: AlertType.VOLUME_SPIKE,
            operator: 'spike',
            value: 2,
            field: 'volume'
          }
        ],
        logicalOperator: 'or',
        timeFrame: TimeFrame.MINUTE_15,
        cooldownPeriod: 900000, // 15 минут
        notificationChannels: ['browser', 'sound'],
        tags: ['scalping', 'volatility']
      })
    }
  },

  // 🌐 Категория: Рыночная доминация
  DOMINANCE: {
    BTC_DOMINANCE_SHIFT: {
      name: 'Изменение доминации BTC',
      description: 'BTC dominance изменилась - альтсезон или BTC сезон',
      type: AlertType.DOMINANCE,
      category: AlertCategory.MARKET.id,
      priority: Priority.MEDIUM.level,
      icon: '👑',
      template: (threshold = 45, direction = 'below') => ({
        name: `BTC Dominance ${direction === 'below' ? 'ниже' : 'выше'} ${threshold}%`,
        description: `BTC dominance ${direction === 'below' ? 'упала ниже' : 'поднялась выше'} ${threshold}% - ${direction === 'below' ? 'начало альтсезона' : 'BTC доминирует'}`,
        type: AlertType.DOMINANCE,
        category: AlertCategory.MARKET.id,
        priority: Priority.MEDIUM.level,
        tokenId: 'bitcoin',
        tokenName: 'Bitcoin',
        conditions: [{
          operator: direction,
          value: threshold,
          field: 'dominance'
        }],
        timeFrame: TimeFrame.HOUR_24,
        cooldownPeriod: 3600000, // 1 час
        notificationChannels: ['browser'],
        tags: ['dominance', 'market-cycle']
      })
    }
  }
};

/**
 * Получить список всех категорий шаблонов
 */
export function getTemplateCategories() {
  return [
    { id: 'BEGINNER', name: 'Для новичков', icon: '🎓', description: 'Простые алерты для начинающих' },
    { id: 'DCA', name: 'DCA стратегии', icon: '💰', description: 'Усреднение позиций' },
    { id: 'RISK_MANAGEMENT', name: 'Риск-менеджмент', icon: '🛡️', description: 'Защита капитала' },
    { id: 'MARKET_EVENTS', name: 'Рыночные события', icon: '🔥', description: 'Важные события рынка' },
    { id: 'SCALPING', name: 'Скальпинг', icon: '⚡', description: 'Быстрые сделки' },
    { id: 'DOMINANCE', name: 'Доминация', icon: '👑', description: 'Рыночные циклы' }
  ];
}

/**
 * Получить все шаблоны определенной категории
 */
export function getTemplatesByCategory(categoryId) {
  return AlertTemplates[categoryId] || {};
}
