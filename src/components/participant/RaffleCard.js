import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RaffleCard = ({ rifa, onParticipate }) => {
  const { isAuthenticated } = useAuth();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calcularProgresso = (vendidos, total) => {
    if (!total || total === 0) return 0;
    return Math.round((vendidos / total) * 100);
  };

  const diasRestantes = (dataFim) => {
    if (!dataFim) return '—';
    const hoje = new Date();
    const fim = new Date(dataFim);
    const diff = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="participant-raffle-card">
      <div className="raffle-card-image">
        {rifa.imagen_url ? (
          <img src={rifa.imagen_url} alt={rifa.nombre} />
        ) : (
          <div className="raffle-card-placeholder">
            <span>🎁</span>
          </div>
        )}
        {rifa.videoUrl && (
          <div className="video-badge">🎬 Vídeo</div>
        )}
        {rifa.dias_restantes <= 3 && rifa.dias_restantes > 0 && (
          <div className="urgent-badge">🔥 Últimas horas!</div>
        )}
      </div>

      <div className="raffle-card-content">
        <h3 className="raffle-card-title">{rifa.nombre}</h3>
        <p className="raffle-card-description">{rifa.descripcion?.substring(0, 80)}...</p>

        {/* Premio principal */}
        {rifa.premios && rifa.premios.length > 0 && (
          <div className="raffle-card-prize">
            <span className="prize-icon">🏆</span>
            <span className="prize-name">{rifa.premios[0].nombre}</span>
          </div>
        )}

        {/* Progreso */}
        <div className="raffle-card-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${calcularProgresso(rifa.elementos_vendidos || 0, rifa.cantidad_elementos)}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            <span>{rifa.elementos_vendidos || 0} vendidos</span>
            <span>{rifa.cantidad_elementos - (rifa.elementos_vendidos || 0)} disponíveis</span>
          </div>
        </div>

        {/* Info rápida */}
        <div className="raffle-card-info">
          <div className="info-item">
            <span className="info-label">💵 Bilhete</span>
            <span className="info-value">{formatCurrency(rifa.precio)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">⏰ Restam</span>
            <span className="info-value">{diasRestantes(rifa.fecha_fin)} dias</span>
          </div>
        </div>

        {/* Botones */}
        <div className="raffle-card-actions">
          <Link to={`/public/${rifa.id}`} className="btn-view">
            Ver detalhes
          </Link>
          {isAuthenticated && (
            <button 
              onClick={() => onParticipate(rifa)} 
              className="btn-participate"
              disabled={rifa.elementos_disponibles <= 0}
            >
              🎯 Participar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaffleCard;