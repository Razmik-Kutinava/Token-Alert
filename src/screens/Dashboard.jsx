import { HeroSection } from '../sections/HeroSection';
import { LivePricesSection } from '../sections/LivePricesSection';
import { AlertsSection } from '../sections/AlertsSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { StatsSection } from '../sections/StatsSection';
import { NetworkStatus } from '../components/NetworkStatus';

export function Dashboard({ 
  tokens, 
  livePrices, 
  lastUpdated,
  alerts, 
  newAlert, 
  setNewAlert, 
  addAlert, 
  removeAlert,
  isOnline 
}) {
  return (
    <>
      <HeroSection />
      <LivePricesSection 
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
      />
      <FeaturesSection />
      <StatsSection />
      <NetworkStatus isOnline={isOnline} />
    </>
  );
}