import React, { useState, useEffect } from 'react';
import SEO from './SEO';
import analytics from '../services/analytics';
import HeroSection from './landing/HeroSection';
import AboutSection from './landing/AboutSection';
import FeaturesSection from './landing/FeaturesSection';
import HowItWorksSection from './landing/HowItWorksSection';
import CTASection from './landing/CTASection';
import FeaturedRaffles from './landing/FeaturedRaffles';
import ScrollToTop from './ScrollToTop';
import AuthModal from './AuthModal';
import './LandingPage.css';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleShowRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleShowLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Gerenciar eventos de modais de outros componentes
  useEffect(() => {
    const handleShowRegister = () => {
      setAuthMode('register');
      setShowAuthModal(true);
    };
    const handleShowLogin = () => {
      setAuthMode('login');
      setShowAuthModal(true);
    };
    
    window.addEventListener('showRegisterModal', handleShowRegister);
    window.addEventListener('showLoginModal', handleShowLogin);
    
    return () => {
      window.removeEventListener('showRegisterModal', handleShowRegister);
      window.removeEventListener('showLoginModal', handleShowLogin);
    };
  }, []);

  // Rastrear visualização da página
  useEffect(() => {
    analytics.trackPageView('Landing Page');
  }, []);

  return (
    <div className="landing-page">
      <SEO 
        title="Peleleca - Sua chance de ganhar prêmios incríveis"
        description="Participe de rifas online seguras e concorra a prêmios que mudam vidas. Escolha seus números, pague com PIX e acompanhe os sorteios ao vivo."
        keywords="rifas, sorteios, prêmios, ganhar dinheiro, rifa online, PIX, prêmios incríveis"
      />
      
      <HeroSection 
        onShowRegister={handleShowRegister}
        onShowLogin={handleShowLogin}
      />
      
      <FeaturedRaffles />
      
      <AboutSection />
      
      <FeaturesSection />
      
      <HowItWorksSection />
      
      <CTASection onShowRegister={handleShowRegister} />

      {/* Botão Scroll to Top */}
      <ScrollToTop />

      {/* Modal de autenticação */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;