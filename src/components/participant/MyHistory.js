import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';

const MyHistory = () => {
  const { user, token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Usar el email del usuario autenticado
      const email = user?.email;
      if (!email) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/participantes/historial/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Historial cargado:', data);
        setHistory(data.participaciones || []);
      } else {
        console.error('Error cargando historial:', response.status);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
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

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="participant-loading">
        <div className="loading-spinner"></div>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="my-history">
      <div className="history-header">
        <h2>📜 Meu Histórico</h2>
        <p>Veja todas as rifas em que você participou</p>
      </div>

      {history.length === 0 ? (
        <div className="no-history">
          <span className="no-history-icon">📭</span>
          <h3>Você ainda não participou de nenhuma rifa</h3>
          <p>Que tal começar agora? Escolha uma rifa e concorra a prêmios incríveis!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, idx) => (
            <div key={idx} className="history-item">
              <div className="history-item-header">
                <h3>{item.rifa?.nombre || item.rifa_nombre}</h3>
                <span className={`status-badge ${item.estado === 'confirmado' ? 'confirmed' : 'pending'}`}>
                  {item.estado === 'confirmado' ? '✅ Confirmado' : '⏳ Pendente'}
                </span>
              </div>
              <div className="history-item-details">
                <div className="detail">
                  <span className="detail-label">Números:</span>
                  <span className="detail-value">{item.numeros_seleccionados?.join(', ')}</span>
                </div>
                <div className="detail">
                  <span className="detail-label">Total pago:</span>
                  <span className="detail-value">{formatCurrency(item.total_pagado)}</span>
                </div>
                <div className="detail">
                  <span className="detail-label">Data:</span>
                  <span className="detail-value">{formatDate(item.fecha_participacion)}</span>
                </div>
                {item.rifa?.numero_ganador && (
                  <div className="detail winner">
                    <span className="detail-label">🎉 Número ganador:</span>
                    <span className="detail-value">{item.rifa.numero_ganador}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHistory;