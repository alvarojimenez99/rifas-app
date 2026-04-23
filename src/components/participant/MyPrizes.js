import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';

const MyPrizes = () => {
  const { token } = useAuth();
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState(null);

  // Función para formatear fechas correctamente
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Función para formatear fecha completa con hora
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Función para formatear moneda
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    if (token) {
      loadPrizes();
    }
  }, [token]);

  const loadPrizes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/participantes/mis-premios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrizes(data.premios || []);
      }
    } catch (error) {
      console.error('Error cargando premios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="participant-loading">
        <div className="loading-spinner"></div>
        <p>Carregando seus prêmios...</p>
      </div>
    );
  }

  return (
    <div className="my-prizes">
      <div className="prizes-header">
        <h2>🏆 Meus Prêmios</h2>
        <p>Prêmios que você ganhou nas rifas</p>
      </div>

      {prizes.length === 0 ? (
        <div className="no-prizes">
          <span className="no-prizes-icon">🏆</span>
          <h3>Você ainda não ganhou nenhum prêmio</h3>
          <p>Continue participando! Sua sorte pode estar na próxima rifa.</p>
        </div>
      ) : (
        <>
          <div className="prizes-list">
            {prizes.map((prize, idx) => (
              <div 
                key={idx} 
                className="prize-card"
                onClick={() => setSelectedPrize(prize)}
              >
                <div className="prize-icon">🏆</div>
                <div className="prize-info">
                  <h3>{prize.rifa_nombre || prize.nombre}</h3>
                  <p><strong>Rifa:</strong> {prize.rifa_nombre || prize.nombre}</p>
                  <p><strong>Número ganador:</strong> <span className="winner-number">{prize.numero_ganador}</span></p>
                  <p><strong>Data do sorteio:</strong> {formatDate(prize.fecha_sorteo)}</p>
                  {prize.participante?.numeros && (
                    <p><strong>Seus números:</strong> {prize.participante.numeros.join(', ')}</p>
                  )}
                </div>
                <div className="prize-status">
                  <span className="status-badge success">🏅 Ganhou!</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de detalhes do prêmio */}
          {selectedPrize && (
            <div className="prize-modal-overlay" onClick={() => setSelectedPrize(null)}>
              <div className="prize-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedPrize(null)}>✕</button>
                
                <div className="prize-modal-header">
                  <div className="winner-trophy">🏆</div>
                  <h2>Parabéns! Você é o ganhador!</h2>
                  <p>{selectedPrize.rifa_nombre || selectedPrize.nombre}</p>
                </div>

                <div className="prize-modal-body">
                  <div className="winner-info">
                    <div className="info-row">
                      <span>Número sorteado:</span>
                      <strong className="winner-number">{selectedPrize.numero_ganador}</strong>
                    </div>
                    <div className="info-row">
                      <span>Data do sorteio:</span>
                      <strong>{formatDateTime(selectedPrize.fecha_sorteo)}</strong>
                    </div>
                    {selectedPrize.participante?.numeros && (
                      <div className="info-row">
                        <span>Seus números:</span>
                        <strong>{selectedPrize.participante.numeros.join(', ')}</strong>
                      </div>
                    )}
                    {selectedPrize.participante?.total_pagado && (
                      <div className="info-row">
                        <span>Total pago:</span>
                        <strong>{formatCurrency(selectedPrize.participante.total_pagado)}</strong>
                      </div>
                    )}
                    {selectedPrize.participante?.fecha_participacion && (
                      <div className="info-row">
                        <span>Data da participação:</span>
                        <strong>{formatDateTime(selectedPrize.participante.fecha_participacion)}</strong>
                      </div>
                    )}
                  </div>

                  {selectedPrize.fotos && selectedPrize.fotos.length > 0 && (
                    <div className="prize-photos">
                      <h4>📸 Fotos do prêmio</h4>
                      <div className="photos-grid">
                        {selectedPrize.fotos.map((foto, idx) => (
                          <img 
                            key={idx} 
                            src={foto.url} 
                            alt={`Foto ${idx + 1}`}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Imagem+Indisponivel';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPrize.creador && (
                    <div className="creator-info">
                      <h4>📞 Contato do organizador</h4>
                      <p><strong>Nome:</strong> {selectedPrize.creador.nombre}</p>
                      <p><strong>Email:</strong> {selectedPrize.creador.email}</p>
                      {selectedPrize.creador.telefono && (
                        <p><strong>Telefone:</strong> {selectedPrize.creador.telefono}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="prize-modal-footer">
                  <button className="btn-primary" onClick={() => setSelectedPrize(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .my-prizes {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .prizes-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .prizes-header h2 {
          font-size: 28px;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .prizes-header p {
          color: #64748b;
        }

        .prizes-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .prize-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .prize-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .prize-icon {
          font-size: 48px;
          min-width: 60px;
          text-align: center;
        }

        .prize-info {
          flex: 1;
        }

       .prize-info h3 {
  font-size: 18px;
  color: #f59e0b;  /* Color amarillo/dorado */
  margin-bottom: 8px;
  font-weight: 600;
}

        .prize-info p {
          margin: 4px 0;
          font-size: 14px;
          color: #475569;
        }

        .prize-info strong {
          color: #334155;
          font-weight: 600;
        }

        .winner-number {
          font-size: 20px;
          font-weight: bold;
          color: #10b981;
          background: #d1fae5;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
        }

        .prize-status {
          display: flex;
          align-items: center;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.success {
          background: #d1fae5;
          color: #059669;
        }

        .no-prizes {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
        }

        .no-prizes-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }

        .no-prizes h3 {
          font-size: 20px;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .no-prizes p {
          color: #64748b;
        }

        /* Modal styles */
        .prize-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          overflow-y: auto;
          padding: 20px;
        }

        .prize-modal-content {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .prize-modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .prize-modal-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .prize-modal-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 10;
        }

        .modal-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .prize-modal-header {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 24px 24px 0 0;
          color: white;
        }

        .prize-modal-header h2 {
          color: white;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .prize-modal-header p {
          color: rgba(255,255,255,0.9);
        }

        .winner-trophy {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .prize-modal-body {
          padding: 24px;
        }

        .winner-info {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row span {
          color: #64748b;
          font-weight: 500;
        }

        .info-row strong {
          color: #1e293b;
          font-weight: 600;
        }

        .prize-photos h4, .creator-info h4 {
          font-size: 16px;
          color: #1e293b;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .photos-grid img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
        }

        .creator-info {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 16px;
        }

        .creator-info p {
          margin: 6px 0;
          font-size: 14px;
          color: #334155;
        }

        .creator-info strong {
          color: #1e293b;
        }

        .prize-modal-footer {
          padding: 16px 24px 24px;
          text-align: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
        }

        .participant-loading {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
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

export default MyPrizes;