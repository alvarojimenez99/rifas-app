import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const FeaturesSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('grana-features-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.grana-feature-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'Participação Fácil',
      description: 'Escolha seus números favoritos e concorra a prêmios incríveis em poucos cliques.'
    },
    {
      icon: '💳',
      title: 'Pagamento Seguro',
      description: 'Pague com PIX, cartão de crédito ou transferência bancária com total segurança.'
    },
    {
      icon: '🎲',
      title: 'Sorteios Transparentes',
      description: 'Acompanhe os sorteios ao vivo com total transparência e credibilidade.'
    },
    {
      icon: '📱',
      title: '100% Responsivo',
      description: 'Participe de qualquer lugar, direto do seu celular, tablet ou computador.'
    },
    {
      icon: '🔔',
      title: 'Notificações em Tempo Real',
      description: 'Receba alertas sobre novos sorteios e resultados diretamente no seu email.'
    },
    {
      icon: '🏆',
      title: 'Prêmios Incríveis',
      description: 'Concorra a prêmios que mudam vidas: iPhones, TVs, viagens e muito mais.'
    }
  ];

  const benefits = [
    {
      icon: '💰',
      title: 'Prêmios Valiosos',
      description: 'Rifas com prêmios exclusivos e de alto valor.'
    },
    {
      icon: '⭐',
      title: 'Credibilidade',
      description: 'Sorteios ao vivo e resultados verificáveis.'
    },
    {
      icon: '📈',
      title: 'Acompanhamento Fácil',
      description: 'Acompanhe seus números e sorteios em um só lugar.'
    },
    {
      icon: '🎮',
      title: 'Diversão Garantida',
      description: 'A emoção de concorrer a prêmios incríveis.'
    }
  ];

  return (
    <section className="grana-features" ref={sectionRef}>
      <div className="grana-features-container">
        {/* Header */}
        <div className="grana-features-header">
          <span className="grana-features-badge">✨ Por que Peleleca?</span>
          <h2 className="grana-features-title">
            Por que escolher a <span>Peleleca</span>?
          </h2>
          <p className="grana-features-subtitle">
            Tudo o que você precisa para participar de rifas profissionais de forma simples e segura.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grana-features-grid">
          {features.map((feature, index) => (
            <div key={index} className="grana-feature-card">
              <div className="grana-feature-icon-wrapper">
                <div className="grana-feature-icon">{feature.icon}</div>
              </div>
              <h3 className="grana-feature-title">{feature.title}</h3>
              <p className="grana-feature-description">{feature.description}</p>
              <div className="grana-feature-glow"></div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grana-benefits">
          <h3 className="grana-benefits-title">
            Vantagens de participar com a <span>Peleleca</span>
          </h3>
          <div className="grana-benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="grana-benefit-card">
                <div className="grana-benefit-icon">{benefit.icon}</div>
                <div className="grana-benefit-content">
                  <h4>{benefit.title}</h4>
                  <p>{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="grana-features-trust">
          <div className="grana-trust-item">
            <span className="grana-trust-icon">🔒</span>
            <span>Pagamento Seguro</span>
          </div>
          <div className="grana-trust-item">
            <span className="grana-trust-icon">⚡</span>
            <span>PIX Instantâneo</span>
          </div>
          <div className="grana-trust-item">
            <span className="grana-trust-icon">🎯</span>
            <span>Sorteios Ao Vivo</span>
          </div>
          <div className="grana-trust-item">
            <span className="grana-trust-icon">📱</span>
            <span>100% Responsivo</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;