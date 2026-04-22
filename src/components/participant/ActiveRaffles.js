import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rifasService } from '../../services/api';

const ActiveRaffles = () => {
  const navigate = useNavigate();
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    orderBy: 'recent'
  });

  useEffect(() => {
    loadRifas();
  }, [filters.search, filters.orderBy]);

  const loadRifas = async () => {
    try {
      setLoading(true);
      const response = await rifasService.getPublicRifas();
      setRifas(response.rifas || []);
    } catch (error) {
      console.error('Error cargando rifas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const diasRestantes = (dataFim) => {
    if (!dataFim) return '—';
    const hoje = new Date();
    const fim = new Date(dataFim);
    const diff = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const calcularProgresso = (vendidos, total) => {
    if (!total || total === 0) return 0;
    return Math.round((vendidos / total) * 100);
  };

  const filteredRifas = rifas.filter(rifa => {
    const matchesSearch = rifa.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
                          rifa.descricao?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const sortedRifas = [...filteredRifas].sort((a, b) => {
    if (filters.orderBy === 'recent') {
      return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    }
    if (filters.orderBy === 'price_asc') {
      return a.precio - b.precio;
    }
    if (filters.orderBy === 'price_desc') {
      return b.precio - a.precio;
    }
    return 0;
  });

  const handleViewDetails = (rifaId) => {
    navigate(`/public/${rifaId}`);
  };

  if (loading) {
    return (
      <div className="participant-loading">
        <div className="loading-spinner"></div>
        <p>Carregando rifas disponíveis...</p>
      </div>
    );
  }

  return (
    <div className="active-raffles">
      <div className="raffles-header">
        <h2>🎯 Sorteios</h2>
        <p>Participe das rifas ativas ou confira os resultados das rifas finalizadas</p>
      </div>

      <div className="raffles-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar rifa..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <select
          value={filters.orderBy}
          onChange={(e) => setFilters({...filters, orderBy: e.target.value})}
        >
          <option value="recent">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>

      {sortedRifas.length === 0 ? (
        <div className="no-raffles">
          <span className="no-raffles-icon">🎯</span>
          <h3>Nenhuma rifa encontrada</h3>
          <p>Fique ligado! Novas rifas serão lançadas em breve.</p>
        </div>
      ) : (
        <div className="raffles-grid">
          {sortedRifas.map(rifa => {
            const progresso = calcularProgresso(rifa.elementos_vendidos || 0, rifa.cantidad_elementos);
            const dias = diasRestantes(rifa.fecha_fin);
            const premioPrincipal = rifa.premios && rifa.premios.length > 0 ? rifa.premios[0].nombre : rifa.nombre;
            const isActive = rifa.activa && new Date(rifa.fecha_fin) > new Date();
            const isFinished = rifa.resultado_publicado || (!isActive && rifa.numero_ganador);
            
            return (
              <div key={rifa.id} className={`participant-raffle-card ${!isActive ? 'finished' : ''}`}>
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
                  {isActive && dias <= 3 && dias > 0 && (
                    <div className="urgent-badge">🔥 Últimas horas!</div>
                  )}
                  {isFinished && (
                    <div className="finished-badge">🏆 Finalizada</div>
                  )}
                </div>

                <div className="raffle-card-content">
                  <h3 className="raffle-card-title">{rifa.nombre}</h3>
                  <p className="raffle-card-description">
                    {rifa.descricao?.substring(0, 80)}...
                  </p>

                  <div className="raffle-card-prize">
                    <span className="prize-icon">🏆</span>
                    <span className="prize-name">{premioPrincipal}</span>
                  </div>

                  {isActive && (
                    <>
                      <div className="raffle-card-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progresso}%` }}></div>
                        </div>
                        <div className="progress-stats">
                          <span>{rifa.elementos_vendidos || 0} vendidos</span>
                          <span>{rifa.cantidad_elementos - (rifa.elementos_vendidos || 0)} disponíveis</span>
                        </div>
                      </div>

                      <div className="raffle-card-info">
                        <div className="info-item">
                          <span className="info-label">💵 Bilhete</span>
                          <span className="info-value">{formatCurrency(rifa.precio)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">⏰ Restam</span>
                          <span className="info-value">{dias} dias</span>
                        </div>
                      </div>
                    </>
                  )}

                  {isFinished && rifa.numero_ganador && (
                    <div className="raffle-card-winner">
                      <span>🏆 Número ganador:</span>
                      <strong>{rifa.numero_ganador}</strong>
                    </div>
                  )}

                  <div className="raffle-card-actions">
                    <button 
                      className="btn-view"
                      onClick={() => handleViewDetails(rifa.id)}
                    >
                      {isActive ? '🔍 Ver detalhes' : '📋 Ver resultado'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveRaffles;