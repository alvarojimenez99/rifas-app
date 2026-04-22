import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePassword, validatePasswordMatch, validateNombre, validateTelefono } from '../../utils/validation';
import CountryCodeSelector from '../CountryCodeSelector';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [registerData, setRegisterData] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    phoneCode: '+55',
    phoneNumber: '',
    cpf: ''  // ← Campo CPF agregado
  });
  const [registerErrors, setRegisterErrors] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    phone: '',
    cpf: ''  // ← Error para CPF
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationLink, setVerificationLink] = useState('');

  // Función para formatear CPF
  const formatarCPF = (value) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
    }
    return value;
  };

  // Validar CPF (solo formato, no guarda)
  const validarFormatoCPF = (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo && cpfLimpo.length !== 11) {
      return { valid: false, error: 'CPF deve ter 11 dígitos' };
    }
    if (cpfLimpo && cpfLimpo.length === 11) {
      // Validar dígitos repetidos
      const digitosIguais = /^(\d)\1{10}$/.test(cpfLimpo);
      if (digitosIguais) {
        return { valid: false, error: 'CPF inválido' };
      }
      return { valid: true, error: '' };
    }
    return { valid: true, error: '' };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);
    
    // Validar CPF (solo formato, no se guarda)
    const cpfValidation = validarFormatoCPF(registerData.cpf);
    
    // Validar todos los campos
    const nombreValidation = validateNombre(registerData.nombre, 2);
    const emailValidation = validateEmail(registerData.email);
    const passwordValidation = validatePassword(registerData.password, 6);
    const passwordMatchValidation = validatePasswordMatch(registerData.password, registerData.confirmPassword);
    const phoneValidation = validateTelefono(registerData.phoneNumber);
    
    setRegisterErrors({
      nombre: nombreValidation.error,
      email: emailValidation.error,
      password: passwordValidation.error,
      confirmPassword: passwordMatchValidation.error,
      phone: phoneValidation.error,
      cpf: cpfValidation.error
    });
    
    if (!nombreValidation.valid || !emailValidation.valid || !passwordValidation.valid || 
        !passwordMatchValidation.valid || !phoneValidation.valid || !cpfValidation.valid) {
      return;
    }
    
    setLoading(true);
    // NOTA: El CPF NO se envía al backend, solo se usa visualmente
    const fullPhone = `${registerData.phoneCode}${registerData.phoneNumber}`;
    const result = await register({
      nombre: registerData.nombre,
      email: registerData.email,
      password: registerData.password,
      telefono: fullPhone
      // cpf NO se envía
    });
    setLoading(false);
    
    if (result.success) {
      setVerificationEmail(registerData.email);
      const token = result.verificationToken || `demo-token-${Date.now()}`;
      const link = `${window.location.origin}/verify/${token}`;
      setVerificationLink(link);
      setVerificationSent(true);
    } else {
      setError(result.error || 'Erro ao criar conta. Tente novamente.');
    }
  };

  const handleCpfChange = (e) => {
    const formatted = formatarCPF(e.target.value);
    setRegisterData({...registerData, cpf: formatted});
    
    const validation = validarFormatoCPF(formatted);
    setRegisterErrors({...registerErrors, cpf: validation.error});
  };

  if (!isOpen) return null;

  // Pantalla de verificación enviada
  if (verificationSent) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>✅ Verifique seu email</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h4>Enviamos um link de verificação</h4>
            <p>
              Enviamos um link para <strong>{verificationEmail}</strong>. 
              Clique no link para ativar sua conta.
            </p>
            <div className="verification-link-box">
              <small>🔗 Link de verificação (apenas para desenvolvimento):</small>
              <br />
              <a 
                href={verificationLink} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {verificationLink}
              </a>
            </div>
            <button 
              className="btn-primary"
              onClick={onClose}
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Modal más ancho - sin scroll */}
      <div className="modal-content register-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Criar Conta</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleRegister} className="modal-form">
          {error && (
            <div className="error-message-box">
              {error}
            </div>
          )}
          
          {/* Dos columnas para mejor distribución */}
          <div className="form-row">
            <div className="form-group">
              <label>Nome completo *</label>
              <input
                type="text"
                placeholder="Digite seu nome completo"
                value={registerData.nombre}
                onChange={(e) => {
                  const value = e.target.value;
                  setRegisterData({...registerData, nombre: value});
                  if (value) {
                    const validation = validateNombre(value, 2);
                    setRegisterErrors({...registerErrors, nombre: validation.error});
                  } else {
                    setRegisterErrors({...registerErrors, nombre: ''});
                  }
                }}
                onBlur={(e) => {
                  const validation = validateNombre(e.target.value, 2);
                  setRegisterErrors({...registerErrors, nombre: validation.error});
                }}
                required
                disabled={loading}
                className={registerErrors.nombre ? 'input-error' : ''}
              />
              {registerErrors.nombre && <span className="error-message-soft">{registerErrors.nombre}</span>}
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={registerData.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setRegisterData({...registerData, email: value});
                  if (value) {
                    const validation = validateEmail(value);
                    setRegisterErrors({...registerErrors, email: validation.error});
                  } else {
                    setRegisterErrors({...registerErrors, email: ''});
                  }
                }}
                onBlur={(e) => {
                  const validation = validateEmail(e.target.value);
                  setRegisterErrors({...registerErrors, email: validation.error});
                }}
                required
                disabled={loading}
                className={registerErrors.email ? 'input-error' : ''}
              />
              {registerErrors.email && <span className="error-message-soft">{registerErrors.email}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group phone-group">
              <label>Telefone *</label>
              <div className="phone-input-wrapper">
                <CountryCodeSelector
                  value={registerData.phoneCode}
                  onChange={(code) => setRegisterData({...registerData, phoneCode: code})}
                />
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={registerData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setRegisterData({...registerData, phoneNumber: value});
                    if (value) {
                      const validation = validateTelefono(value);
                      setRegisterErrors({...registerErrors, phone: validation.error});
                    } else {
                      setRegisterErrors({...registerErrors, phone: ''});
                    }
                  }}
                  onBlur={(e) => {
                    const validation = validateTelefono(e.target.value);
                    setRegisterErrors({...registerErrors, phone: validation.error});
                  }}
                  required
                  disabled={loading}
                  className={registerErrors.phone ? 'input-error' : ''}
                />
              </div>
              {registerErrors.phone && <span className="error-message-soft">{registerErrors.phone}</span>}
            </div>
            
            {/* Campo CPF - solo visual, obligatorio */}
            <div className="form-group">
              <label>CPF *</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={registerData.cpf}
                onChange={handleCpfChange}
                maxLength="14"
                required
                disabled={loading}
                className={registerErrors.cpf ? 'input-error' : ''}
              />
              <small className="input-help">Apenas para fins de verificação</small>
              {registerErrors.cpf && <span className="error-message-soft">{registerErrors.cpf}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Senha *</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={registerData.password}
                onChange={(e) => {
                  const value = e.target.value;
                  setRegisterData({...registerData, password: value});
                  if (value) {
                    const validation = validatePassword(value, 6);
                    setRegisterErrors({...registerErrors, password: validation.error});
                    if (registerData.confirmPassword) {
                      const matchValidation = validatePasswordMatch(value, registerData.confirmPassword);
                      setRegisterErrors({...registerErrors, confirmPassword: matchValidation.error});
                    }
                  } else {
                    setRegisterErrors({...registerErrors, password: ''});
                  }
                }}
                onBlur={(e) => {
                  const validation = validatePassword(e.target.value, 6);
                  setRegisterErrors({...registerErrors, password: validation.error});
                }}
                required
                disabled={loading}
                className={registerErrors.password ? 'input-error' : ''}
              />
              {registerErrors.password && <span className="error-message-soft">{registerErrors.password}</span>}
            </div>
            
            <div className="form-group">
              <label>Confirmar senha *</label>
              <input
                type="password"
                placeholder="Digite a senha novamente"
                value={registerData.confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setRegisterData({...registerData, confirmPassword: value});
                  if (value && registerData.password) {
                    const validation = validatePasswordMatch(registerData.password, value);
                    setRegisterErrors({...registerErrors, confirmPassword: validation.error});
                  } else {
                    setRegisterErrors({...registerErrors, confirmPassword: ''});
                  }
                }}
                onBlur={(e) => {
                  if (registerData.password) {
                    const validation = validatePasswordMatch(registerData.password, e.target.value);
                    setRegisterErrors({...registerErrors, confirmPassword: validation.error});
                  }
                }}
                required
                disabled={loading}
                className={registerErrors.confirmPassword ? 'input-error' : ''}
              />
              {registerErrors.confirmPassword && <span className="error-message-soft">{registerErrors.confirmPassword}</span>}
            </div>
          </div>
          
          <button type="submit" className="btn-primary btn-large" disabled={loading}>
            <span className="btn-icon">🚀</span>
            <span>{loading ? 'Criando conta...' : 'Criar Conta'}</span>
          </button>
        </form>
        
        
      </div>

      <style jsx>{`
        .modal-overlay {
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

        /* Modal más ancho y alto */
        .register-modal-wide {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 750px;
          max-height: 85vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Scrollbar personalizado */
        .register-modal-wide::-webkit-scrollbar {
          width: 8px;
        }

        .register-modal-wide::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .register-modal-wide::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 28px 20px;
  border-bottom: 2px solid #fef3c7;
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
  border-radius: 24px 24px 0 0;
  z-index: 10;
}

.modal-header h3 {
  font-size: 26px !important;
  font-weight: 800 !important;
  color: #422006 !important;
  margin: 0 !important;
  letter-spacing: -0.5px !important;
  background: none !important;
  -webkit-background-clip: unset !important;
  -webkit-text-fill-color: unset !important;
  background-clip: unset !important;
}

.modal-close {
  background: rgba(66, 32, 6, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #422006;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(66, 32, 6, 0.2);
  transform: scale(1.05);
}
        .modal-form {
          padding: 20px 28px;
        }

        /* Layout de dos columnas */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
          background: white;
        }

        .form-group input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .form-group input.input-error {
          border-color: #ef4444;
        }

        .phone-input-wrapper {
          display: flex;
          gap: 10px;
        }

        .phone-input-wrapper > :first-child {
          width: 90px;
          flex-shrink: 0;
        }

        .phone-input-wrapper input {
          flex: 1;
        }

        .input-help {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 6px;
        }

        .error-message-soft {
          display: block;
          font-size: 12px;
          color: #ef4444;
          margin-top: 6px;
        }

        .error-message-box {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-footer {
          text-align: center;
          padding: 16px 28px 24px;
          border-top: 1px solid #e2e8f0;
          font-size: 14px;
          color: #64748b;
        }

        .link-button {
          background: none;
          border: none;
          color: #f59e0b;
          font-weight: 600;
          cursor: pointer;
          margin-left: 6px;
        }

        .link-button:hover {
          text-decoration: underline;
        }

        .verification-link-box {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
          word-break: break-all;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .register-modal-wide {
            max-width: 95%;
            max-height: 90vh;
          }
          
          .modal-header h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterModal;