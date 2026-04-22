import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';
import { showSuccess, showError } from '../../utils/swal';

const AdminReports = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rifas, setRifas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    status: 'todas',
    categoria: 'todos',
    search: ''
  });
  const [categorias, setCategorias] = useState([]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (rifa) => {
    if (rifa.resultado_publicado) {
      return <span className="status-badge finalized">✅ Finalizada</span>;
    }
    if (rifa.activa) {
      return <span className="status-badge active">🟢 Ativa</span>;
    }
    return <span className="status-badge inactive">🔴 Encerrada</span>;
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.status !== 'todas') params.append('status', filtros.status);
      if (filtros.categoria !== 'todos') params.append('categoria', filtros.categoria);
      if (filtros.search) params.append('search', filtros.search);

      const response = await fetch(`${API_BASE}/rifas/reportes/dados?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRifas(data.rifas);
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
      showError('Erro', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = [
      'ID', 'Nome', 'Categoria', 'Preço', 'Data Criação', 'Data Sorteio',
      'Status', 'Números Vendidos', 'Participantes', 'Total Arrecadado'
    ];
    
    const rows = rifas.map(rifa => [
      rifa.id,
      rifa.nombre,
      rifa.categoria || '—',
      formatCurrency(rifa.precio),
      formatDate(rifa.created_at),
      formatDate(rifa.fecha_sorteo),
      rifa.resultado_publicado ? 'Finalizada' : (rifa.activa ? 'Ativa' : 'Encerrada'),
      rifa.total_vendidos,
      rifa.total_participantes,
      formatCurrency(rifa.total_recaudado)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `relatorio_rifas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Exportado!', 'Arquivo CSV gerado com sucesso');
  };

  // Exportar a PDF (usando window.print)
  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <h2>📊 Relatórios</h2>
        <p>Análise completa das suas rifas</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <span className="stat-value">{estadisticas.total_rifas || 0}</span>
            <span className="stat-label">Total de Rifas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-value">{estadisticas.rifas_ativas || 0}</span>
            <span className="stat-label">Rifas Ativas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{estadisticas.rifas_finalizadas || 0}</span>
            <span className="stat-label">Rifas Finalizadas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(estadisticas.total_arrecadado)}</span>
            <span className="stat-label">Total Arrecadado</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{estadisticas.total_participantes || 0}</span>
            <span className="stat-label">Participantes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔢</div>
          <div className="stat-info">
            <span className="stat-value">{estadisticas.total_numeros_vendidos || 0}</span>
            <span className="stat-label">Números Vendidos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <h3>🔍 Filtros</h3>
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value})}
              className="input-modern"
            />
          </div>
          <div className="filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
              className="input-modern"
            />
          </div>
          <div className="filtro-group">
            <label>Status</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
              className="select-modern"
            >
              <option value="todas">Todas</option>
              <option value="activas">Ativas</option>
              <option value="finalizadas">Finalizadas</option>
            </select>
          </div>
          <div className="filtro-group">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nome da rifa..."
              value={filtros.search}
              onChange={(e) => setFiltros({...filtros, search: e.target.value})}
              className="input-modern"
            />
          </div>
          <div className="filtro-actions">
            <button className="btn-clear" onClick={() => setFiltros({
              fecha_inicio: '', fecha_fin: '', status: 'todas', categoria: 'todos', search: ''
            })}>
              Limpar Filtros
            </button>
          </div>
        </div>
        <div className="export-actions">
          <button className="btn-export" onClick={exportToCSV}>
            📄 Exportar CSV
          </button>
          <button className="btn-export" onClick={exportToPDF}>
            🖨️ Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="reports-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        ) : rifas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p>Nenhuma rifa encontrada</p>
          </div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Preço</th>
                <th>Data Criação</th>
                <th>Data Sorteio</th>
                <th>Status</th>
                <th>Vendidos</th>
                <th>Participantes</th>
                <th>Arrecadado</th>
              </tr>
            </thead>
            <tbody>
              {rifas.map((rifa) => (
                <tr key={rifa.id}>
                  <td className="rifa-id">{rifa.id.slice(-8)}</td>
                  <td className="rifa-name">{rifa.nombre}</td>
                  <td>{formatCurrency(rifa.precio)}</td>
                  <td>{formatDate(rifa.created_at)}</td>
                  <td>{formatDate(rifa.fecha_sorteo)}</td>
                  <td>{getStatusBadge(rifa)}</td>
                  <td>{rifa.total_vendidos} / {rifa.cantidad_elementos}</td>
                  <td>{rifa.total_participantes}</td>
                  <td className="total-value">{formatCurrency(rifa.total_recaudado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .admin-reports {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: transparent;
        }

        .reports-header {
          margin-bottom: 32px;
        }

        .reports-header h2 {
          font-size: 28px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .reports-header p {
          color: #94a3b8;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .stat-label {
          font-size: 12px;
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

        .filtros-section h3 {
          font-size: 18px;
          color: #f1f5f9;
          margin-bottom: 16px;
        }

        .filtros-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 20px;
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

        .export-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
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

        .btn-export, .btn-clear {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-export {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-export:hover {
          transform: translateY(-2px);
        }

        .btn-clear {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          white-space: nowrap;
        }

        .btn-clear:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .reports-table-container {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
        }

        .reports-table th {
          padding: 14px 16px;
          text-align: left;
          background: rgba(15, 23, 42, 0.5);
          font-weight: 600;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .reports-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }

        .rifa-id {
          font-family: monospace;
          font-size: 12px;
          color: #94a3b8;
        }

        .rifa-name {
          font-weight: 500;
          color: #f1f5f9;
        }

        .total-value {
          font-weight: 600;
          color: #10b981;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
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

        .empty-state, .loading-container {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
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

        /* Responsive */
        @media (max-width: 1024px) {
          .filtros-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .filtros-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media print {
          .filtros-section, .filtros-actions, .btn-export, .btn-clear, .export-actions {
            display: none;
          }
          
          .stat-card, .reports-table-container {
            background: white;
            border: 1px solid #ddd;
          }
          
          .stat-value, .rifa-name, .reports-table td {
            color: black;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminReports;