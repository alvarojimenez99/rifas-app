import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdvertisersSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="grana-ads-section">
      <div className="grana-ads-container">
        <div className="grana-ads-content">
          <span className="grana-ads-badge">📢 Publicidade</span>
          <h2 className="grana-ads-title">
            Divulgue sua marca na <span>Peleleca</span>
          </h2>
          <p className="grana-ads-description">
            Alcance milhares de participantes em todo o Brasil com anúncios segmentados 
            e aumente a visibilidade do seu negócio.
          </p>
          <div className="grana-ads-features">
            <div className="grana-ads-feature">
              <span>🎯</span>
              <span>Alcance direcionado</span>
            </div>
            <div className="grana-ads-feature">
              <span>📊</span>
              <span>Relatórios detalhados</span>
            </div>
            <div className="grana-ads-feature">
              <span>💳</span>
              <span>Pagamento por performance</span>
            </div>
          </div>
          <button 
            className="grana-ads-btn"
            onClick={() => navigate('/anunciantes?mode=register')}
          >
            <span>Anuncie agora</span>
            <span className="grana-ads-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdvertisersSection;