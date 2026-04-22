import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError, showConfirm, showWarning } from '../utils/swal';
import Lightbox from './Lightbox';
import PaymentModal from './PaymentModal';

const PublicRifaView = ({ rifas: rifasProp }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [rifa, setRifa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numerosDisponibles, setNumerosDisponibles] = useState([]);
  const [numerosSeleccionados, setNumerosSeleccionados] = useState([]);
  const [numerosVendidos, setNumerosVendidos] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Estados para reservas
  const [reservas, setReservas] = useState([]);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [reservaActiva, setReservaActiva] = useState(false);
  const timerIntervalRef = useRef(null);

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

  const loadRifa = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rifas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRifa(data.rifa);
        setNumerosVendidos(data.rifa.numerosVendidos || []);
        
        const total = data.rifa.cantidad_elementos || 100;
        const disponibles = Array.from({ length: total }, (_, i) => i + 1)
          .filter(n => !(data.rifa.numerosVendidos || []).includes(String(n)));
        setNumerosDisponibles(disponibles);
      } else {
        const rifaEncontrada = rifasProp?.find(r => r.id === id);
        if (rifaEncontrada) {
          setRifa(rifaEncontrada);
          const total = rifaEncontrada.cantidad_elementos || 100;
          const disponibles = Array.from({ length: total }, (_, i) => i + 1);
          setNumerosDisponibles(disponibles);
        } else {
          showError('Erro', 'Rifa não encontrada');
          navigate('/portal');
        }
      }
    } catch (error) {
      console.error('Error carregando rifa:', error);
      showError('Erro', 'Erro ao carregar rifa');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, rifasProp]);

  const limpiarTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const iniciarTimer = useCallback((expiracion) => {
    limpiarTimer();
    setReservaActiva(true);
    
    const interval = setInterval(() => {
      const ahora = new Date();
      const expira = new Date(expiracion);
      const diff = Math.floor((expira - ahora) / 1000);
      
      if (diff <= 0) {
        clearInterval(interval);
        timerIntervalRef.current = null;
        setTiempoRestante(0);
        setReservaActiva(false);
        setReservas([]);
        setNumerosSeleccionados([]);
        showWarning('Reserva expirada', 'O tempo para pagamento expirou. Seus números foram liberados.');
        loadRifa();
      } else {
        setTiempoRestante(diff);
      }
    }, 1000);
    
    timerIntervalRef.current = interval;
  }, [loadRifa, limpiarTimer]);

  const cargarReservasUsuario = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${API_BASE}/participantes/${id}/reservas/usuario`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.tiene_reservas) {
        const numerosReservados = data.reservas.map(r => Number(r.elemento));
        setReservas(numerosReservados);
        setNumerosSeleccionados(numerosReservados);
        if (data.reservas[0]?.expira_en) {
          iniciarTimer(data.reservas[0].expira_en);
        }
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  }, [id, isAuthenticated, iniciarTimer]);

  const loadRifaCompleta = useCallback(async () => {
    await loadRifa();
    if (isAuthenticated) {
      await cargarReservasUsuario();
    }
  }, [loadRifa, isAuthenticated, cargarReservasUsuario]);

  useEffect(() => {
    loadRifaCompleta();
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [loadRifaCompleta]);

  const cancelarReservas = async () => {
    const confirmed = await showConfirm(
      'Cancelar reserva',
      'Tem certeza que deseja cancelar a reserva dos números? Eles ficarão disponíveis para outros participantes.',
      { confirmText: 'Sim, cancelar', confirmColor: '#e74c3c' }
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${API_BASE}/participantes/${id}/reservas`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        setReservas([]);
        setReservaActiva(false);
        setNumerosSeleccionados([]);
        limpiarTimer();
        showSuccess('Reserva cancelada', 'Seus números foram liberados');
        loadRifaCompleta();
      }
    } catch (error) {
      console.error('Error cancelando reservas:', error);
      showError('Erro', 'Erro ao cancelar reserva');
    }
  };

  const toggleNumero = async (numero) => {
    if (!isAuthenticated) {
      showError('Acesso negado', 'Você precisa fazer login para participar');
      navigate('/landing');
      return;
    }

    if (rifa.resultado_publicado || !rifa.activa) {
      showError('Rifa finalizada', 'Esta rifa já foi finalizada. Não é possível participar.');
      return;
    }

    if (numerosSeleccionados.includes(numero)) {
      setNumerosSeleccionados(numerosSeleccionados.filter(n => n !== numero));
    } else {
      const nuevosNumeros = [...numerosSeleccionados, numero];
      setNumerosSeleccionados(nuevosNumeros);
      
      try {
        const response = await fetch(`${API_BASE}/participantes/${id}/reservar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ numerosSeleccionados: nuevosNumeros })
        });
        
        const data = await response.json();
        if (data.success) {
          setReservas(data.numeros.map(n => Number(n)));
          setReservaActiva(true);
          iniciarTimer(data.expira_en);
          // showSuccess('Reserva confirmada', `Você tem 15 minutos para completar o pagamento`);
        } else if (response.status === 409) {
          showError('Número indisponível', data.error);
          loadRifaCompleta();
        }
      } catch (error) {
        console.error('Error reservando:', error);
        showError('Erro', 'Erro ao reservar números');
      }
    }
  };

  const limparSelecao = () => {
    setNumerosSeleccionados([]);
  };

  const handleParticipate = () => {
    if (!isAuthenticated) {
      showError('Acesso negado', 'Você precisa fazer login para participar');
      navigate('/landing');
      return;
    }

    if (rifa.resultado_publicado || !rifa.activa) {
      showError('Rifa finalizada', 'Esta rifa já foi finalizada. Não é possível participar.');
      return;
    }

    if (numerosSeleccionados.length === 0) {
      showError('Selecione números', 'Selecione pelo menos um número para participar');
      return;
    }

    // Abrir modal de pago
    setShowPaymentModal(true);
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (fotos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % fotos.length);
    }
  };

  const prevImage = () => {
    if (fotos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="public-rifa-loading">
        <div className="loading-spinner"></div>
        <p>Carregando rifa...</p>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="public-rifa-notfound">
        <h2>Rifa não encontrada</h2>
        <button onClick={() => navigate('/portal')} className="btn-primary">
          Ver rifas disponíveis
        </button>
      </div>
    );
  }

  const totalSelecionados = numerosSeleccionados.length;
  const totalPagar = rifa.precio * totalSelecionados;
  const videoUrl = rifa.video_url || rifa.videoUrl;
  const embedVideoUrl = getEmbedUrl(videoUrl);
  const fotos = rifa.fotosPremios || rifa.fotos_premios || [];
  const premios = rifa.premios || [];
  const descricao = rifa.descricao || rifa.descripcion || 'Sem descrição';
  const pixKey = rifa.pix_key || rifa.pixKey;
  const aceitaCartao = rifa.aceita_cartao || rifa.aceitaCartao;
  const loteriaTipo = rifa.loteria_tipo || rifa.loteriaTipo;

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  
  const isFinished = rifa.resultado_publicado || !rifa.activa;

  return (
    <div className="public-rifa-container">
      <div className="public-rifa-header">
      <button 
  className="back-btn" 
  style={{ color: "#f1c40f" }} 
  onClick={() => navigate('/dashboard-participante')}
>
  ← Voltar
</button>

        <h1 className="public-rifa-title">{rifa.nombre}</h1>
        <div className="rifa-status">
          {isFinished ? (
            <span className="status-finished">🏆 Finalizada</span>
          ) : (
            <span className="status-active">🟢 Ativa</span>
          )}
        </div>
      </div>

      <div className="public-rifa-content">
        {/* Columna izquierda - Detalles */}
        <div className="public-rifa-details">
          {reservaActiva && !isFinished && (
            <div className="reserva-timer">
              <div className="timer-icon">⏰</div>
              <div className="timer-info">
                <span className="timer-label">Tempo para pagar:</span>
                <span className="timer-value">
                  {minutos}:{segundos.toString().padStart(2, '0')}
                </span>
              </div>
              <button className="btn-cancelar-reserva" onClick={cancelarReservas}>
                Cancelar
              </button>
            </div>
          )}

          {embedVideoUrl && (
            <div className="video-section">
              <h3>📺 Vídeo do Prêmio</h3>
              <div className="video-container">
                <iframe
                  src={embedVideoUrl}
                  title="Vídeo do prêmio"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {fotos.length > 0 && (
            <div className="images-section">
              <h3>📸 Imagens do Prêmio</h3>
              <div className="images-gallery">
                <div 
                  className="gallery-main"
                  onClick={() => openLightbox(0)}
                >
                  <img src={fotos[0].url || fotos[0].url_foto} alt="Foto principal" />
                  <div className="gallery-overlay">
                    <span>🔍 Ver galeria</span>
                  </div>
                </div>
                
                {fotos.length > 1 && (
                  <div className="gallery-thumbnails">
                    {fotos.slice(1, 5).map((foto, idx) => (
                      <div 
                        key={idx} 
                        className="gallery-thumb"
                        onClick={() => openLightbox(idx + 1)}
                      >
                        <img src={foto.url || foto.url_foto} alt={`Foto ${idx + 2}`} />
                        {idx === 3 && fotos.length > 5 && (
                          <div className="gallery-more">
                            +{fotos.length - 5}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {fotos.length > 1 && (
                <div className="gallery-info">
                  <span>📸 {fotos.length} fotos</span>
                  <button 
                    className="view-all-photos"
                    onClick={() => openLightbox(0)}
                  >
                    Ver todas as fotos →
                  </button>
                </div>
              )}
            </div>
          )}

          {premios.length > 0 && (
            <div className="prizes-section">
              <h3>🏆 Prêmios</h3>
              {premios.map((premio, idx) => (
                <div key={idx} className="prize-card">
                  <div className="prize-position">
                    {idx === 0 ? '🥇 1º Lugar' : idx === 1 ? '🥈 2º Lugar' : `${idx + 1}º Lugar`}
                  </div>
                  <div className="prize-info">
                    <h4>{premio.nombre}</h4>
                    <p>{premio.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="description-section">
            <h3>📋 Descrição</h3>
            <p>{descricao}</p>
          </div>

          {rifa.reglas && (
            <div className="rules-section">
              <h3>📜 Regras</h3>
              <p>{rifa.reglas}</p>
            </div>
          )}

          <div className="draw-info-section">
            <h3>🎲 Sorteio</h3>
            <div className="draw-info-grid">
              <div className="draw-item">
                <span className="draw-label">Data do sorteio</span>
                <span className="draw-value">{formatDate(rifa.fecha_sorteo)}</span>
              </div>
              <div className="draw-item">
                <span className="draw-label">Tipo de sorteio</span>
                <span className="draw-value">{loteriaTipo || 'A definir'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Selección de números */}
        <div className="public-rifa-numbers">
          {!isFinished ? (
            <>
              <div className="numbers-header">
                <h3>🔢 Escolha seus números</h3>
                <div className="numbers-summary">
                  <div className="summary-item">
                    <span>Valor por número:</span>
                    <strong>{formatCurrency(rifa.precio)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Números selecionados:</span>
                    <strong>{totalSelecionados}</strong>
                  </div>
                  <div className="summary-item total">
                    <span>Total a pagar:</span>
                    <strong>{formatCurrency(totalPagar)}</strong>
                  </div>
                </div>
              </div>

              <div className="numbers-grid">
                {numerosDisponibles.map(numero => {
                  const isSelected = numerosSeleccionados.includes(numero);
                  const isSold = numerosVendidos.includes(String(numero));
                  const isReserved = reservas.includes(numero) && !isSelected;
                  
                  return (
                    <button
                      key={numero}
                      className={`number-btn ${isSelected ? 'selected' : ''} ${isSold ? 'sold' : ''} ${isReserved ? 'reserved' : ''}`}
                      onClick={() => !isSold && !isReserved && toggleNumero(numero)}
                      disabled={isSold || isReserved}
                      title={isSold ? 'Vendido' : isReserved ? 'Reservado por outro usuário' : 'Disponível'}
                    >
                      {numero}
                      {isSelected && <span className="check-mark">✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className="numbers-actions">
                <button
                  className="btn-clear"
                  onClick={limparSelecao}
                  disabled={totalSelecionados === 0}
                >
                  Limpar seleção
                </button>
                <button
                  className="btn-participate"
                  onClick={handleParticipate}
                  disabled={totalSelecionados === 0}
                >
                  Participar ({formatCurrency(totalPagar)})
                </button>
              </div>

              <div className="payment-info">
                <h4>💳 Formas de pagamento</h4>
                <div className="payment-methods">
                  {pixKey && (
                    <div className="payment-method">
                      <span>⚡ PIX</span>
                      <small>Chave: {pixKey}</small>
                    </div>
                  )}
                  {aceitaCartao && (
                    <div className="payment-method">
                      <span>💳 Cartão de crédito</span>
                      <small>Visa, Mastercard, Elo</small>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="raffle-finished-message">
              <div className="finished-icon">🏆</div>
              <h3>Rifa finalizada!</h3>
              <p>
                Número ganador: <strong>{rifa.numero_ganador || '—'}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={fotos}
          currentIndex={currentImageIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}

      {/* Payment Modal */}
      
{/* Payment Modal */}
{showPaymentModal && (
  <PaymentModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  rifaId={rifa.id}
  numerosSeleccionados={numerosSeleccionados}
  total={totalPagar}
  email={user?.email}
  nome={user?.nombre}
  telefone={user?.telefono}
  cpf="59337942011"
  onSuccess={() => {
    setNumerosSeleccionados([]);
    setReservaActiva(false);
    limpiarTimer();
    loadRifaCompleta();
  }}
/>
)}
    </div>
  );
};

export default PublicRifaView;