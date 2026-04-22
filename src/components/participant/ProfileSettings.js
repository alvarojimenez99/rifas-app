import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';
import { showSuccess, showError, showConfirm } from '../../utils/swal';

const ProfileSettings = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: user?.telefono || ''
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        showSuccess('Perfil atualizado!', 'Suas informações foram atualizadas com sucesso.');
      } else {
        showError('Erro', 'Não foi possível atualizar o perfil');
      }
    } catch (error) {
      showError('Erro', 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      showError('Erro', 'As senhas não coincidem');
      return;
    }
    if (passwordData.new.length < 6) {
      showError('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    const confirmed = await showConfirm(
      'Alterar senha',
      'Tem certeza que deseja alterar sua senha?',
      { confirmText: 'Sim, alterar' }
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new
        })
      });
      if (response.ok) {
        showSuccess('Senha alterada!', 'Sua senha foi atualizada com sucesso.');
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        const error = await response.json();
        showError('Erro', error.error || 'Senha atual incorreta');
      }
    } catch (error) {
      showError('Erro', 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-settings">
      <div className="profile-header">
        <h2>⚙️ Minha Conta</h2>
        <p>Gerencie suas informações pessoais</p>
      </div>

      <div className="profile-sections">
        {/* Dados Pessoais */}
        <div className="profile-section">
          <h3>Dados Pessoais</h3>
          <form onSubmit={updateProfile} className="profile-form">
            <div className="form-group">
              <label>Nome completo</label>
              <input
                type="text"
                value={profile.nombre}
                onChange={(e) => setProfile({...profile, nombre: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                value={profile.telefono}
                onChange={(e) => setProfile({...profile, telefono: e.target.value})}
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>

        {/* Alterar Senha */}
        <div className="profile-section">
          <h3>Alterar Senha</h3>
          <form onSubmit={changePassword} className="profile-form">
            <div className="form-group">
              <label>Senha atual</label>
              <input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Nova senha</label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar nova senha</label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;