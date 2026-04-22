import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE, STRIPE_PUBLISHABLE_KEY } from '../config/api';
import { showSuccess, showError } from '../utils/swal';
import { useNavigate } from 'react-router-dom';
import './PaymentModal.css';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ rifaId, numerosSeleccionados = [], total, email, nome, telefone, cpf, onSuccess, onClose, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [localCpf, setLocalCpf] = useState(cpf || '');
  const [participacionConfirmada, setParticipacionConfirmada] = useState(false);

  // Asegurar que numerosSeleccionados sea un array
  const numeros = numerosSeleccionados || [];

  // Debug
  console.log('PaymentForm - numeros:', numeros);
  console.log('PaymentForm - total:', total);
  console.log('PaymentForm - cpf:', localCpf);

  const formatarCPF = (value) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
    }
    return value;
  };

  const handleCpfChange = (e) => {
    const formatted = formatarCPF(e.target.value);
    setLocalCpf(formatted);
  };

  // Función para confirmar el pago en el backend
  const confirmarPagoEnBackend = async (numeros, total, metodoPago) => {
    try {
      console.log('Confirmando pago en backend...', { rifaId, numeros, total, metodoPago });
      
      const response = await fetch(`${API_BASE}/participantes/${rifaId}/confirmar-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          numerosSeleccionados: numeros,
          total: total,
          metodoPago: metodoPago
        })
      });
      
      const data = await response.json();
      console.log('Respuesta confirmar-pago:', data);
      
      if (response.ok && data.success) {
        setParticipacionConfirmada(true);
        showSuccess('Participação confirmada!', 'Seus números foram registrados com sucesso!');
        return true;
      } else {
        showError('Erro', data.error || 'Erro ao confirmar participação');
        return false;
      }
    } catch (error) {
      console.error('Error confirmando pago:', error);
      showError('Erro', 'Erro ao confirmar participação');
      return false;
    }
  };

  const processPixPayment = async () => {
    if (!numeros || numeros.length === 0) {
      showError('Erro', 'Nenhum número selecionado para pagamento');
      return;
    }

    // Validar CPF
    const cpfLimpo = localCpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      showError('Erro', 'Por favor, informe um CPF válido (11 dígitos)');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        rifaId,
        numerosSeleccionados: numeros,
        total,
        email,
        nome,
        telefone,
        cpf: cpfLimpo
      };
      
      console.log('Enviando PIX request:', requestBody);

      const response = await fetch(`${API_BASE}/payments/pix/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Respuesta PIX:', data);
      
      if (response.ok && data.success) {
        // Primero confirmar la participación en el backend
        const confirmado = await confirmarPagoEnBackend(numeros, total, 'pix');
        
        if (confirmado) {
          setPixData({
            qrCode: data.qrCode,
            copiaECola: data.copiaECola
          });
        //  showSuccess('Pagamento PIX gerado!', 'Escaneie o QR Code ou copie o código para pagar');
        }
      } else {
        showError('Erro', data.error || 'Erro ao gerar pagamento PIX');
      }
    } catch (error) {
      console.error('Error procesando PIX:', error);
      showError('Erro', 'Erro ao processar pagamento PIX');
    } finally {
      setLoading(false);
    }
  };

  const processCardPayment = async () => {
    if (!stripe || !elements) return;

    if (!numeros || numeros.length === 0) {
      showError('Erro', 'Nenhum número selecionado para pagamento');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payments/card/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rifaId,
          numerosSeleccionados: numeros,
          total,
          email,
          nome
        })
      });

      const data = await response.json();
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: nome,
            email: email
          }
        }
      });

      if (error) {
        showError('Erro no pagamento', error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirmar la participación en el backend
        const confirmado = await confirmarPagoEnBackend(numeros, total, 'card');
        
        if (confirmado) {
          showSuccess('Pagamento confirmado!', 'Seus números foram registrados com sucesso!');
          // Llamar al callback de éxito que cerrará el modal y redirigirá
          onPaymentComplete();
        }
      }
    } catch (error) {
      console.error('Error procesando tarjeta:', error);
      showError('Erro', 'Erro ao processar pagamento com cartão');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'pix') {
      processPixPayment();
    } else {
      processCardPayment();
    }
  };

  const handleClosePixModal = () => {
    // Cuando se cierra el modal de PIX, redirigir al dashboard
    onPaymentComplete();
  };

  // Pantalla de PIX generado
  if (pixData) {
    // Construir la URL de la imagen QR
    const qrImageSrc = pixData.qrCode && (pixData.qrCode.startsWith('data:') || pixData.qrCode.startsWith('iVBOR'))
      ? (pixData.qrCode.startsWith('data:') ? pixData.qrCode : `data:image/png;base64,${pixData.qrCode}`)
      : pixData.qrCode;
    
    return (
      <div className="payment-pix-modal">
        <div className="pix-qr-container">
        <h3 style={{ color: "#f1c40f" }}>🎉 Pagamento PIX Gerado!</h3>

          
          <div className="qr-code-wrapper">
            {qrImageSrc && qrImageSrc !== 'data:image/png;base64,undefined' ? (
              <img 
                src={qrImageSrc} 
                alt="QR Code PIX" 
                className="qr-code-image" 
              />
            ) : (
              <div className="qr-placeholder">
                <p>QR Code disponível no app do seu banco</p>
              </div>
            )}
          </div>
          
          <div className="pix-copia-cola">
            <strong>📋 Código PIX (Copia e Cola):</strong>
            <div className="pix-code">{pixData.copiaECola || 'Código gerado pelo banco'}</div>
            {pixData.copiaECola && (
              <button 
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(pixData.copiaECola);
                  showSuccess('Copiado!', 'Código PIX copiado para a área de transferência');
                }}
              >
                📋 Copiar código
              </button>
            )}
          </div>
          
          <div className="pix-instructions">
            <p>✅ Abra o app do seu banco</p>
            <p>✅ Escolha pagar via PIX</p>
            <p>✅ Escaneie o QR Code ou cole o código</p>
            <p>⏰ Você tem 30 minutos para pagar</p>
            <p>📝 Sua participação já está confirmada!</p>
          </div>
          
          <button 
            className="btn-close" 
            onClick={handleClosePixModal}
          >
            Ir para o Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-modal">
      <div className="payment-modal-header">
        <h3>💳 Pagamento</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="payment-methods">
        <label className={`payment-method-option ${paymentMethod === 'pix' ? 'active' : ''}`}>
          <input
            type="radio"
            value="pix"
            checked={paymentMethod === 'pix'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>⚡ PIX</span>
          <small>Pagamento instantâneo</small>
        </label>
        <label className={`payment-method-option ${paymentMethod === 'card' ? 'active' : ''}`}>
          <input
            type="radio"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>💳 Cartão de crédito</span>
          <small>Visa, Mastercard, Elo</small>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        {/* Campo CPF - solo para PIX */}
        {paymentMethod === 'pix' && (
          <div className="cpf-container">
            <label className="cpf-label">CPF do titular</label>
            <input
              type="text"
              className="cpf-input"
              placeholder="000.000.000-00"
              value={localCpf}
              onChange={handleCpfChange}
              maxLength="14"
              required
            />
            <small className="cpf-help">Digite apenas números</small>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="card-element-container">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#fff',
                    '::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  }
                }
              }}
            />
          </div>
        )}

        <div className="payment-summary" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
        >
          <div className="summary-item">
            <span>Total:</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </div>
          <div className="summary-numbers">
            <span>Números:</span>
            <strong>{numeros.join(', ')}</strong>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-pay"
          disabled={loading || (paymentMethod === 'card' && !stripe)}
        >
          {loading ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, rifaId, numerosSeleccionados = [], total, email, nome, telefone, cpf, onSuccess }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  console.log('PaymentModal props:', { 
    rifaId, 
    numerosSeleccionados: numerosSeleccionados || [], 
    total, 
    email, 
    nome,
    cpf 
  });

  const handlePaymentComplete = () => {
    // Cerrar el modal
    onClose();
    // Llamar al callback onSuccess si existe
    if (onSuccess) {
      onSuccess();
    }
    // Redirigir al dashboard después de 1 segundo
    setTimeout(() => {
      navigate('/dashboard-participante');
      //showSuccess('Redirecionando', 'Você será redirecionado para o dashboard');
    }, 1000);
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <Elements stripe={stripePromise}>
          <PaymentForm
            rifaId={rifaId}
            numerosSeleccionados={numerosSeleccionados}
            total={total}
            email={email}
            nome={nome}
            telefone={telefone}
            cpf={cpf}
            onSuccess={onSuccess}
            onClose={onClose}
            onPaymentComplete={handlePaymentComplete}
          />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentModal;