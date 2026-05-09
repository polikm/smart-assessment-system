import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import AIAgentsSection from '../components/landing/AIAgentsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <AIAgentsSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
