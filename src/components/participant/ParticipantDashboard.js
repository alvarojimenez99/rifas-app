import React, { useState } from 'react';
import ActiveRaffles from './ActiveRaffles';
import MyHistory from './MyHistory';
import MyPrizes from './MyPrizes';
import ProfileSettings from './ProfileSettings';
import MinhasRifas from './MinhasRifas'; // ← Agrega este import

const ParticipantDashboard = () => {
  const [activeTab, setActiveTab] = useState('raffles');

  const tabs = [
    { id: 'raffles', label: '🎯 Sorteios Ativos', icon: '🎯' },
    { id: 'myRifas', label: '🎯 Minhas Rifas', icon: '🎯' }, // ← Nuevo tab
    { id: 'history', label: '📜 Meu Histórico', icon: '📜' },
    { id: 'prizes', label: '🏆 Meus Prêmios', icon: '🏆' },
    { id: 'profile', label: '⚙️ Minha Conta', icon: '⚙️' }
  ];

  return (
    <div className="participant-dashboard">
      <div className="dashboard-header">
        <h1>🎉 Bem-vindo, Participante!</h1>
        <p>Escolha sua rifa favorita e concorra a prêmios incríveis</p>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'raffles' && <ActiveRaffles />}
        {activeTab === 'myRifas' && <MinhasRifas />} {/* ← Nuevo contenido */}
        {activeTab === 'history' && <MyHistory />}
        {activeTab === 'prizes' && <MyPrizes />}
        {activeTab === 'profile' && <ProfileSettings />}
      </div>
    </div>
  );
};

export default ParticipantDashboard;