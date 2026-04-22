import React from 'react';
import { useTranslation } from 'react-i18next';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section className="grana-about">
      <div className="grana-about-container">
        <div className="grana-about-header">
          <span className="grana-about-badge">Quem somos</span>
          <h2 className="grana-about-title">
            Transformando <span>sonhos</span> em realidade
          </h2>
          <p className="grana-about-subtitle">
            A plataforma que conecta criadores de rifas a participantes de forma 
            segura, transparente e profissional.
          </p>
        </div>

        <div className="grana-about-stats">
          <div className="grana-stat-card">
            <div className="grana-stat-number">+50.000</div>
            <div className="grana-stat-label">Participantes felizes</div>
          </div>
          <div className="grana-stat-card">
            <div className="grana-stat-number">+R$2M</div>
            <div className="grana-stat-label">Em prêmios distribuídos</div>
          </div>
          <div className="grana-stat-card">
            <div className="grana-stat-number">98%</div>
            <div className="grana-stat-label">Taxa de satisfação</div>
          </div>
          <div className="grana-stat-card">
            <div className="grana-stat-number">+1.000</div>
            <div className="grana-stat-label">Rifas realizadas</div>
          </div>
        </div>

        <div className="grana-about-audience">
          <h3 className="grana-audience-title">
            Para quem é a <span>Peleleca</span>?
          </h3>
          <div className="grana-audience-grid">
            <div className="grana-audience-card">
              <div className="grana-audience-icon">👨‍💼</div>
              <h4>Empreendedores</h4>
              <p>Crie rifas para alavancar seu negócio, aumentar vendas e engajar seus clientes de forma inovadora.</p>
            </div>
            <div className="grana-audience-card">
              <div className="grana-audience-icon">🤝</div>
              <h4>ONGs e Instituições</h4>
              <p>Arrecade fundos para causas importantes com total transparência e credibilidade perante seus doadores.</p>
            </div>
            <div className="grana-audience-card">
              <div className="grana-audience-icon">🏢</div>
              <h4>Empresas</h4>
              <p>Realize ações promocionais, sorteios de brindes e campanhas de marketing com resultados reais.</p>
            </div>
            <div className="grana-audience-card">
              <div className="grana-audience-icon">🎯</div>
              <h4>Influenciadores</h4>
              <p>Engaje sua audiência com rifas exclusivas, monetize seu conteúdo e ofereça prêmios incríveis.</p>
            </div>
          </div>
        </div>

        <div className="grana-mission">
          <div className="grana-mission-card">
            <div className="grana-mission-icon">🎯</div>
            <h4>Nossa Missão</h4>
            <p>Democratizar o acesso a rifas online, oferecendo uma plataforma segura e transparente que transforma oportunidades em realizações.</p>
          </div>
          <div className="grana-mission-card">
            <div className="grana-mission-icon">💚</div>
            <h4>Nossos Valores</h4>
            <p>Transparência, segurança, inovação e compromisso com a satisfação de criadores e participantes.</p>
          </div>
          <div className="grana-mission-card">
            <div className="grana-mission-icon">🌟</div>
            <h4>Nossa Visão</h4>
            <p>Ser a plataforma de rifas mais confiável e inovadora do Brasil, referência em tecnologia e experiência do usuário.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;