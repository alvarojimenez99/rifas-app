import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    rifas_ativas: 0,
    rifas_total: 0,
    participantes_total: 0,
    receita_total: 0,
    participantes_mes: 0
  });
  const [rifasRecentes, setRifasRecentes] = useState([]);
  const [participantesRecentes, setParticipantesRecentes] = useState([]);
  const [vendasPorDia, setVendasPorDia] = useState([]);
  const [rifasPorStatus, setRifasPorStatus] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const COLORS = ['#00d26a', '#ffd700', '#ffb347', '#e74c3c', '#3498db', '#9b59b6'];

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Estadísticas generales
      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Rifas recientes
      const rifasRes = await fetch(`${API_BASE}/admin/rifas-recentes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rifasData = await rifasRes.json();
      setRifasRecentes(rifasData.rifas || []);

      // Participantes recientes
      const participantesRes = await fetch(`${API_BASE}/admin/participantes-recentes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const participantesData = await participantesRes.json();
      setParticipantesRecentes(participantesData.participantes || []);

      // Ventas por día
      const vendasRes = await fetch(`${API_BASE}/admin/vendas-por-dia?periodo=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vendasData = await vendasRes.json();
      setVendasPorDia(vendasData.vendas || []);

      // Rifas por estado (activas vs finalizadas)
      const statusRes = await fetch(`${API_BASE}/admin/rifas-por-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusRes.json();
      setRifasPorStatus(statusData.status || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [token, selectedPeriod]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-container">
        {/* Header */}
        <div className="admin-dashboard-header">
          <div>
            <h1 className="admin-dashboard-title">
              Bem-vindo, <span>{user?.nombre || 'Administrador'}</span>
            </h1>
            <p className="admin-dashboard-subtitle">
              Gerencie suas rifas, participantes e acompanhe os resultados
            </p>
          </div>
          <div className="admin-dashboard-actions">
            <button 
              className="admin-btn-primary"
              onClick={() => navigate('/gestionar')}
            >
              <span>➕</span>
              <span>Criar Nova Rifa</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🎯</div>
            <div className="admin-stat-info">
              <h3>{stats.rifas_ativas || 0}</h3>
              <p>Rifas Ativas</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div className="admin-stat-info">
              <h3>{stats.participantes_total || 0}</h3>
              <p>Participantes Totais</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-info">
              <h3>{formatCurrency(stats.receita_total)}</h3>
              <p>Receita Total</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📈</div>
            <div className="admin-stat-info">
              <h3>{stats.participantes_mes || 0}</h3>
              <p>Novos no Mês</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="admin-charts-grid">
          <div className="admin-chart-card">
            <div className="admin-chart-header">
              <h3>Vendas nos Últimos Dias</h3>
              <div className="admin-chart-period">
                <button 
                  className={`period-btn ${selectedPeriod === '7d' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('7d')}
                >
                  7 dias
                </button>
                <button 
                  className={`period-btn ${selectedPeriod === '30d' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('30d')}
                >
                  30 dias
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="data" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="vendas" stroke="#00d26a" strokeWidth={2} dot={{ fill: '#00d26a', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-chart-card">
            <h3>Rifas por Status</h3>
            {rifasPorStatus.length > 0 && rifasPorStatus.some(s => s.total > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rifasPorStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {rifasPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: '8px' }}
                    formatter={(value) => [`${value} rifas`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <span className="chart-empty-icon">📊</span>
                <p>Nenhuma rifa cadastrada ainda</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/gestionar')}
                  style={{ marginTop: '16px', padding: '8px 20px' }}
                >
                  Criar primeira rifa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tables Section */}
        <div className="admin-tables-grid">
          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Últimas Rifas</h3>
              <button className="admin-link-btn" onClick={() => navigate('/rifas')}>
                Ver todas →
              </button>
            </div>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rifa</th>
                    <th>Tipo</th>
                    <th>Participantes</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rifasRecentes.map((rifa) => (
                    <tr key={rifa.id}>
                      <td className="admin-table-name">{rifa.nombre}</td>
                      <td>{rifa.tipo === 'numeros' ? 'Números' : rifa.tipo}</td>
                      <td>{rifa.total_participantes || 0}</td>
                      <td>
                        <span className={`admin-status-badge ${rifa.activa ? 'active' : 'inactive'}`}>
                          {rifa.activa ? 'Ativa' : 'Finalizada'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="admin-table-btn"
                          onClick={() => navigate(`/rifa/${rifa.id}`)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Últimos Participantes</h3>
              <button className="admin-link-btn" onClick={() => navigate('/participantes')}>
                Ver todos →
              </button>
            </div>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Rifa</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participantesRecentes.map((participante) => (
                    <tr key={participante.id}>
                      <td className="admin-table-name">{participante.nombre}</td>
                      <td>{participante.rifa_nombre}</td>
                      <td>{formatCurrency(participante.total_pagado)}</td>
                      <td>
                        <span className={`admin-status-badge ${participante.estado === 'confirmado' ? 'confirmed' : 'pending'}`}>
                          {participante.estado === 'confirmado' ? 'Confirmado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-quick-actions">
          <h3>Ações Rápidas</h3>
          <div className="admin-actions-grid">
         
            <button className="admin-action-card" onClick={() => navigate('/')}>
              <span className="admin-action-icon">🏆</span>
              <span>Dashboard</span>
            </button>
            <button className="admin-action-card" onClick={() => navigate('/gestionar')}>
              <span className="admin-action-icon">➕</span>
              <span>Criar Rifa</span>
            </button>
            <button className="admin-action-card" onClick={() => navigate('/participantes')}>
              <span className="admin-action-icon">👥</span>
              <span>Gerenciar Participantes</span>
            </button>
            <button className="admin-action-card" onClick={() => navigate('/rifas')}>
              <span className="admin-action-icon">📋</span>
              <span>Todas as Rifas</span>
            </button>
            <button className="admin-action-card" onClick={() => navigate('/admin/reportes')}>
              <span className="admin-action-icon">📊</span>
              <span>Relatórios</span>
            </button>
            <button className="admin-action-card" onClick={() => navigate('/admin/configuracoes')}>
              <span className="admin-action-icon">⚙️</span>
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;