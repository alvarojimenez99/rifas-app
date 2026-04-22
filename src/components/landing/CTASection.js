import React from 'react';
import { useTranslation } from 'react-i18next';

const CTASection = ({ onShowRegister }) => {
  const { t } = useTranslation();

  return (
    <section className="grana-cta">
      <div className="grana-cta-container">
        <div className="grana-cta-content">
          <div className="grana-cta-text">
            <span className="grana-cta-badge">🎰 Participe Agora</span>
            <h2 className="grana-cta-title">
              Sua chance de <span>ganhar prêmios incríveis</span> está aqui!
            </h2>
            <p className="grana-cta-description">
              Rifas exclusivas criadas por nossa equipe. Escolha seus números, 
              pague de forma segura e concorra a prêmios que vão mudar sua vida.
            </p>
            <div className="grana-cta-buttons">
              <button className="grana-cta-btn-primary" onClick={onShowRegister}>
                <span>Cadastre-se agora</span>
                <span className="grana-cta-arrow">→</span>
              </button>
              <a href="/portal" className="grana-cta-btn-secondary">
                <span>Ver rifas disponíveis</span>
                <span className="grana-cta-arrow">🎟️</span>
              </a>
            </div>
            <div className="grana-cta-trust">
              <span>🔒 Pagamento 100% seguro</span>
              <span>⚡ Resultados transparentes</span>
              <span>🎯 Sorteios ao vivo</span>
            </div>
          </div>
          <div className="grana-cta-image">
            <div className="grana-cta-card">
              <div className="grana-cta-card-header">
                <span>🔥 Rifa em destaque</span>
              </div>
              <div className="grana-cta-card-content">
                <div className="grana-cta-card-prize">🏆 iPhone 15 Pro Max</div>
                <div className="grana-cta-card-numbers">
                  <span>Números disponíveis: 47</span>
                  <span>Valor: R$ 10,00</span>
                </div>
                <div className="grana-cta-card-progress">
                  <div className="grana-cta-progress-bar" style={{ width: '53%' }}></div>
                  <span>53% vendido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;