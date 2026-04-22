import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError, showConfirm } from '../utils/swal';

const RifaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rifa, setRifa] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [participantes, setParticipantes] = useState([]);
  const [ganadores, setGanadores] = useState([]);
  const [numerosVendidos, setNumerosVendidos] = useState([]);
  const [numerosDisponibles, setNumerosDisponibles] = useState([]);
  const [numeroGanador, setNumeroGanador] = useState('');
  const [publicando, setPublicando] = useState(false);

  // Función para traducir tipos de lotería
  const getLoteriaLabel = (tipo) => {
    const tipos = {
      federal: 'Loteria Federal',
      megasena: 'Mega-Sena',
      quina: 'Quina',
      lotofacil: 'Lotofácil',
      lotomania: 'Lotomania',
      duplasena: 'Dupla Sena',
      timemania: 'Timemania',
      diadesorte: 'Dia de Sorte'
    };
    return tipos[tipo] || tipo || '—';
  };

  // Función para encontrar al ganador correctamente
  const encontrarGanador = (participantesList, numeroGanadorValue) => {
    if (!participantesList || participantesList.length === 0 || !numeroGanadorValue) {
      return [];
    }
    
    const ganadoresList = participantesList.filter(p => {
      if (p.estado !== 'confirmado') return false;
      const numeros = p.numeros_seleccionados || [];
      return numeros.some(num => String(num) === String(numeroGanadorValue));
    });
    
    return ganadoresList;
  };

  // Cargar datos de la rifa
  const loadRifaData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rifas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        const rifaData = {
          ...data.rifa,
          loteriaTipo: data.rifa.loteria_tipo || data.rifa.loteriaTipo || '',
          numeroSorteio: data.rifa.numero_sorteio || data.rifa.numeroSorteio || '',
          pixKey: data.rifa.pix_key || data.rifa.pixKey || '',
          aceitaCartao: data.rifa.aceita_cartao || data.rifa.aceitaCartao || false,
          videoUrl: data.rifa.video_url || data.rifa.videoUrl || ''
        };
        
        setRifa(rifaData);
        const participantesList = data.rifa.participantes || [];
        setParticipantes(participantesList);
        setNumerosVendidos(data.rifa.numerosVendidos || []);
        setNumerosDisponibles(data.rifa.numerosDisponibles || []);
        setNumeroGanador(data.rifa.numero_ganador || '');
        
        if (data.rifa.numero_ganador && data.rifa.resultado_publicado) {
          const ganadoresList = encontrarGanador(participantesList, data.rifa.numero_ganador);
          setGanadores(ganadoresList);
        } else {
          setGanadores([]);
        }
      } else {
        showError('Erro', 'Não foi possível carregar a rifa');
        navigate('/rifas');
      }
    } catch (error) {
      console.error('Error cargando rifa:', error);
      showError('Erro', 'Erro ao carregar a rifa');
      navigate('/rifas');
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    if (token && id) {
      loadRifaData();
    }
  }, [id, token, loadRifaData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (!rifa) return null;
    if (rifa.resultado_publicado) {
      return <span className="status-badge finalized">✅ Finalizada</span>;
    }
    if (rifa.activa && new Date(rifa.fecha_fin) > new Date()) {
      return <span className="status-badge active">🟢 Ativa</span>;
    }
    return <span className="status-badge inactive">🔴 Encerrada</span>;
  };

  const publicarResultado = async () => {
    if (!numeroGanador.trim()) {
      showError('Erro', 'Digite o número ganador');
      return;
    }

    const confirmed = await showConfirm(
      'Publicar resultado',
      `Tem certeza que deseja publicar o número ${numeroGanador} como ganador?`,
      { confirmText: 'Publicar', confirmColor: '#00d26a' }
    );

    if (!confirmed) return;

    setPublicando(true);
    try {
      const response = await fetch(`${API_BASE}/rifas/${id}/resultado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          numero_ganador: numeroGanador,
          resultado_publicado: true
        })
      });

      if (response.ok) {
        showSuccess('Resultado publicado!', `Número ganador: ${numeroGanador}`);
        loadRifaData();
      } else {
        const error = await response.json();
        showError('Erro', error.error || 'Não foi possível publicar o resultado');
      }
    } catch (error) {
      console.error('Error publicando resultado:', error);
      showError('Erro', 'Erro ao publicar resultado');
    } finally {
      setPublicando(false);
    }
  };

  if (loading) {
    return (
      <div className="rifa-details-loading">
        <div className="loading-spinner"></div>
        <p>Carregando detalhes da rifa...</p>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="rifa-details-notfound">
        <h2>Rifa não encontrada</h2>
        <button onClick={() => navigate('/rifas')} className="btn-primary">
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="rifa-details-container">
      <div className="rifa-details-header">
        <button className="back-btn" onClick={() => navigate('/rifas')}>
          ← Voltar
        </button>
        <div className="rifa-title-section">
          <h1 className="rifa-title">{rifa.nombre}</h1>
          {getStatusBadge()}
        </div>
        <div className="rifa-actions">
          <button className="btn-edit" onClick={() => navigate(`/gestionar/${rifa.id}/editar`)}>
            ✏️ Editar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="rifa-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(rifa.precio)}</span>
            <span className="stat-label">Preço por número</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <span className="stat-value">{rifa.cantidad_elementos || rifa.total_numbers}</span>
            <span className="stat-label">Total de números</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{numerosVendidos.length}</span>
            <span className="stat-label">Números vendidos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{Math.round((numerosVendidos.length / (rifa.cantidad_elementos || rifa.total_numbers)) * 100)}%</span>
            <span className="stat-label">Vendido</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{participantes.length}</span>
            <span className="stat-label">Participantes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(rifa.total_recaudado || 0)}</span>
            <span className="stat-label">Total arrecadado</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rifa-tabs">
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>📋 Informações</button>
        <button className={`tab-btn ${activeTab === 'numbers' ? 'active' : ''}`} onClick={() => setActiveTab('numbers')}>🔢 Números</button>
        <button className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>👥 Participantes ({participantes.length})</button>
        <button className={`tab-btn ${activeTab === 'winners' ? 'active' : ''}`} onClick={() => setActiveTab('winners')}>🏆 Ganadores ({ganadores.length})</button>
        <button className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`} onClick={() => setActiveTab('draw')}>🎲 Sorteio</button>
      </div>

      {/* Tab Content */}
      <div className="rifa-tab-content">
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-section">
              <h3>Descrição</h3>
              <p>{rifa.descripcion || 'Sem descrição'}</p>
            </div>
            
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Categoria</span><span className="info-value">{rifa.categoria || '—'}</span></div>
              <div className="info-item"><span className="info-label">Data de criação</span><span className="info-value">{formatDate(rifa.fecha_creacion)}</span></div>
              <div className="info-item"><span className="info-label">Data de encerramento</span><span className="info-value">{formatDate(rifa.fecha_fin)}</span></div>
              <div className="info-item"><span className="info-label">Data do sorteio</span><span className="info-value">{formatDate(rifa.fecha_sorteo)}</span></div>
              <div className="info-item"><span className="info-label">Tipo de sorteio</span><span className="info-value">{getLoteriaLabel(rifa.loteriaTipo)}</span></div>
              <div className="info-item"><span className="info-label">Número do concurso</span><span className="info-value">{rifa.numeroSorteio || '—'}</span></div>
              <div className="info-item"><span className="info-label">Chave PIX</span><span className="info-value">{rifa.pixKey || '—'}</span></div>
              <div className="info-item"><span className="info-label">Aceita cartão</span><span className="info-value">{rifa.aceitaCartao ? 'Sim' : 'Não'}</span></div>
            </div>

            {rifa.premios && rifa.premios.length > 0 && (
              <div className="prizes-section">
                <h3>Prêmios</h3>
                {rifa.premios.map((premio, idx) => (
                  <div key={idx} className="prize-card">
                    <div className="prize-position">{idx === 0 ? '🥇 1º Lugar' : idx === 1 ? '🥈 2º Lugar' : idx === 2 ? '🥉 3º Lugar' : `${idx + 1}º Lugar`}</div>
                    <div className="prize-info"><h4>{premio.nombre}</h4><p>{premio.descripcion}</p></div>
                  </div>
                ))}
              </div>
            )}

            {rifa.videoUrl && (
              <div className="video-section">
                <h3>Vídeo do Prêmio</h3>
                <div className="video-container">
                  <iframe src={rifa.videoUrl.replace('watch?v=', 'embed/')} title="Vídeo do prêmio" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'numbers' && (
          <div className="numbers-tab">
            <div className="numbers-stats">
              <div className="numbers-stat"><span className="stat-value">{numerosVendidos.length}</span><span className="stat-label">Vendidos</span></div>
              <div className="numbers-stat"><span className="stat-value">{numerosDisponibles.length}</span><span className="stat-label">Disponíveis</span></div>
              <div className="numbers-stat"><span className="stat-value">{rifa.numero_ganador || '—'}</span><span className="stat-label">Número ganador</span></div>
            </div>
            <div className="numbers-grid">
              {rifa.elementos_personalizados?.map((numero, idx) => {
                const isSold = numerosVendidos.includes(String(numero));
                const isWinner = rifa.numero_ganador && String(rifa.numero_ganador) === String(numero);
                return (
                  <div key={idx} className={`number-card ${isSold ? 'sold' : 'available'} ${isWinner ? 'winner' : ''}`}>
                    <span className="number-value">{numero}</span>
                    {isSold && <span className="number-badge">✓</span>}
                    {isWinner && <span className="winner-badge">🏆</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="participants-tab">
            {participantes.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">👥</span><p>Nenhum participante registrado ainda</p></div>
            ) : (
              <div className="participants-table-container">
                <table className="participants-table">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Números</th><th>Total pago</th><th>Status</th><th>Data</th></tr></thead>
                  <tbody>
                    {participantes.map((p, idx) => (
                      <tr key={idx}>
                        <td className="participant-name">{p.nombre}</td>
                        <td>{p.telefono || '—'}</td>
                        <td>{p.email || '—'}</td>
                        <td className="participant-numbers">{p.numeros_seleccionados?.join(', ')}</td>
                        <td>{formatCurrency(p.total_pagado)}</td>
                        <td><span className={`status-badge-small ${p.estado === 'confirmado' ? 'confirmed' : 'pending'}`}>{p.estado === 'confirmado' ? 'Confirmado' : 'Pendente'}</span></td>
                        <td>{formatDate(p.fecha_participacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'winners' && (
          <div className="winners-tab">
            {!rifa.resultado_publicado ? (
              <div className="empty-state"><span className="empty-icon">🏆</span><p>O resultado ainda não foi publicado</p></div>
            ) : ganadores.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">❌</span><p>Nenhum ganador encontrado para o número {rifa.numero_ganador}</p><p className="empty-hint">Verifique se o número {rifa.numero_ganador} foi vendido</p></div>
            ) : (
              <>
                <div className="winner-number-badge"><span className="winner-number-label">Número ganador</span><span className="winner-number-value">{rifa.numero_ganador}</span></div>
                <div className="winners-list">
                  {ganadores.map((ganador, idx) => (
                    <div key={idx} className="winner-card">
                      <div className="winner-icon">🏆</div>
                      <div className="winner-info"><h3>{ganador.nombre}</h3><p>📱 {ganador.telefono || 'Telefone não informado'}</p><p>📧 {ganador.email || 'Email não informado'}</p><p className="winner-numbers">🎯 Números: {ganador.numeros_seleccionados?.join(', ')}</p></div>
                      <div className="winner-prize"><span>Prêmio</span><strong>{rifa.premios?.[0]?.nombre || 'Prêmio principal'}</strong></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'draw' && (
          <div className="draw-tab">
            <div className="draw-info">
              <h3>Informações do Sorteio</h3>
              <div className="draw-details">
                <div className="draw-detail"><span className="draw-label">Data do sorteio:</span><span className="draw-value">{formatDate(rifa.fecha_sorteo)}</span></div>
                <div className="draw-detail"><span className="draw-label">Tipo de sorteio:</span><span className="draw-value">{getLoteriaLabel(rifa.loteriaTipo)}</span></div>
                <div className="draw-detail"><span className="draw-label">Número do concurso:</span><span className="draw-value">{rifa.numeroSorteio || 'Não definido'}</span></div>
                <div className="draw-detail"><span className="draw-label">Resultado publicado:</span><span className={`draw-status ${rifa.resultado_publicado ? 'published' : 'pending'}`}>{rifa.resultado_publicado ? '✅ Publicado' : '⏳ Pendente'}</span></div>
              </div>
            </div>

            {!rifa.resultado_publicado ? (
              <div className="draw-result-form">
                <h3>Publicar resultado do sorteio</h3>
                <div className="form-group"><label>Número ganador</label><input type="text" placeholder="Digite o número sorteado" value={numeroGanador} onChange={(e) => setNumeroGanador(e.target.value)} className="input-modern" /></div>
                <button className="btn-primary" onClick={publicarResultado} disabled={publicando || !numeroGanador}>{publicando ? 'Publicando...' : 'Publicar resultado'}</button>
              </div>
            ) : (
              <div className="draw-result">
                <h3>Resultado do Sorteio</h3>
                <div className="result-number"><span className="result-label">Número sorteado</span><span className="result-value">{rifa.numero_ganador}</span></div>
                {ganadores.length > 0 ? (
                  <div className="result-winners">
                    <h4>🎉 Ganhador(es) 🎉</h4>
                    {ganadores.map((ganador, idx) => (
                      <div key={idx} className="result-winner-card">
                        <div className="winner-avatar">👑</div>
                        <div className="winner-details">
                          <p><strong>{ganador.nombre}</strong></p>
                          <p>📧 {ganador.email}</p>
                          <p>📱 {ganador.telefono || 'Não informado'}</p>
                          <p>🎯 Números: {ganador.numeros_seleccionados?.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="winner-not-found"><p>⚠️ Nenhum participante encontrado com o número {rifa.numero_ganador}</p><p className="hint">Verifique se o número foi vendido e está confirmado</p></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .rifa-details-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: transparent;
        }

        .rifa-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 20px;
          border-radius: 40px;
          cursor: pointer;
          color: #cbd5e1;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .rifa-title-section {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .rifa-title {
          font-size: 28px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .status-badge.finalized {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .btn-edit {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 10px 20px;
          border-radius: 40px;
          cursor: pointer;
          color: #60a5fa;
          transition: all 0.2s;
        }

        .btn-edit:hover {
          background: rgba(59, 130, 246, 0.4);
        }

        .rifa-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .stat-label {
          font-size: 11px;
          color: #94a3b8;
        }

        .rifa-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 10px 20px;
          border-radius: 40px;
          cursor: pointer;
          color: #94a3b8;
          font-size: 14px;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
        }

        .tab-btn.active {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .rifa-tab-content {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-section h3, .prizes-section h3, .video-section h3, .draw-info h3 {
          font-size: 18px;
          color: #fbbf24;
          margin-bottom: 16px;
        }

        .info-section p {
          color: #cbd5e1;
          line-height: 1.6;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-label {
          color: #94a3b8;
          font-size: 13px;
        }

        .info-value {
          color: #f1f5f9;
          font-weight: 500;
        }

        .prize-card {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          gap: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .prize-position {
          font-size: 14px;
          color: #fbbf24;
          font-weight: 600;
        }

        .prize-info h4 {
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .prize-info p {
          color: #94a3b8;
          font-size: 13px;
        }

        .video-container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 12px;
        }

        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .numbers-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .numbers-stat {
          background: rgba(15, 23, 42, 0.5);
          padding: 12px 20px;
          border-radius: 12px;
          text-align: center;
        }

        .numbers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 10px;
          max-height: 500px;
          overflow-y: auto;
          padding: 8px;
        }

        .number-card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .number-card.available:hover {
          background: rgba(245, 158, 11, 0.2);
          border-color: #f59e0b;
        }

        .number-card.sold {
          background: rgba(239, 68, 68, 0.2);
          opacity: 0.7;
        }

        .number-card.winner {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
        }

        .number-value {
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .number-badge, .winner-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 12px;
        }

        .participants-table-container {
          overflow-x: auto;
        }

        .participants-table {
          width: 100%;
          border-collapse: collapse;
        }

        .participants-table th, .participants-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .participants-table th {
          color: #fbbf24;
          font-weight: 600;
        }

        .participants-table td {
          color: #cbd5e1;
        }

        .status-badge-small {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge-small.confirmed {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .status-badge-small.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .winner-number-badge {
          text-align: center;
          margin-bottom: 24px;
        }

        .winner-number-label {
          display: block;
          font-size: 14px;
          color: #94a3b8;
        }

        .winner-number-value {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .winners-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .winner-card {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .winner-icon {
          font-size: 48px;
        }

        .winner-info h3 {
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .winner-info p {
          color: #94a3b8;
          font-size: 13px;
        }

        .winner-prize {
          margin-left: auto;
          text-align: center;
        }

        .winner-prize span {
          display: block;
          font-size: 12px;
          color: #94a3b8;
        }

        .winner-prize strong {
          color: #fbbf24;
        }

        .draw-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .draw-detail {
          background: rgba(15, 23, 42, 0.5);
          padding: 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .draw-label {
          color: #94a3b8;
          font-size: 13px;
        }

        .draw-value {
          color: #f1f5f9;
          font-weight: 500;
        }

        .draw-result-form, .draw-result {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .draw-result-form h3, .draw-result h3 {
          color: #fbbf24;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          color: #cbd5e1;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .input-modern {
          width: 100%;
          padding: 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f1f5f9;
        }

        .input-modern:focus {
          outline: none;
          border-color: #f59e0b;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
        }

        .result-number {
          text-align: center;
          margin-bottom: 24px;
        }

        .result-label {
          display: block;
          font-size: 14px;
          color: #94a3b8;
        }

        .result-value {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .result-winner-card {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 20px;
          align-items: center;
          border: 1px solid rgba(16, 185, 129, 0.3);
          margin-bottom: 12px;
        }

        .winner-avatar {
          font-size: 48px;
        }

        .winner-details p {
          margin: 4px 0;
          color: #cbd5e1;
        }

        .winner-not-found {
          text-align: center;
          padding: 40px;
          color: #f87171;
        }

       .empty-state {
  background: transparent !important;
  border-radius: 16px !important;
  padding: 60px !important;
  text-align: center !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #94a3b8 !important;
}

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .rifa-details-loading {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .rifa-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .winner-card {
            flex-direction: column;
            text-align: center;
          }
          
          .winner-prize {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RifaDetails;