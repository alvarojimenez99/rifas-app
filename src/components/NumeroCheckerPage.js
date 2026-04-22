import React from 'react';
import NumeroChecker from './NumeroChecker';
import AdBanner from './AdBanner';
import SEO from './SEO';
import './NumeroCheckerPage.css';

const NumeroCheckerPage = () => {
  return (
    <div className="consulta-ganadores-page">
      <SEO 
        title="Consultar Ganhadores - Peleleca"
        description="Verifique se você foi o grande vencedor das nossas rifas. Digite o número da rifa e o número do bilhete."
        keywords="consultar ganhadores, verificar número, rifas, sorteios, resultados, verificar bilhete"
      />
      
      {/* Hero Section */}
      <section className="consulta-hero">
        <div className="consulta-hero-content">
          <div className="consulta-hero-icon">🏆</div>
          <h1 className="consulta-hero-title">
            Consultar <span className="highlight-orange">Ganhadores</span>
          </h1>
          <p className="consulta-hero-description">
            Verifique se você foi o grande vencedor
            <br />
            Digite o número da rifa e o número do bilhete para saber se você ganhou
          </p>
        </div>
      </section>

      {/* Main Content - Wizard */}
      

      {/* Banner publicitário inferior */}
      
    </div>
  );
};

export default NumeroCheckerPage;