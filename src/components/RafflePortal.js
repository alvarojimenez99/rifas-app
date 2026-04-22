import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rifasService } from '../services/api';

const RafflePortal = () => {
  const navigate = useNavigate();
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('activas');

  const loadRifas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rifasService.getPublicRifas();
      let todasRifas = response.rifas || [];

      if (filtro === 'activas') {
        // Activas: activa = true, fecha_fin > hoy y resultado_publicado = false
        todasRifas = todasRifas.filter(
          r => r.activa === true && r.resultado_publicado === false && new Date(r.fecha_fin) > new Date()
        );
      } else if (filtro === 'finalizadas') {
        // Finalizadas: resultado_publicado = true o activa = false o fecha_fin vencida
        todasRifas = todasRifas.filter(
          r => r.resultado_publicado === true || r.activa === false || new Date(r.fecha_fin) <= new Date()
        );
      }
      // "todas" no filtra nada

      setRifas(todasRifas);
    } catch (error) {
      console.error('Error cargando rifas:', error);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    loadRifas();
  }, [loadRifas]);

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

  const handleViewDetails = (rifaId) => {
    navigate(`/public/${rifaId}`);
  };

  if (loading) {
    return (
      <div className="raffle-portal-loading">
        <div className="loading-spinner"></div>
        <p>Carregando rifas...</p>
      </div>
    );
  }

  return (
    <div className="raffle-portal-container">
      <div className="raffle-portal-header">
        <h1>🎟️ Rifas Disponíveis</h1>
        <p>Participe das rifas ativas ou confira os resultados das rifas finalizadas</p>
      </div>

      <div className="raffle-portal-filters">
        <button
          className={`filter-btn ${filtro === 'activas' ? 'active' : ''}`}
          onClick={() => setFiltro('activas')}
        >
          🎯 Ativas
        </button>
        <button
          className={`filter-btn ${filtro === 'finalizadas' ? 'active' : ''}`}
          onClick={() => setFiltro('finalizadas')}
        >
          🏆 Finalizadas
        </button>
        <button
          className={`filter-btn ${filtro === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          📋 Todas
        </button>
      </div>

      {rifas.length === 0 ? (
        <div className="raffle-portal-empty">
          <span className="empty-icon">🎯</span>
          <h3>Nenhuma rifa encontrada</h3>
          <p>Não há rifas disponíveis no momento.</p>
        </div>
      ) : (
        <div className="raffle-portal-grid">
          {rifas.map(rifa => {
            const isActive = rifa.activa === true && rifa.resultado_publicado === false && new Date(rifa.fecha_fin) > new Date();
            const premioPrincipal = rifa.premios && rifa.premios.length > 0 ? rifa.premios[0].nombre : rifa.nombre;

            return (
              <div key={rifa.id} className={`raffle-portal-card ${!isActive ? 'finished' : ''}`}>
                <div className="raffle-portal-card-image">
                  {rifa.imagen_url ? (
                    <img src={rifa.imagen_url} alt={rifa.nombre} />
                  ) : (
                    <div className="card-placeholder">🎁</div>
                  )}
                  <div className={`card-status ${isActive ? 'active' : 'finished'}`}>
                    {isActive ? '🟢 Ativa' : '🔴 Finalizada'}
                  </div>
                </div>

                <div className="raffle-portal-card-content">
                  <h3>{rifa.nombre}</h3>
                  <p className="card-description">{rifa.descricao?.substring(0, 80)}...</p>

                  <div className="card-prize">
                    <span>🏆</span>
                    <span>{premioPrincipal}</span>
                  </div>

                  {!isActive && rifa.numero_ganador && (
                    <div className="card-winner">
                      <span>🎉 Número ganador:</span>
                      <strong>{rifa.numero_ganador}</strong>
                    </div>
                  )}

                  <div className="card-info">
                    <div className="info-item">
                      <span>💵 Preço</span>
                      <strong>{formatCurrency(rifa.precio)}</strong>
                    </div>
                    <div className="info-item">
                      <span>📅 Sorteio</span>
                      <strong>{formatDate(rifa.fecha_sorteo)}</strong>
                    </div>
                  </div>

                  <button
                    className="card-btn"
                    onClick={() => handleViewDetails(rifa.id)}
                  >
                    {isActive ? '🎯 Ver detalhes' : '📋 Ver resultado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RafflePortal;