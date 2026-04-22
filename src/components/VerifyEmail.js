import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE}/verify/${token}`);
        
        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          setMessage(data.message || 'Email verificado com sucesso!');
        } else {
          const error = await response.json();
          setStatus('error');
          setMessage(error.error || 'Link inválido ou expirado');
        }
      } catch (error) {
        console.error('Error verificando email:', error);
        setStatus('error');
        setMessage('Erro ao verificar email. Tente novamente.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a2a, #0f0f2a)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Verificando seu email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a2a, #0f0f2a)',
        color: 'white'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          padding: '40px',
          borderRadius: '24px',
          maxWidth: '500px',
          margin: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ color: '#00d26a', marginBottom: '16px' }}>Email verificado!</h1>
          <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.8)' }}>{message}</p>
          <Link 
            to="/landing" 
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: 'linear-gradient(135deg, #00d26a, #00b85a)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '30px',
              fontWeight: '600',
              marginRight: '12px'
            }}
          >
            Fazer login
          </Link>
          <Link 
            to="/" 
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: 'transparent',
              border: '1px solid #00d26a',
              color: '#00d26a',
              textDecoration: 'none',
              borderRadius: '30px',
              fontWeight: '600'
            }}
          >
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a2a, #0f0f2a)',
      color: 'white'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        padding: '40px',
        borderRadius: '24px',
        maxWidth: '500px',
        margin: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h1 style={{ color: '#e74c3c', marginBottom: '16px' }}>Link inválido</h1>
        <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.8)' }}>{message}</p>
        <Link 
          to="/landing" 
          style={{
            display: 'inline-block',
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #00d26a, #00b85a)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '30px',
            fontWeight: '600'
          }}
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;