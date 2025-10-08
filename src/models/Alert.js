/**
 * Модель продвинутого алерта
 */

import { AlertType, Priority, AlertCategory, Condition, TimeFrame } from './AlertTypes';

export class AdvancedAlert {
  constructor(data = {}) {
    this.id = data.id || Date.now().toString();
    this.userId = data.userId;
    this.name = data.name || 'Новый алерт';
    this.description = data.description || '';
    
    // Основные параметры
    this.type = data.type || AlertType.PRICE_ABSOLUTE;
    this.category = data.category || AlertCategory.PORTFOLIO.id;
    this.priority = data.priority || Priority.MEDIUM.level;
    
    // Целевая криптовалюта
    this.tokenId = data.tokenId;
    this.tokenName = data.tokenName;
    this.tokenSymbol = data.tokenSymbol;
    
    // Условия срабатывания
    this.conditions = data.conditions || [];
    this.logicalOperator = data.logicalOperator || 'and'; // для составных условий
    
    // Временные параметры
    this.timeFrame = data.timeFrame || TimeFrame.HOUR_24;
    this.cooldownPeriod = data.cooldownPeriod || 300000; // 5 минут в мс
    
    // Настройки уведомлений
    this.notificationChannels = data.notificationChannels || ['browser', 'sound'];
    this.notificationMessage = data.notificationMessage || '';
    
    // Статус и метаданные
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isPaused = data.isPaused || false;
    this.triggeredCount = data.triggeredCount || 0;
    this.lastTriggered = data.lastTriggered || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // Дополнительные данные
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
  }

  /**
   * Проверяет, сработал ли алерт на основе текущих данных
   */
  evaluate(currentData, historicalData = {}) {
    if (!this.isActive || this.isPaused) return false;

    // Проверка cooldown периода
    if (this.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - new Date(this.lastTriggered).getTime();
      if (timeSinceLastTrigger < this.cooldownPeriod) {
        return false;
      }
    }

    // Оценка условий в зависимости от типа алерта
    switch (this.type) {
      case AlertType.PRICE_ABSOLUTE:
        return this.evaluatePriceAbsolute(currentData);
      
      case AlertType.PRICE_PERCENTAGE:
        return this.evaluatePricePercentage(currentData, historicalData);
      
      case AlertType.PRICE_ATH:
        return this.evaluatePriceATH(currentData, historicalData);
      
      case AlertType.PRICE_ATL:
        return this.evaluatePriceATL(currentData, historicalData);
      
      case AlertType.VOLUME_ABSOLUTE:
        return this.evaluateVolumeAbsolute(currentData);
      
      case AlertType.VOLUME_SPIKE:
        return this.evaluateVolumeSpike(currentData, historicalData);
      
      case AlertType.MARKET_CAP:
        return this.evaluateMarketCap(currentData, historicalData);
      
      case AlertType.RANK_CHANGE:
        return this.evaluateRankChange(currentData, historicalData);
      
      case AlertType.RATIO_PAIR:
        return this.evaluateRatioPair(currentData);
      
      case AlertType.DOMINANCE:
        return this.evaluateDominance(currentData);
      
      case AlertType.COMPLEX:
        return this.evaluateComplex(currentData, historicalData);
      
      default:
        return false;
    }
  }

  evaluatePriceAbsolute(data) {
    if (!this.conditions.length || !data.price) return false;
    const condition = this.conditions[0];
    
    switch (condition.operator) {
      case 'above':
        return data.price >= condition.value;
      case 'below':
        return data.price <= condition.value;
      case 'equals':
        return Math.abs(data.price - condition.value) < (condition.value * 0.001);
      default:
        return false;
    }
  }

  evaluatePricePercentage(data, historical) {
    if (!this.conditions.length || !data.price || !historical.startPrice) return false;
    const condition = this.conditions[0];
    
    const changePercent = ((data.price - historical.startPrice) / historical.startPrice) * 100;
    
    switch (condition.operator) {
      case 'increases_by':
        return changePercent >= condition.value;
      case 'decreases_by':
        return changePercent <= -condition.value;
      default:
        return false;
    }
  }

  evaluatePriceATH(data, historical) {
    if (!data.price || !historical.ath) return false;
    return data.price >= historical.ath;
  }

  evaluatePriceATL(data, historical) {
    if (!data.price || !historical.atl) return false;
    return data.price <= historical.atl;
  }

  evaluateVolumeAbsolute(data) {
    if (!this.conditions.length || !data.volume) return false;
    const condition = this.conditions[0];
    
    switch (condition.operator) {
      case 'above':
        return data.volume >= condition.value;
      case 'below':
        return data.volume <= condition.value;
      default:
        return false;
    }
  }

  evaluateVolumeSpike(data, historical) {
    if (!data.volume || !historical.avgVolume) return false;
    const condition = this.conditions[0];
    
    const volumeMultiplier = data.volume / historical.avgVolume;
    return volumeMultiplier >= (condition.value || 3);
  }

  evaluateMarketCap(data, historical) {
    if (!this.conditions.length || !data.marketCap || !historical.startMarketCap) return false;
    const condition = this.conditions[0];
    
    const changePercent = ((data.marketCap - historical.startMarketCap) / historical.startMarketCap) * 100;
    
    return Math.abs(changePercent) >= condition.value;
  }

  evaluateRankChange(data, historical) {
    if (!data.rank || !historical.startRank) return false;
    const condition = this.conditions[0];
    
    const rankDifference = Math.abs(data.rank - historical.startRank);
    return rankDifference >= (condition.value || 5);
  }

  evaluateRatioPair(data) {
    if (!this.conditions.length || !data.ratio) return false;
    const condition = this.conditions[0];
    
    switch (condition.operator) {
      case 'above':
        return data.ratio >= condition.value;
      case 'below':
        return data.ratio <= condition.value;
      default:
        return false;
    }
  }

  evaluateDominance(data) {
    if (!this.conditions.length || !data.dominance) return false;
    const condition = this.conditions[0];
    
    switch (condition.operator) {
      case 'above':
        return data.dominance >= condition.value;
      case 'below':
        return data.dominance <= condition.value;
      default:
        return false;
    }
  }

  evaluateComplex(data, historical) {
    // Оценка составных условий с AND/OR/NOT
    if (!this.conditions.length) return false;

    const results = this.conditions.map(condition => {
      // Создаем временный алерт для оценки каждого условия
      const tempAlert = new AdvancedAlert({
        type: condition.type,
        conditions: [condition]
      });
      return tempAlert.evaluate(data, historical);
    });

    switch (this.logicalOperator) {
      case 'and':
        return results.every(r => r === true);
      case 'or':
        return results.some(r => r === true);
      case 'not':
        return !results[0];
      default:
        return false;
    }
  }

  /**
   * Отмечает алерт как сработавший
   */
  trigger() {
    this.triggeredCount++;
    this.lastTriggered = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Сбрасывает счетчик срабатываний
   */
  reset() {
    this.triggeredCount = 0;
    this.lastTriggered = null;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Приостанавливает алерт
   */
  pause() {
    this.isPaused = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Возобновляет алерт
   */
  resume() {
    this.isPaused = false;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Преобразует алерт в JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      priority: this.priority,
      tokenId: this.tokenId,
      tokenName: this.tokenName,
      tokenSymbol: this.tokenSymbol,
      conditions: this.conditions,
      logicalOperator: this.logicalOperator,
      timeFrame: this.timeFrame,
      cooldownPeriod: this.cooldownPeriod,
      notificationChannels: this.notificationChannels,
      notificationMessage: this.notificationMessage,
      isActive: this.isActive,
      isPaused: this.isPaused,
      triggeredCount: this.triggeredCount,
      lastTriggered: this.lastTriggered,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
      metadata: this.metadata
    };
  }
}
