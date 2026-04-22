import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  // Animação ao fazer scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('grana-steps-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.grana-step-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: '1',
      icon: '📝',
      title: 'Cadastre-se',
      description: 'Crie sua conta gratuitamente em menos de 1 minuto. Basta informar seu nome, e-mail e telefone.'
    },
    {
      number: '2',
      icon: '🎟️',
      title: 'Escolha sua rifa',
      description: 'Navegue pelas rifas disponíveis, veja os prêmios e escolha os números da sua sorte.'
    },
    {
      number: '3',
      icon: '💳',
      title: 'Pague com segurança',
      description: 'Realize o pagamento via PIX, cartão de crédito ou transferência bancária de forma 100% segura.'
    },
    {
      number: '4',
      icon: '🎲',
      title: 'Acompanhe o sorteio',
      description: 'Assista ao sorteio ao vivo e confira se você foi o grande vencedor!'
    }
  ];

  return (
    <section className="grana-steps" ref={sectionRef}>
      <div className="grana-steps-container">
        {/* Header */}
        <div className="grana-steps-header">
          <span className="grana-steps-badge">🚀 Como funciona</span>
          <h2 className="grana-steps-title">
            Participe em <span>4 passos simples</span>
          </h2>
          <p className="grana-steps-subtitle">
            Criamos rifas exclusivas para você. Escolha seus números, pague e concorra a prêmios incríveis.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grana-steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="grana-step-card">
              <div className="grana-step-number-wrapper">
                <div className="grana-step-number">{step.number}</div>
                <div className="grana-step-icon">{step.icon}</div>
              </div>
              <h3 className="grana-step-title">{step.title}</h3>
              <p className="grana-step-description">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="grana-step-connector">
                  <span className="grana-step-arrow">→</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Extra Info */}
        <div className="grana-steps-extra">
          <div className="grana-steps-extra-card">
            <span className="grana-steps-extra-icon">🎯</span>
            <div>
              <h4>Sorteios ao vivo e transparentes</h4>
              <p>Todos os sorteios são realizados ao vivo com transmissão online. Resultados verificáveis e justos.</p>
            </div>
          </div>
          <div className="grana-steps-extra-card">
            <span className="grana-steps-extra-icon">🔒</span>
            <div>
              <h4>Pagamentos 100% seguros</h4>
              <p>Utilizamos PIX, cartão de crédito e transferências bancárias com criptografia de ponta a ponta.</p>
            </div>
          </div>
          <div className="grana-steps-extra-card">
            <span className="grana-steps-extra-icon">📱</span>
            <div>
              <h4>Acompanhe pelo celular</h4>
              <p>Plataforma 100% responsiva. Participe de qualquer lugar, direto do seu smartphone.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;