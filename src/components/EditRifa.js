import React, { useState, useEffect } from 'react';
import { useNavigate, useParams }  from 'react-router-dom';

import { API_BASE } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError, showConfirm } from '../utils/swal';
import { catalogosService } from '../services/api';

const EditRifa = () => {
  
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [rifa, setRifa] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    fecha_fin: '',
    tipo: 'numeros',
    cantidad_elementos: 100,
    reglas: '',
    es_privada: false,
    activa: true,
    fecha_sorteo: '',
    categoria: '',
    // Nuevos campos
    pixKey: '',
    aceitaCartao: false,
    loteriaTipo: '',
    numeroSorteio: '',
    videoUrl: ''
  });

  // Tipos de rifa disponibles
  const tiposRifa = [
    { value: 'numeros', label: 'Números', icon: '🔢' },
    { value: 'baraja', label: 'Baraja', icon: '🃏' },
    { value: 'abecedario', label: 'Abecedario', icon: '🔤' },
    { value: 'animales', label: 'Animales', icon: '🐘' },
    { value: 'colores', label: 'Colores', icon: '🎨' },
    { value: 'equipos', label: 'Equipos', icon: '⚽' },
    { value: 'emojis', label: 'Emojis', icon: '😀' },
    { value: 'paises', label: 'Países', icon: '🌍' }
  ];

  // Tipos de lotería
  const tiposLoteria = [
    { value: 'federal', label: 'Loteria Federal' },
    { value: 'megasena', label: 'Mega-Sena' },
    { value: 'quina', label: 'Quina' },
    { value: 'lotofacil', label: 'Lotofácil' },
    { value: 'lotomania', label: 'Lotomania' },
    { value: 'duplasena', label: 'Dupla Sena' },
    { value: 'timemania', label: 'Timemania' },
    { value: 'diadesorte', label: 'Dia de Sorte' }
  ];

  // Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const response = await catalogosService.getCategorias();
        setCategorias(response.categorias || []);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    };
    loadCategorias();
  }, []);

  // Cargar datos de la rifa
  useEffect(() => {
    const loadRifa = async () => {
      try {
        const response = await fetch(`${API_BASE}/rifas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const rifaData = data.rifa;
          setRifa({
            nombre: rifaData.nombre || '',
            descripcion: rifaData.descripcion || '',
            precio: rifaData.precio || '',
            fecha_fin: rifaData.fecha_fin ? rifaData.fecha_fin.split('T')[0] : '',
            tipo: rifaData.tipo || 'numeros',
            cantidad_elementos: rifaData.cantidad_elementos || 100,
            reglas: rifaData.reglas || '',
            es_privada: rifaData.es_privada || false,
            activa: rifaData.activa !== undefined ? rifaData.activa : true,
            fecha_sorteo: rifaData.fecha_sorteo ? rifaData.fecha_sorteo.split('T')[0] : '',
            categoria: rifaData.categoria || '',
            pixKey: rifaData.pixKey || '',
            aceitaCartao: rifaData.aceitaCartao || false,
            loteriaTipo: rifaData.loteriaTipo || '',
            numeroSorteio: rifaData.numeroSorteio || '',
            videoUrl: rifaData.videoUrl || ''
          });
        } else {
          showError('Erro', 'Não foi possível carregar a rifa');
          navigate('/rifas');
        }
      } catch (error) {
        console.error('Error cargando rifa:', error);
        showError('Erro', 'Erro ao carregar a rifa');
        navigate('/rifas');
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      loadRifa();
    }
  }, [id, token, navigate]);

  // Guardar cambios
  const handleSave = async (e) => {
    e.preventDefault();
    
    const confirmed = await showConfirm(
      'Salvar alterações',
      'Tem certeza que deseja salvar as alterações?',
      { confirmText: 'Salvar', confirmColor: '#00d26a' }
    );
    
    if (!confirmed) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/rifas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rifa)
      });

      if (response.ok) {
        showSuccess('Sucesso!', 'Rifa atualizada com sucesso');
        navigate('/rifas');
      } else {
        const error = await response.json();
        showError('Erro', error.error || 'Não foi possível atualizar a rifa');
      }
    } catch (error) {
      console.error('Error actualizando rifa:', error);
      showError('Erro', 'Erro ao atualizar a rifa');
    } finally {
      setSaving(false);
    }
  };

  // Dar de baja (soft delete)
  const handleDeactivate = async () => {
    const confirmed = await showConfirm(
      'Desativar Rifa',
      `Tem certeza que deseja desativar "${rifa.nombre}"? A rifa não ficará mais visível para participantes.`,
      { confirmText: 'Desativar', confirmColor: '#e74c3c' }
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${API_BASE}/rifas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activa: false })
      });

      if (response.ok) {
        showSuccess('Desativada!', 'Rifa desativada com sucesso');
        navigate('/rifas');
      } else {
        showError('Erro', 'Não foi possível desativar a rifa');
      }
    } catch (error) {
      console.error('Error desactivando rifa:', error);
      showError('Erro', 'Erro ao desativar a rifa');
    }
  };

  // Eliminar permanentemente
  const handleDelete = async () => {
    const confirmed = await showConfirm(
      'Eliminar Rifa',
      `Tem certeza que deseja ELIMINAR PERMANENTEMENTE "${rifa.nombre}"? Esta ação não pode ser desfeita.`,
      { confirmText: 'Eliminar', confirmColor: '#e74c3c' }
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${API_BASE}/rifas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Eliminada!', 'Rifa eliminada permanentemente');
        navigate('/rifas');
      } else {
        showError('Erro', 'Não foi possível eliminar a rifa');
      }
    } catch (error) {
      console.error('Error eliminando rifa:', error);
      showError('Erro', 'Erro ao eliminar a rifa');
    }
  };

  if (loading) {
    return (
      <div className="edit-rifa-loading">
        <div className="loading-spinner"></div>
        <p>Carregando rifa...</p>
      </div>
    );
  }

  return (
    <div className="edit-rifa-container">
      <div className="edit-rifa-header">
        <button className="back-btn" onClick={() => navigate('/rifas')}>
          ← Voltar
        </button>
        <h1 className="edit-rifa-title">Editar Rifa</h1>
        <div className="edit-rifa-actions">
          <button 
            className="action-btn deactivate"
            onClick={handleDeactivate}
            disabled={!rifa.activa}
          >
            🔴 Desativar
          </button>
          <button 
            className="action-btn delete"
            onClick={handleDelete}
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="edit-rifa-form">
        <div className="form-section">
          <h2>Informações Básicas</h2>
          
          <div className="form-group">
            <label>Nome da Rifa *</label>
            <input
              type="text"
              value={rifa.nombre}
              onChange={(e) => setRifa({...rifa, nombre: e.target.value})}
              required
              placeholder="Ex: iPhone 15 Pro Max"
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={rifa.descripcion}
              onChange={(e) => setRifa({...rifa, descripcion: e.target.value})}
              rows="4"
              placeholder="Descreva os prêmios, como funcionará o sorteio, etc."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preço por número (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rifa.precio}
                onChange={(e) => setRifa({...rifa, precio: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo de Rifa *</label>
              <select
                value={rifa.tipo}
                onChange={(e) => setRifa({...rifa, tipo: e.target.value})}
              >
                {tiposRifa.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.icon} {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantidade de números *</label>
              <input
                type="number"
                min="1"
                max="10000"
                value={rifa.cantidad_elementos}
                onChange={(e) => setRifa({...rifa, cantidad_elementos: parseInt(e.target.value)})}
                required
              />
            </div>
            <div className="form-group">
              <label>Categoria *</label>
              <select
                value={rifa.categoria}
                onChange={(e) => setRifa({...rifa, categoria: e.target.value})}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Datas e Sorteio</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Data de encerramento *</label>
              <input
                type="date"
                value={rifa.fecha_fin}
                onChange={(e) => setRifa({...rifa, fecha_fin: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Data do sorteio</label>
              <input
                type="date"
                value={rifa.fecha_sorteo}
                onChange={(e) => setRifa({...rifa, fecha_sorteo: e.target.value})}
              />
            </div>
          </div>

          {/* Tipo de Sorteio */}
<div className="form-group">
  <label>Tipo de Sorteio *</label>
  <select
    value={rifa.loteriaTipo || ''}
    onChange={(e) => setRifa({...rifa, loteriaTipo: e.target.value})}
    required
  >
    <option value="">Selecione</option>
    <option value="federal">Loteria Federal</option>
    <option value="megasena">Mega-Sena</option>
    <option value="quina">Quina</option>
    <option value="lotofacil">Lotofácil</option>
    <option value="lotomania">Lotomania</option>
    <option value="duplasena">Dupla Sena</option>
    <option value="timemania">Timemania</option>
    <option value="diadesorte">Dia de Sorte</option>
  </select>
</div>

<div className="form-group">
  <label>Número do Sorteio (Opcional)</label>
  <input
    type="text"
    value={rifa.numeroSorteio || ''}
    onChange={(e) => setRifa({...rifa, numeroSorteio: e.target.value})}
    placeholder="Ex: 2654"
  />
</div>
        </div>

        <div className="form-section">
          <h2>Prêmio</h2>
          
          <div className="form-group">
            <label>Link do Vídeo (Opcional)</label>
            <input
              type="url"
              value={rifa.videoUrl}
              onChange={(e) => setRifa({...rifa, videoUrl: e.target.value})}
              placeholder="https://youtube.com/watch?v=..."
            />
            <small className="input-help">Adicione um vídeo do YouTube mostrando o prêmio</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Métodos de Pagamento</h2>
          
          <div className="form-group">
            <label>Chave PIX *</label>
            <input
              type="text"
              value={rifa.pixKey}
              onChange={(e) => setRifa({...rifa, pixKey: e.target.value})}
              placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
              required
            />
            <small className="input-help">Os pagamentos via PIX serão direcionados para esta chave</small>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rifa.aceitaCartao}
                onChange={(e) => setRifa({...rifa, aceitaCartao: e.target.checked})}
              />
              <span>Aceitar pagamento com cartão de crédito</span>
            </label>
            <small className="input-help">Os pagamentos com cartão serão processados via Stripe</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Regras e Configurações</h2>
          
          <div className="form-group">
            <label>Regras da rifa</label>
            <textarea
              value={rifa.reglas}
              onChange={(e) => setRifa({...rifa, reglas: e.target.value})}
              rows="4"
              placeholder="Defina as regras da rifa, condições de participação, etc."
            />
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rifa.es_privada}
                onChange={(e) => setRifa({...rifa, es_privada: e.target.checked})}
              />
              <span>Rifa privada (apenas com link direto)</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rifa.activa}
                onChange={(e) => setRifa({...rifa, activa: e.target.checked})}
              />
              <span>Rifa ativa (visível para participantes)</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/rifas')}>
            Cancelar
          </button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRifa;