import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rifasService } from '../../services/api';

const HeroSection = ({ onShowRegister, onShowLogin }) => {
  const navigate = useNavigate();
  const [currentRifaIndex, setCurrentRifaIndex] = useState(0);
  const [rifasActivas, setRifasActivas] = useState([]);
  const [animating, setAnimating] = useState(false);

  // Carregar rifas ativas reais
  useEffect(() => {
    const carregarRifasAtivas = async () => {
      try {
        const response = await rifasService.getPublicRifas();
        const rifas = response.rifas || [];
        
        const rifasFormatadas = rifas
          .filter(rifa => rifa.activa && new Date(rifa.fecha_fin) > new Date())
          .slice(0, 10)
          .map(rifa => {
            const fechaFin = new Date(rifa.fecha_fin);
            const agora = new Date();
            const diasRestantes = Math.ceil((fechaFin - agora) / (1000 * 60 * 60 * 24));
            
            const premioPrincipal = rifa.premios && rifa.premios.length > 0 
              ? rifa.premios[0].nombre 
              : rifa.nombre;
            
            const totalNumeros = rifa.numerosDisponiveis?.length || rifa.cantidad_elementos || 0;
            const vendidos = rifa.numerosVendidos?.length || 0;
            const reservados = rifa.numerosReservados?.length || 0;
            const disponiveis = totalNumeros - vendidos - reservados;
            
            return {
              id: rifa.id,
              nome: rifa.nombre,
              premio: premioPrincipal,
              disponiveis: disponiveis,
              dias: diasRestantes,
              preco: parseFloat(rifa.precio) || 0
            };
          });
        
        setRifasActivas(rifasFormatadas);
      } catch (error) {
        console.error('Erro carregando rifas ativas:', error);
        setRifasActivas([
          { nome: "iPhone 15 Pro Max", premio: "iPhone 15 Pro Max 256GB", disponiveis: 47, dias: 12, preco: 50 }
        ]);
      }
    };

    carregarRifasAtivas();
  }, []);

  const rifasExemplo = rifasActivas.length > 0 ? rifasActivas : [
    { nome: "Carregando...", premio: "Aguarde", disponiveis: 0, dias: 0, preco: 0 }
  ];

  useEffect(() => {
    if (rifasExemplo.length === 0) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentRifaIndex((prevIndex) => (prevIndex + 1) % rifasExemplo.length);
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [rifasExemplo.length]);

  return (
    <section className="grana-hero">
      {/* Background Pattern */}
      <div className="grana-hero-bg">
        <div className="grana-hero-bg-gradient"></div>
        <div className="grana-hero-bg-pattern"></div>
      </div>

      <div className="grana-hero-container">
        <div className="grana-hero-left">
          {/* Badge */}
          <div className="grana-hero-badge">
            <span className="grana-hero-badge-icon">⚡</span>
            <span>Plataforma #1 do Brasil</span>
          </div>

          {/* Title */}
          <h1 className="grana-hero-title">
            <span className="grana-hero-title-gradient">Pele</span>
            <span className="grana-hero-title-gold">leca</span>
          </h1>
          <p className="grana-hero-subtitle">
            Sua chance de transformar sonhos em realidade
          </p>
          <p className="grana-hero-description">
            Crie, compartilhe e participe de rifas online de forma segura e transparente. 
            Milhares de pessoas já estão realizando seus sonhos com a Peleleca.
          </p>

          {/* Stats */}
          <div className="grana-hero-stats">
            <div className="grana-hero-stat">
              <span className="grana-hero-stat-number">+50.000</span>
              <span className="grana-hero-stat-label">Participantes</span>
            </div>
            <div className="grana-hero-stat">
              <span className="grana-hero-stat-number">+R$2M</span>
              <span className="grana-hero-stat-label">Em prêmios</span>
            </div>
            <div className="grana-hero-stat">
              <span className="grana-hero-stat-number">98%</span>
              <span className="grana-hero-stat-label">Satisfação</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grana-hero-buttons">
            <button className="grana-btn-primary" onClick={onShowRegister}>
              <span>Criar minha conta</span>
              <span className="grana-btn-icon">→</span>
            </button>
            <button className="grana-btn-outline" onClick={onShowLogin}>
              <span>Já tenho conta</span>
              <span className="grana-btn-icon">🔑</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grana-hero-trust">
            <span>Pagamento 100% seguro via</span>
            <div className="grana-hero-payment-icons">
              <span>PIX</span>
              <span>💳</span>
              <span>🏦</span>
            </div>
          </div>
        </div>

        <div className="grana-hero-right">
          <div className="grana-hero-card">
            <div className="grana-hero-card-glow"></div>
            <div className="grana-hero-card-header">
              <div className="grana-hero-card-header-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="grana-hero-card-badge">🔥 Rifa em destaque</span>
            </div>
            
            <div className={`grana-hero-card-content ${animating ? 'grana-card-exit' : 'grana-card-enter'}`}>
              {rifasExemplo.length > 0 && rifasExemplo[currentRifaIndex] ? (
                <>
                  <div className="grana-hero-card-prize-icon">🎁</div>
                  <h3 className="grana-hero-card-title">{rifasExemplo[currentRifaIndex].premio}</h3>
                  <p className="grana-hero-card-raffle">{rifasExemplo[currentRifaIndex].nome}</p>
                  
                  <div className="grana-hero-card-stats">
                    <div className="grana-hero-card-stat">
                      <span className="grana-hero-card-stat-label">Disponíveis</span>
                      <span className="grana-hero-card-stat-value">{rifasExemplo[currentRifaIndex].disponiveis}</span>
                    </div>
                    <div className="grana-hero-card-stat">
                      <span className="grana-hero-card-stat-label">Dias restantes</span>
                      <span className="grana-hero-card-stat-value grana-dias">{rifasExemplo[currentRifaIndex].dias}</span>
                    </div>
                  </div>

                  <div className="grana-hero-card-price">
                    <span className="grana-hero-card-price-label">Valor do bilhete</span>
                    <div className="grana-hero-card-price-value">
                      <span className="grana-hero-card-price-currency">R$</span>
                      <span>{rifasExemplo[currentRifaIndex].preco.toFixed(2)}</span>
                    </div>
                  </div>

                  {rifasExemplo[currentRifaIndex].id && (
                    <Link 
                      to={`/public/${rifasExemplo[currentRifaIndex].id}`}
                      className="grana-hero-card-btn"
                    >
                      Ver rifa
                      <span>→</span>
                    </Link>
                  )}
                </>
              ) : (
                <div className="grana-hero-card-loading">
                  <div className="grana-loader"></div>
                  <p>Carregando rifas...</p>
                </div>
              )}
            </div>

            <div className="grana-hero-card-indicators">
              {rifasExemplo.map((_, index) => (
                <button
                  key={index}
                  className={`grana-indicator ${index === currentRifaIndex ? 'active' : ''}`}
                  onClick={() => {
                    setAnimating(true);
                    setTimeout(() => {
                      setCurrentRifaIndex(index);
                      setAnimating(false);
                    }, 300);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;