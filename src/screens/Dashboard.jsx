import { createSignal } from 'solid-js';
import { HeroSection } from '../sections/HeroSection';
import { LivePricesSection } from '../sections/LivePricesSection';
import { AlertsSection } from '../sections/AlertsSection';
import { AdvancedAlertsSection } from '../sections/AdvancedAlertsSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { StatsSection } from '../sections/StatsSection';
import { NetworkStatus } from '../components/NetworkStatus';
import { AdvancedPriceBoard } from '../components/AdvancedPriceBoard';
import { EducationPortal } from '../components/EducationPortal';
import { NewsAndBenefits } from '../components/NewsAndBenefits';
import { PricingBanner } from '../components/PricingBanner';
import { SiteFooter } from '../components/SiteFooter';

export function Dashboard({ 
  tokens, 
  livePrices, 
  lastUpdated,
  alerts, 
  newAlert, 
  setNewAlert, 
  addAlert, 
  removeAlert,
  isOnline,
  user
}) {
  // Состояние для продвинутых алертов
  const [advancedAlerts, setAdvancedAlerts] = createSignal([]);

  // Обработчики для продвинутых алертов
  const handleCreateAdvancedAlert = (alertData) => {
    const newAlert = {
      ...alertData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isPaused: false,
      triggeredCount: 0,
      lastTriggered: null
    };
    setAdvancedAlerts([...advancedAlerts(), newAlert]);
  };

  const handleUpdateAdvancedAlert = (alertId, updates) => {
    setAdvancedAlerts(
      advancedAlerts().map(alert =>
        alert.id === alertId
          ? { ...alert, ...updates, updatedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  const handleDeleteAdvancedAlert = (alertId) => {
    setAdvancedAlerts(advancedAlerts().filter(alert => alert.id !== alertId));
  };

  const handlePauseAdvancedAlert = (alertId) => {
    handleUpdateAdvancedAlert(alertId, { isPaused: true });
  };

  const handleResumeAdvancedAlert = (alertId) => {
    handleUpdateAdvancedAlert(alertId, { isPaused: false });
  };

  return (
    <>
      <HeroSection />
      
      {/* Баннер с ценами */}
      <PricingBanner user={user} />
      
      {/* Расширенное табло курсов */}
      <AdvancedPriceBoard 
        tokens={tokens}
        livePrices={livePrices}
        lastUpdated={lastUpdated}
      />
      
      <AlertsSection 
        alerts={alerts}
        tokens={tokens}
        livePrices={livePrices}
        newAlert={newAlert}
        setNewAlert={setNewAlert}
        addAlert={addAlert}
        removeAlert={removeAlert}
        user={user}
      />
      
      {/* Продвинутые алерты */}
      <div class="mb-12">
        <AdvancedAlertsSection
          alerts={advancedAlerts}
          tokens={tokens}
          livePrices={livePrices}
          onCreateAlert={handleCreateAdvancedAlert}
          onUpdateAlert={handleUpdateAdvancedAlert}
          onDeleteAlert={handleDeleteAdvancedAlert}
          onPauseAlert={handlePauseAdvancedAlert}
          onResumeAlert={handleResumeAdvancedAlert}
        />
      </div>
      
      {/* Образовательный портал */}
      <EducationPortal userSubscription={user?.subscription || 'free'} />
      
      {/* Новости и преимущества */}
      <NewsAndBenefits userSubscription={user?.subscription || 'free'} />
      
      <FeaturesSection />
      <StatsSection />
      <NetworkStatus isOnline={isOnline} />
      
      {/* Футер сайта */}
      <SiteFooter />
    </>
  );
}