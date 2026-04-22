import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword } from '../../utils/validation';

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const emailValidation = validateEmail(loginData.email);
    const passwordValidation = validatePassword(loginData.password, 6);
    
    setLoginErrors({
      email: emailValidation.error,
      password: passwordValidation.error
    });
    
    if (!emailValidation.valid || !passwordValidation.valid) {
      return;
    }
    
    const result = await login(loginData);
    if (result.success) {
      onClose();
      setLoginData({ email: '', password: '' });
      setLoginErrors({ email: '', password: '' });
      if (result.user?.rol === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/dashboard-participante', { replace: true });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Entrar</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleLogin} className="modal-form">
          {error && (
            <div className="error-message-box">
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={loginData.email}
              onChange={(e) => {
                const value = e.target.value;
                setLoginData({...loginData, email: value});
                if (value) {
                  const validation = validateEmail(value);
                  setLoginErrors({...loginErrors, email: validation.error});
                } else {
                  setLoginErrors({...loginErrors, email: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateEmail(e.target.value);
                setLoginErrors({...loginErrors, email: validation.error});
              }}
              required
              disabled={loading}
              className={loginErrors.email ? 'input-error' : ''}
            />
            {loginErrors.email && <span className="error-message">{loginErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••"
              value={loginData.password}
              onChange={(e) => {
                const value = e.target.value;
                setLoginData({...loginData, password: value});
                if (value) {
                  const validation = validatePassword(value, 6);
                  setLoginErrors({...loginErrors, password: validation.error});
                } else {
                  setLoginErrors({...loginErrors, password: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validatePassword(e.target.value, 6);
                setLoginErrors({...loginErrors, password: validation.error});
              }}
              required
              disabled={loading}
              className={loginErrors.password ? 'input-error' : ''}
            />
            {loginErrors.password && <span className="error-message">{loginErrors.password}</span>}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <span className="btn-icon">🔑</span>
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>
        <p className="modal-footer">
        
          <button 
            className="link-button"
            onClick={() => {
              onClose();
              if (onSwitchToRegister) onSwitchToRegister();
            }}
          >
            Esqueci minha senha? 
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;