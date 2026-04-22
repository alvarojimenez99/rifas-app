import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { showConfirm, showSuccess, showError } from '../utils/swal';

const RifasList = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalFiltered, setTotalFiltered] = useState(0); // Elimina esta línea

  // Cargar rifas del backend
  const loadRifas = useCallback(async () => {
    if (!token) {
      console.error('No hay token de autenticación');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/rifas/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('Token inválido o expirado');
        navigate('/landing');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setRifas(data.rifas || []);
      } else {
        showError('Error', 'No se pudieron cargar las rifas');
      }
    } catch (error) {
      console.error('Error en fetch:', error);
      showError('Error', 'Error al cargar las rifas');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      loadRifas();
    }
  }, [token, loadRifas]);

  // Filtrar rifas
  const filteredRifas = rifas.filter(rifa => {
    const matchesSearch = rifa.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rifa.id?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && rifa.activa) ||
                          (statusFilter === 'inactive' && !rifa.activa);
    const matchesTipo = tipoFilter === 'all' || rifa.tipo === tipoFilter;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRifas = filteredRifas.slice(indexOfFirstItem, indexOfLastItem);
  const totalFilteredCount = filteredRifas.length;
  const totalFilteredPages = Math.ceil(totalFilteredCount / itemsPerPage);

  // Actualizar totalFiltered cuando cambie filteredRifas
  useEffect(() => {
    setTotalFiltered(totalFilteredCount);
  }, [totalFilteredCount]);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Eliminar rifa (soft delete)
  const handleDeleteRifa = async (rifaId, rifaNombre) => {
    const confirmed = await showConfirm(
      'Eliminar Rifa',
      `¿Estás seguro de que quieres eliminar "${rifaNombre}"? Esta acción no se puede deshacer.`,
      { confirmText: 'Eliminar', confirmColor: '#e74c3c' }
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${API_BASE}/rifas/${rifaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showSuccess('Eliminada', 'La rifa ha sido eliminada correctamente');
        loadRifas();
      } else {
        showError('Error', 'No se pudo eliminar la rifa');
      }
    } catch (error) {
      console.error('Error eliminando rifa:', error);
      showError('Error', 'Error al eliminar la rifa');
    }
  };

  // Activar/Desactivar rifa
  const handleToggleStatus = async (rifa) => {
    const action = rifa.activa ? 'desactivar' : 'activar';
    const confirmed = await showConfirm(
      `${action === 'activar' ? 'Activar' : 'Desactivar'} Rifa`,
      `¿Estás seguro de que quieres ${action} "${rifa.nombre}"?`,
      { confirmText: action === 'activar' ? 'Activar' : 'Desactivar' }
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${API_BASE}/rifas/${rifa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activa: !rifa.activa })
      });
      
      if (response.ok) {
        showSuccess('Actualizado', `La rifa ha sido ${action === 'activar' ? 'activada' : 'desactivada'} correctamente`);
        loadRifas();
      } else {
        showError('Error', 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showError('Error', 'Error al actualizar el estado');
    }
  };

  // Tipos de rifa disponibles
  const tiposRifa = [
    { value: 'all', label: 'Todos' },
    { value: 'numeros', label: 'Números' },
    { value: 'baraja', label: 'Baraja' },
    { value: 'abecedario', label: 'Abecedario' },
    { value: 'animales', label: 'Animales' },
    { value: 'colores', label: 'Colores' },
    { value: 'equipos', label: 'Equipos' },
    { value: 'emojis', label: 'Emojis' },
    { value: 'paises', label: 'Países' }
  ];

  // Estados de rifa
  const estadosRifa = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativas' },
    { value: 'inactive', label: 'Finalizadas' }
  ];

  return (
    <div className="rifas-list-container">
      <div className="rifas-list-header">
        <div>
          <h1 className="rifas-list-title">Gestão de Rifas</h1>
          <p className="rifas-list-subtitle">Gerencie todas as suas rifas em um só lugar</p>
        </div>
        <button 
          className="rifas-create-btn"
          onClick={() => navigate('/gestionar')}
        >
          <span>➕</span>
          <span>Criar Nova Rifa</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="rifas-filters">
        <div className="rifas-search">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="rifas-filter-group">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {estadosRifa.map(estado => (
              <option key={estado.value} value={estado.value}>{estado.label}</option>
            ))}
          </select>
          <select
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {tiposRifa.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="rifas-stats">
        <div className="rifas-stat">
          <span className="rifas-stat-value">{totalFilteredCount}</span>
          <span className="rifas-stat-label">Rifas encontradas</span>
        </div>
        <div className="rifas-stat">
          <span className="rifas-stat-value">{rifas.filter(r => r.activa).length}</span>
          <span className="rifas-stat-label">Ativas</span>
        </div>
        <div className="rifas-stat">
          <span className="rifas-stat-value">{rifas.filter(r => !r.activa).length}</span>
          <span className="rifas-stat-label">Finalizadas</span>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="rifas-loading">
          <div className="loading-spinner"></div>
          <p>Carregando rifas...</p>
        </div>
      ) : currentRifas.length === 0 ? (
        <div className="rifas-empty">
          <span className="rifas-empty-icon">🎯</span>
          <h3>Nenhuma rifa encontrada</h3>
          <p>Comece criando sua primeira rifa</p>
          <button 
            className="rifas-create-btn-secondary"
            onClick={() => navigate('/gestionar')}
          >
            Criar Nova Rifa
          </button>
        </div>
      ) : (
        <>
          <div className="rifas-table-container">
            <table className="rifas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rifa</th>
                  <th>Tipo</th>
                  <th>Preço</th>
                  <th>Participantes</th>
                  <th>Recaudado</th>
                  <th>Criação</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentRifas.map((rifa) => (
                  <tr key={rifa.id} className={!rifa.activa ? 'rifa-inactive-row' : ''}>
                    <td className="rifa-id">#{rifa.id?.slice(-6)}</td>
                    <td className="rifa-name">
                      <div>
                        <strong>{rifa.nombre}</strong>
                        <small>{rifa.descripcion?.substring(0, 50)}...</small>
                      </div>
                    </td>
                    <td>
                      <span className="rifa-tipo-badge">{tiposRifa.find(t => t.value === rifa.tipo)?.label || rifa.tipo}</span>
                    </td>
                    <td>{formatCurrency(rifa.precio)}</td>
                    <td>{rifa.total_participantes || 0}</td>
                    <td>{formatCurrency(rifa.total_recaudado || 0)}</td>
                    <td>{formatDate(rifa.fecha_creacion)}</td>
                    <td>
                      <span className={`rifa-status-badge ${rifa.activa ? 'active' : 'inactive'}`}>
                        {rifa.activa ? 'Ativa' : 'Finalizada'}
                      </span>
                    </td>
                    <td className="rifa-actions">
                    <button
  className="rifa-action-btn view"
  onClick={() => navigate(`/rifa/${rifa.id}`)}
  title="Ver detalles"
>
  👁️
</button>
                      <button
                        className="rifa-action-btn edit"
                        onClick={() => navigate(`/gestionar/${rifa.id}/editar`)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={`rifa-action-btn ${rifa.activa ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleStatus(rifa)}
                        title={rifa.activa ? 'Desactivar' : 'Activar'}
                      >
                        {rifa.activa ? '🔴' : '🟢'}
                      </button>
                     
                     
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalFilteredPages > 1 && (
            <div className="rifas-pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              <div className="pagination-pages">
                {[...Array(totalFilteredPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`pagination-page ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalFilteredPages}
                className="pagination-btn"
              >
                Próximo →
              </button>
            </div>
          )}

          <div className="rifas-footer-info">
            <span>Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalFilteredCount)} de {totalFilteredCount} rifas</span>
          </div>
        </>
      )}
    </div>
  );
};

export default RifasList;