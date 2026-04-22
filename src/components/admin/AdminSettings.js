import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';
import { showSuccess, showError } from '../../utils/swal';

const AdminSettings = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    nome: '',
    email: '',
    telefone: '',
    notificacoes: true,
    notificacao_email: true,
    tema: 'light'
  });

  useEffect(() => {
    if (user) {
      setSettings({
        nome: user.nombre || '',
        email: user.email || '',
        telefone: user.telefono || '',
        notificacoes: true,
        notificacao_email: true,
        tema: 'light'
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: settings.nome,
          telefono: settings.telefono
        })
      });

      if (response.ok) {
        showSuccess('Sucesso!', 'Suas configurações foram salvas');
      } else {
        showError('Erro', 'Não foi possível salvar as configurações');
      }
    } catch (error) {
      showError('Erro', 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h2>⚙️ Configurações</h2>
        <p>Gerencie suas preferências e informações da conta</p>
      </div>

      <div className="settings-grid">
        {/* Perfil */}
        <div className="settings-card">
          <div className="card-icon">👤</div>
          <h3>Perfil</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Nome completo</label>
              <input
                type="text"
                value={settings.nome}
                onChange={(e) => setSettings({...settings, nome: e.target.value})}
                className="input-modern"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={settings.email}
                disabled
                className="input-modern disabled"
              />
              <small>O email não pode ser alterado</small>
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                value={settings.telefone}
                onChange={(e) => setSettings({...settings, telefone: e.target.value})}
                className="input-modern"
              />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="settings-card">
          <div className="card-icon">🔔</div>
          <h3>Notificações</h3>
          <div className="settings-options">
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.notificacoes}
                onChange={(e) => setSettings({...settings, notificacoes: e.target.checked})}
              />
              <span>Receber notificações no painel</span>
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.notificacao_email}
                onChange={(e) => setSettings({...settings, notificacao_email: e.target.checked})}
              />
              <span>Receber notificações por email</span>
            </label>
          </div>
        </div>

        {/* Aparência */}
        <div className="settings-card">
          <div className="card-icon">🎨</div>
          <h3>Aparência</h3>
          <div className="theme-options">
            <button 
              className={`theme-btn ${settings.tema === 'light' ? 'active' : ''}`}
              onClick={() => setSettings({...settings, tema: 'light'})}
            >
              ☀️ Claro
            </button>
            <button 
              className={`theme-btn ${settings.tema === 'dark' ? 'active' : ''}`}
              onClick={() => setSettings({...settings, tema: 'dark'})}
            >
              🌙 Escuro
            </button>
          </div>
        </div>

        {/* Informações da conta */}
        <div className="settings-card">
          <div className="card-icon">ℹ️</div>
          <h3>Informações</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Membro desde:</span>
              <strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}</strong>
            </div>
            <div className="info-item">
              <span>Total de rifas:</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Plano:</span>
              <strong className="plan-badge">Gratuito</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn-save" onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>

      <style jsx>{`
        .admin-settings {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: transparent;
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header h2 {
          font-size: 28px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .settings-header p {
          color: #94a3b8;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .settings-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s;
        }

        .settings-card:hover {
          transform: translateY(-2px);
        }

        .card-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }

        .settings-card h3 {
          font-size: 20px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .form-group small {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 6px;
        }

        .input-modern {
          width: 100%;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 14px;
          color: #f1f5f9;
          transition: all 0.2s;
        }

        .input-modern:focus {
          outline: none;
          border-color: #f59e0b;
        }

        .input-modern.disabled {
          background: rgba(15, 23, 42, 0.5);
          color: #94a3b8;
          cursor: not-allowed;
        }

        .settings-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-option {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          color: #cbd5e1;
        }

        .toggle-option input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #f59e0b;
        }

        .theme-options {
          display: flex;
          gap: 12px;
        }

        .theme-btn {
          flex: 1;
          padding: 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          color: #cbd5e1;
          transition: all 0.2s;
        }

        .theme-btn:hover {
          background: rgba(15, 23, 42, 1);
        }

        .theme-btn.active {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-item span {
          color: #94a3b8;
          font-size: 14px;
        }

        .info-item strong {
          color: #f1f5f9;
        }

        .plan-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
        }

        .settings-actions {
          text-align: center;
        }

        .btn-save {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 40px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          
          .admin-settings {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;