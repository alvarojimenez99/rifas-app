import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const MinhasRifas = () => {
  const { token } = useAuth();
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarRifas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/rifas/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRifas(data.rifas || []);
    } catch (error) {
      console.error('Erro carregando rifas:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregarRifas();
  }, [carregarRifas]);

  const getStatusBadge = (estado) => {
    switch(estado) {
      case 'pendiente':
        return <span className="status-pending">⏳ Pendente</span>;
      case 'aprobada':
        return <span className="status-approved">✅ Aprovada</span>;
      case 'rechazada':
        return <span className="status-rejected">❌ Rejeitada</span>;
      default:
        return <span>{estado}</span>;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando suas rifas...</p>
      </div>
    );
  }

  if (rifas.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🎯</span>
        <h3>Você ainda não criou nenhuma rifa</h3>
        <p>Clique em "Criar Rifa" no menu para começar</p>
        <Link to="/criar-rifa" className="btn-primary">
          ✨ Criar minha primeira rifa
        </Link>
      </div>
    );
  }

  return (
    <div className="minhas-rifas">
      <div className="section-header">
        <h3>🎯 Minhas Rifas</h3>
        <p>Rifas que você criou e seu status de aprovação</p>
      </div>

      <div className="rifas-grid">
        {rifas.map(rifa => (
          <div key={rifa.id} className="rifa-card">
            <div className="rifa-card-header">
              <h4>{rifa.nombre}</h4>
              <div className="rifa-status">
                {getStatusBadge(rifa.estado)}
              </div>
            </div>
            
            <p className="rifa-description">
              {rifa.descripcion?.substring(0, 80)}...
            </p>
            
            <div className="rifa-stats">
              <div className="stat">
                <span>💰 Preço</span>
                <strong>{formatCurrency(rifa.precio)}</strong>
              </div>
              <div className="stat">
                <span>🎯 Números</span>
                <strong>{rifa.cantidad_elementos}</strong>
              </div>
              <div className="stat">
                <span>📅 Criada</span>
                <strong>{new Date(rifa.fecha_creacion).toLocaleDateString('pt-BR')}</strong>
              </div>
            </div>
            
            <Link to={`/public/${rifa.id}`} className="btn-ver">
              Ver detalhes →
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .minhas-rifas {
          padding: 20px;
        }

        .section-header {
          margin-bottom: 24px;
        }

        .section-header h3 {
          font-size: 20px;
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .section-header p {
          color: #94a3b8;
          font-size: 14px;
        }

        .rifas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .rifa-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s;
        }

        .rifa-card:hover {
          transform: translateY(-4px);
        }

        .rifa-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rifa-card-header h4 {
          font-size: 18px;
          color: #f1f5f9;
          margin: 0;
        }

        .rifa-description {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .rifa-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat span {
          font-size: 11px;
          color: #64748b;
        }

        .stat strong {
          font-size: 14px;
          color: #f1f5f9;
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
        }

        .status-approved {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
        }

        .status-rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
        }

        .btn-ver {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 8px 16px;
          border-radius: 40px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          width: 100%;
          transition: all 0.2s;
        }

        .btn-ver:hover {
          transform: translateY(-2px);
        }

        .btn-primary {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 12px 24px;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 24px;
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #94a3b8;
        }

        .loading-container {
          text-align: center;
          padding: 40px;
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
      `}</style>
    </div>
  );
};

export default MinhasRifas;