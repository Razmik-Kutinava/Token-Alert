import { createSignal, createEffect, For, Show } from 'solid-js';
import { AlertType, Priority, AlertCategory, TimeFrame, Condition } from '../models/AlertTypes';
import { AlertTemplates, getTemplateCategories, getTemplatesByCategory } from '../models/AlertTemplates';

/**
 * Продвинутый конструктор алертов
 */
export function AdvancedAlertBuilder({ 
  tokens, 
  onCreateAlert, 
  onCancel 
}) {
  // Режимы создания
  const [mode, setMode] = createSignal('template'); // 'template' или 'custom'
  
  // Выбранная категория шаблонов
  const [selectedTemplateCategory, setSelectedTemplateCategory] = createSignal(null);
  const [selectedTemplate, setSelectedTemplate] = createSignal(null);
  
  // Данные алерта
  const [alertData, setAlertData] = createSignal({
    name: '',
    description: '',
    type: AlertType.PRICE_ABSOLUTE,
    category: AlertCategory.PORTFOLIO.id,
    priority: Priority.MEDIUM.level,
    tokenId: '',
    tokenName: '',
    tokenSymbol: '',
    conditions: [{
      operator: 'above',
      value: '',
      field: 'price'
    }],
    timeFrame: TimeFrame.HOUR_24,
    notificationChannels: ['browser', 'sound'],
    tags: []
  });

  // Список категорий шаблонов
  const templateCategories = getTemplateCategories();

  /**
   * Выбор шаблона
   */
  const selectTemplate = (categoryId, templateKey) => {
    const templates = getTemplatesByCategory(categoryId);
    const template = templates[templateKey];
    
    if (template) {
      setSelectedTemplate({ category: categoryId, key: templateKey, template });
    }
  };

  /**
   * Применить шаблон
   */
  const applyTemplate = () => {
    const selected = selectedTemplate();
    if (!selected || !alertData().tokenId) return;

    const token = tokens.find(t => t.id === alertData().tokenId);
    if (!token) return;

    // Получаем параметры для шаблона
    let templateInstance;
    const { category, key, template } = selected;
    
    // В зависимости от типа шаблона, применяем разные параметры
    switch (key) {
      case 'SIMPLE_PRICE_ALERT':
        templateInstance = template.template(
          token.id,
          token.name,
          parseFloat(alertData().conditions[0].value) || 0,
          alertData().conditions[0].operator
        );
        break;
      
      case 'PERCENT_CHANGE':
        const percent = parseFloat(alertData().conditions[0].value) || 10;
        templateInstance = template.template(
          token.id,
          token.name,
          alertData().conditions[0].operator === 'increases_by' ? percent : -percent,
          alertData().timeFrame
        );
        break;
      
      case 'BUY_THE_DIP':
        templateInstance = template.template(
          token.id,
          token.name,
          -(parseFloat(alertData().conditions[0].value) || 10)
        );
        break;
      
      case 'CRITICAL_DROP':
        templateInstance = template.template(
          token.id,
          token.name,
          -(parseFloat(alertData().conditions[0].value) || 20)
        );
        break;
      
      case 'TAKE_PROFIT':
        templateInstance = template.template(
          token.id,
          token.name,
          parseFloat(alertData().conditions[0].value) || 50
        );
        break;
      
      case 'STOP_LOSS':
        templateInstance = template.template(
          token.id,
          token.name,
          parseFloat(alertData().conditions[0].value) || 0
        );
        break;
      
      case 'NEW_ATH':
        templateInstance = template.template(token.id, token.name);
        break;
      
      case 'HIGH_VOLUME':
        templateInstance = template.template(
          token.id,
          token.name,
          parseFloat(alertData().conditions[0].value) || 3
        );
        break;
      
      default:
        templateInstance = template.template(token.id, token.name);
    }

    if (templateInstance) {
      setAlertData({
        ...alertData(),
        ...templateInstance,
        tokenSymbol: token.symbol
      });
    }
  };

  /**
   * Обновление условия
   */
  const updateCondition = (index, field, value) => {
    const conditions = [...alertData().conditions];
    conditions[index] = {
      ...conditions[index],
      [field]: value
    };
    setAlertData({ ...alertData(), conditions });
  };

  /**
   * Добавить условие
   */
  const addCondition = () => {
    setAlertData({
      ...alertData(),
      conditions: [
        ...alertData().conditions,
        { operator: 'above', value: '', field: 'price' }
      ]
    });
  };

  /**
   * Удалить условие
   */
  const removeCondition = (index) => {
    const conditions = alertData().conditions.filter((_, i) => i !== index);
    setAlertData({ ...alertData(), conditions });
  };

  /**
   * Создать алерт
   */
  const handleCreateAlert = () => {
    // Валидация
    if (!alertData().tokenId || !alertData().name) {
      alert('Заполните обязательные поля');
      return;
    }

    if (alertData().conditions.some(c => !c.value)) {
      alert('Заполните все условия');
      return;
    }

    onCreateAlert(alertData());
  };

  // Автоматически применяем шаблон при изменении токена
  createEffect(() => {
    if (selectedTemplate() && alertData().tokenId) {
      applyTemplate();
    }
  });

  return (
    <div class="bg-dark-card rounded-xl p-6 border border-gray-700">
      <h3 class="text-2xl font-bold mb-6">
        🎯 Создать продвинутый алерт
      </h3>

      {/* Выбор режима */}
      <div class="flex gap-4 mb-6">
        <button
          onClick={() => setMode('template')}
          class={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            mode() === 'template'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-dark-bg text-gray-400 hover:text-white'
          }`}
        >
          📋 Использовать шаблон
        </button>
        <button
          onClick={() => setMode('custom')}
          class={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            mode() === 'custom'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-dark-bg text-gray-400 hover:text-white'
          }`}
        >
          ⚙️ Настроить вручную
        </button>
      </div>

      {/* Режим шаблонов */}
      <Show when={mode() === 'template'}>
        <div class="space-y-6">
          {/* Выбор категории */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">
              Категория стратегии
            </label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <For each={templateCategories}>
                {(category) => (
                  <button
                    onClick={() => {
                      setSelectedTemplateCategory(category.id);
                      setSelectedTemplate(null);
                    }}
                    class={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplateCategory() === category.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div class="text-3xl mb-2">{category.icon}</div>
                    <div class="font-semibold text-sm">{category.name}</div>
                    <div class="text-xs text-gray-400 mt-1">{category.description}</div>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Выбор шаблона */}
          <Show when={selectedTemplateCategory()}>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">
                Выберите шаблон
              </label>
              <div class="space-y-2">
                <For each={Object.entries(getTemplatesByCategory(selectedTemplateCategory()))}>
                  {([key, template]) => (
                    <button
                      onClick={() => selectTemplate(selectedTemplateCategory(), key)}
                      class={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedTemplate()?.key === key
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div class="flex items-center gap-3">
                        <div class="text-2xl">{template.icon}</div>
                        <div class="flex-1">
                          <div class="font-semibold">{template.name}</div>
                          <div class="text-sm text-gray-400">{template.description}</div>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Общие поля (для обоих режимов) */}
      <div class="space-y-4 mt-6">
        {/* Выбор токена */}
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Криптовалюта *
          </label>
          <select
            value={alertData().tokenId}
            onInput={(e) => {
              const token = tokens.find(t => t.id === e.target.value);
              setAlertData({
                ...alertData(),
                tokenId: e.target.value,
                tokenName: token?.name || '',
                tokenSymbol: token?.symbol || ''
              });
            }}
            class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите криптовалюту</option>
            <For each={tokens}>
              {(token) => (
                <option value={token.id}>{token.name} ({token.symbol})</option>
              )}
            </For>
          </select>
        </div>

        {/* Название алерта */}
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Название алерта *
          </label>
          <input
            type="text"
            value={alertData().name}
            onInput={(e) => setAlertData({ ...alertData(), name: e.target.value })}
            placeholder="Например: Bitcoin выше $50000"
            class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Режим Custom - дополнительные настройки */}
        <Show when={mode() === 'custom'}>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Описание
            </label>
            <textarea
              value={alertData().description}
              onInput={(e) => setAlertData({ ...alertData(), description: e.target.value })}
              placeholder="Описание алерта"
              rows="2"
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Тип алерта */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Тип алерта
            </label>
            <select
              value={alertData().type}
              onInput={(e) => setAlertData({ ...alertData(), type: e.target.value })}
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={AlertType.PRICE_ABSOLUTE}>Абсолютная цена</option>
              <option value={AlertType.PRICE_PERCENTAGE}>Процентное изменение</option>
              <option value={AlertType.PRICE_ATH}>Новый максимум (ATH)</option>
              <option value={AlertType.PRICE_ATL}>Новый минимум (ATL)</option>
              <option value={AlertType.VOLUME_ABSOLUTE}>Объем торгов</option>
              <option value={AlertType.VOLUME_SPIKE}>Всплеск объема</option>
              <option value={AlertType.MARKET_CAP}>Капитализация</option>
              <option value={AlertType.RANK_CHANGE}>Изменение рейтинга</option>
            </select>
          </div>

          {/* Условия */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Условия срабатывания
            </label>
            <For each={alertData().conditions}>
              {(condition, index) => (
                <div class="flex gap-2 mb-2">
                  <select
                    value={condition.operator}
                    onInput={(e) => updateCondition(index(), 'operator', e.target.value)}
                    class="bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="above">Выше</option>
                    <option value="below">Ниже</option>
                    <option value="equals">Равно</option>
                    <option value="increases_by">Увеличивается на</option>
                    <option value="decreases_by">Уменьшается на</option>
                  </select>
                  
                  <input
                    type="number"
                    step="any"
                    value={condition.value}
                    onInput={(e) => updateCondition(index(), 'value', e.target.value)}
                    placeholder="Значение"
                    class="flex-1 bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <Show when={alertData().conditions.length > 1}>
                    <button
                      onClick={() => removeCondition(index())}
                      class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </Show>
                </div>
              )}
            </For>
            
            <button
              onClick={addCondition}
              class="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              + Добавить условие
            </button>
          </div>

          {/* Приоритет */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Приоритет
            </label>
            <select
              value={alertData().priority}
              onInput={(e) => setAlertData({ ...alertData(), priority: e.target.value })}
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="critical">🔴 Критический</option>
              <option value="high">🟠 Важный</option>
              <option value="medium">🟡 Средний</option>
              <option value="low">🟢 Информационный</option>
            </select>
          </div>

          {/* Временной фрейм */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Временной период
            </label>
            <select
              value={alertData().timeFrame}
              onInput={(e) => setAlertData({ ...alertData(), timeFrame: e.target.value })}
              class="w-full bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={TimeFrame.MINUTE_5}>5 минут</option>
              <option value={TimeFrame.MINUTE_15}>15 минут</option>
              <option value={TimeFrame.HOUR_1}>1 час</option>
              <option value={TimeFrame.HOUR_4}>4 часа</option>
              <option value={TimeFrame.HOUR_24}>24 часа</option>
              <option value={TimeFrame.DAY_7}>7 дней</option>
              <option value={TimeFrame.DAY_30}>30 дней</option>
            </select>
          </div>
        </Show>

        {/* Для шаблонов - параметры */}
        <Show when={mode() === 'template' && selectedTemplate()}>
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div class="text-sm text-gray-300 mb-3">
              📝 Параметры для шаблона: <span class="font-semibold">{selectedTemplate()?.template.name}</span>
            </div>
            
            <For each={alertData().conditions}>
              {(condition, index) => (
                <div class="flex gap-2 mb-2">
                  <select
                    value={condition.operator}
                    onInput={(e) => updateCondition(index(), 'operator', e.target.value)}
                    class="bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="above">Выше</option>
                    <option value="below">Ниже</option>
                    <option value="increases_by">Рост на</option>
                    <option value="decreases_by">Падение на</option>
                  </select>
                  
                  <input
                    type="number"
                    step="any"
                    value={condition.value}
                    onInput={(e) => updateCondition(index(), 'value', e.target.value)}
                    placeholder="Значение"
                    class="flex-1 bg-dark-bg border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Кнопки действий */}
      <div class="flex gap-4 mt-6">
        <button
          onClick={handleCreateAlert}
          class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          ✅ Создать алерт
        </button>
        <button
          onClick={onCancel}
          class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
