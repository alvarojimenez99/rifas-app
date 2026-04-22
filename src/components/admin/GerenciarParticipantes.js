import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';
import { showSuccess, showError, showConfirm } from '../../utils/swal';

const GerenciarParticipantes = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [participantes, setParticipantes] = useState([]);
  const [rifas, setRifas] = useState([]);
  const [selectedParticipante, setSelectedParticipante] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showJugadasModal, setShowJugadasModal] = useState(false);
  const [jugadas, setJugadas] = useState(null);
  
  const [filtros, setFiltros] = useState({
    rifa_id: '',
    search: '',
    estado: 'todos',
    fecha_inicio: '',
    fecha_fin: ''
  });
  
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
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

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'confirmado':
        return <span className="status-badge confirmed">✅ Confirmado</span>;
      case 'pendiente':
        return <span className="status-badge pending">⏳ Pendente</span>;
      case 'rechazado':
        return <span className="status-badge rejected">❌ Rejeitado</span>;
      default:
        return <span className="status-badge">—</span>;
    }
  };

  // Cargar rifas del usuario para el filtro
  const cargarRifas = async () => {
    try {
      const response = await fetch(`${API_BASE}/rifas/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRifas(data.rifas || []);
      }
    } catch (error) {
      console.error('Error cargando rifas:', error);
    }
  };

  // Cargar participantes
  const cargarParticipantes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: paginacion.page,
        limit: paginacion.limit,
        ...filtros
      });
      
      const response = await fetch(`${API_BASE}/participantes/admin/listar?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setParticipantes(data.participantes);
        setPaginacion({
          ...paginacion,
          total: data.total,
          totalPages: data.totalPages
        });
      }
    } catch (error) {
      console.error('Error cargando participantes:', error);
      showError('Erro', 'Erro ao carregar participantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRifas();
  }, []);

  useEffect(() => {
    cargarParticipantes();
  }, [filtros, paginacion.page]);

  // Ver jugadas
  const verJugadas = async (participante) => {
    try {
      const response = await fetch(`${API_BASE}/participantes/${participante.id}/jugadas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJugadas(data.participante);
        setShowJugadasModal(true);
      }
    } catch (error) {
      showError('Erro', 'Erro ao carregar jugadas');
    }
  };

  // Dar de baja
  const darDeBaja = async (participante) => {
    const confirmado = await showConfirm(
      'Desactivar participante',
      `¿Deseas desactivar la participación de ${participante.nombre}? Los números quedarán disponibles nuevamente.`,
      { confirmText: 'Desactivar', confirmColor: '#dc2626' }
    );
    
    if (!confirmado) return;
    
    try {
      const response = await fetch(`${API_BASE}/participantes/${participante.id}/desactivar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motivo: 'Cancelado por el administrador' })
      });
      
      if (response.ok) {
        showSuccess('Sucesso', 'Participante desactivado correctamente');
        cargarParticipantes();
      } else {
        showError('Erro', 'Error al desactivar participante');
      }
    } catch (error) {
      showError('Erro', 'Error al desactivar');
    }
  };

  // Cambiar página
  const cambiarPagina = (newPage) => {
    setPaginacion({ ...paginacion, page: newPage });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      rifa_id: '',
      search: '',
      estado: 'todos',
      fecha_inicio: '',
      fecha_fin: ''
    });
    setPaginacion({ ...paginacion, page: 1 });
  };

  return (
    <div className="gerenciar-participantes">
      <div className="participantes-header">
        <h2>👥 Gerenciar Participantes</h2>
        <p>Visualize, filtre e gerencie todos os participantes das suas rifas</p>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Rifa</label>
            <select
              value={filtros.rifa_id}
              onChange={(e) => setFiltros({...filtros, rifa_id: e.target.value, page: 1})}
              className="select-modern"
            >
              <option value="">Todas as rifas</option>
              {rifas.map(rifa => (
                <option key={rifa.id} value={rifa.id}>{rifa.nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="filtro-group">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nome, email ou telefone..."
              value={filtros.search}
              onChange={(e) => setFiltros({...filtros, search: e.target.value, page: 1})}
              className="input-modern"
            />
          </div>
          
          <div className="filtro-group">
            <label>Status</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value, page: 1})}
              className="select-modern"
            >
              <option value="todos">Todos</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendiente">Pendentes</option>
              <option value="rechazado">Rejeitados</option>
            </select>
          </div>
          
          <div className="filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value, page: 1})}
              className="input-modern"
            />
          </div>
          
          <div className="filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value, page: 1})}
              className="input-modern"
            />
          </div>
          
          <div className="filtro-actions">
            <button className="btn-clear" onClick={limpiarFiltros}>
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de participantes */}
      <div className="participantes-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando participantes...</p>
          </div>
        ) : participantes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>Nenhum participante encontrado</p>
          </div>
        ) : (
          <table className="participantes-table">
            <thead>
              <tr>
                <th>Participante</th>
                <th>Rifa</th>
                <th>Números</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((p) => (
                <tr key={p.id}>
                  <td className="participante-info">
                    <div className="participante-nome">{p.nombre}</div>
                    <div className="participante-email">{p.email}</div>
                    <div className="participante-telefone">{p.telefono || '—'}</div>
                  </td>
                  <td className="rifa-nome">{p.rifa_nombre}</td>
                  <td className="participante-numbers">
                    {p.numeros_seleccionados?.slice(0, 5).join(', ')}
                    {p.numeros_seleccionados?.length > 5 && '...'}
                  </td>
                  <td className="participante-total">{formatCurrency(p.total_pagado)}</td>
                  <td>{getStatusBadge(p.estado)}</td>
                  <td>{formatDate(p.fecha_participacion)}</td>
                  <td className="acoes">
                    <button 
                      className="btn-view"
                      onClick={() => verJugadas(p)}
                      title="Ver jugadas"
                    >
                      🎯
                    </button>
                    {p.estado !== 'rechazado' && (
                      <button 
                        className="btn-delete"
                        onClick={() => darDeBaja(p)}
                        title="Dar de baja"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {paginacion.totalPages > 1 && (
        <div className="paginacion">
          <button 
            className="page-btn"
            disabled={paginacion.page === 1}
            onClick={() => cambiarPagina(paginacion.page - 1)}
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página {paginacion.page} de {paginacion.totalPages} ({paginacion.total} participantes)
          </span>
          <button 
            className="page-btn"
            disabled={paginacion.page === paginacion.totalPages}
            onClick={() => cambiarPagina(paginacion.page + 1)}
          >
            Próximo →
          </button>
        </div>
      )}

      {/* Modal de jugadas */}
      {showJugadasModal && jugadas && (
        <div className="modal-overlay" onClick={() => setShowJugadasModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎯 Jugadas de {jugadas.nombre}</h3>
              <button className="modal-close" onClick={() => setShowJugadasModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="jugadas-info">
                <div className="info-row">
                  <span>Email:</span>
                  <strong>{jugadas.email}</strong>
                </div>
                <div className="info-row">
                  <span>Telefone:</span>
                  <strong>{jugadas.telefono || '—'}</strong>
                </div>
                <div className="info-row">
                  <span>Rifa:</span>
                  <strong>{jugadas.rifa_nombre}</strong>
                </div>
                <div className="info-row">
                  <span>Números:</span>
                  <strong className="numbers-list">{jugadas.numeros_seleccionados?.join(', ')}</strong>
                </div>
                <div className="info-row">
                  <span>Total pago:</span>
                  <strong>{formatCurrency(jugadas.total_pagado)}</strong>
                </div>
                <div className="info-row">
                  <span>Status:</span>
                  <strong>{getStatusBadge(jugadas.estado)}</strong>
                </div>
                <div className="info-row">
                  <span>Data participação:</span>
                  <strong>{formatDate(jugadas.fecha_participacion)}</strong>
                </div>
                {jugadas.numero_ganador && (
                  <div className="info-row winner">
                    <span>🏆 Número ganador:</span>
                    <strong className="winner-number">{jugadas.numero_ganador}</strong>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowJugadasModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gerenciar-participantes {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: transparent;
        }

        .participantes-header {
          margin-bottom: 32px;
        }

        .participantes-header h2 {
          font-size: 28px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .participantes-header p {
          color: #94a3b8;
        }

        .filtros-section {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .filtros-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          align-items: flex-end;
        }

        .filtro-group {
          display: flex;
          flex-direction: column;
        }

        .filtro-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .filtro-actions {
          display: flex;
          align-items: center;
        }

        .input-modern, .select-modern {
          width: 100%;
          padding: 10px 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 14px;
          color: #f1f5f9;
        }

        .input-modern:focus, .select-modern:focus {
          outline: none;
          border-color: #f59e0b;
        }

        .btn-clear {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          color: #cbd5e1;
          transition: all 0.2s;
          white-space: nowrap;
          width: 100%;
        }

        .btn-clear:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .participantes-table-container {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .participantes-table {
          width: 100%;
          border-collapse: collapse;
        }

        .participantes-table th {
          padding: 14px 16px;
          text-align: left;
          background: rgba(15, 23, 42, 0.5);
          font-weight: 600;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .participantes-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }

        .participante-nome {
          font-weight: 600;
          color: #f1f5f9;
        }

        .participante-email, .participante-telefone {
          font-size: 12px;
          color: #94a3b8;
        }

        .rifa-nome {
          font-weight: 500;
          color: #f1f5f9;
        }

        .participante-numbers {
          font-family: monospace;
          font-size: 13px;
          color: #cbd5e1;
        }

        .participante-total {
          font-weight: 600;
          color: #10b981;
        }

        .acoes {
          display: flex;
          gap: 8px;
        }

        .btn-view {
          background: rgba(37, 99, 235, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-view:hover {
          background: rgba(37, 99, 235, 0.4);
        }

        .btn-delete {
          background: rgba(220, 38, 38, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-delete:hover {
          background: rgba(220, 38, 38, 0.4);
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.confirmed {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .status-badge.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .status-badge.rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .paginacion {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 20px;
        }

        .page-btn {
          padding: 8px 16px;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #cbd5e1;
        }

        .page-btn:hover:not(:disabled) {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #94a3b8;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h3 {
          font-size: 20px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          color: #94a3b8;
          font-size: 18px;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 24px;
        }

        .jugadas-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-row span {
          color: #94a3b8;
        }

        .info-row strong {
          color: #f1f5f9;
        }

        .numbers-list {
          font-family: monospace;
          background: rgba(15, 23, 42, 0.8);
          padding: 4px 8px;
          border-radius: 8px;
        }

        .winner-number {
          color: #fbbf24;
          font-size: 20px;
        }

        .modal-footer {
          padding: 16px 24px 24px;
          text-align: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
        }

        .empty-state, .loading-container {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
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

        /* Responsive */
        @media (max-width: 1024px) {
          .filtros-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .filtros-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GerenciarParticipantes;