import { createSignal } from 'solid-js';
import { HeroSection } from '../sections/HeroSection';
import { LivePricesSection } from '../sections/LivePricesSection';
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
  isOnline,
  user
}) {
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