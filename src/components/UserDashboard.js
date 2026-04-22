import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useRifas } from '../contexts/RifasContext';
import AdCarousel from './AdCarousel';


const UserDashboard = () => {
  const { t } = useTranslation();
  const { myRifas, loading, error, loadMyRifas } = useRifas();
  const location = useLocation();
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'activas', 'finalizadas', 'privadas'
  const [busqueda, setBusqueda] = useState(''); // Filtro de búsqueda por texto
  const [currentRifaIndex, setCurrentRifaIndex] = useState(0); // Índice actual del carrusel
  
  // Debug: verificar que rifas llegue correctamente
  console.log('UserDashboard - myRifas del contexto:', myRifas);

  // Filtrar rifas según el filtro seleccionado y búsqueda
  const rifasFiltradas = myRifas.filter(rifa => {
    // Filtro por estado
    let cumpleFiltro = true;
    switch (filtro) {
      case 'activas':
        cumpleFiltro = rifa.activa === true;
        break;
      case 'finalizadas':
        cumpleFiltro = rifa.activa === false;
        break;
      case 'privadas':
        cumpleFiltro = rifa.es_privada === true;
        break;
      default:
        cumpleFiltro = true;
    }
    
    // Filtro por búsqueda de texto
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase();
      const cumpleBusqueda = 
        rifa.nombre.toLowerCase().includes(terminoBusqueda) ||
        (rifa.descripcion && rifa.descripcion.toLowerCase().includes(terminoBusqueda)) ||
        rifa.tipo.toLowerCase().includes(terminoBusqueda);
      
      return cumpleFiltro && cumpleBusqueda;
    }
    
    return cumpleFiltro;
  });

  // Calcular estadísticas de las rifas
  const estadisticas = {
    total: myRifas.length,
    activas: myRifas.filter(r => r.activa === true).length,
    finalizadas: myRifas.filter(r => r.activa === false).length,
    privadas: myRifas.filter(r => r.es_privada === true).length,
    totalRecaudado: myRifas.reduce((total, r) => total + (parseFloat(r.precio) * parseInt(r.elementos_vendidos || 0)), 0)
  };

  // Funciones para el scroll container
  const scrollToRifa = (index) => {
    setCurrentRifaIndex(index);
    const container = document.querySelector('.scroll-container');
    if (container) {
      const cardHeight = container.scrollHeight / rifasFiltradas.length;
      container.scrollTo({
        top: index * cardHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const cardHeight = container.scrollHeight / rifasFiltradas.length;
    const scrollTop = container.scrollTop;
    const newIndex = Math.round(scrollTop / cardHeight);
    
    if (newIndex !== currentRifaIndex && newIndex >= 0 && newIndex < rifasFiltradas.length) {
      setCurrentRifaIndex(newIndex);
    }
  };

  // Resetear índice cuando cambien los filtros
  React.useEffect(() => {
    setCurrentRifaIndex(0);
  }, [filtro, busqueda]);

  // Recargar rifas cuando se navega al dashboard
  useEffect(() => {
    // Recargar rifas cada vez que se monte el componente o se navegue a esta ruta
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      loadMyRifas();
    }
  }, [location.pathname, loadMyRifas]);

  // Recargar rifas cuando la ventana vuelve a tener foco (útil si el usuario cambia de pestaña)
  useEffect(() => {
    const handleFocus = () => {
      // Solo recargar si estamos en el dashboard
      if (location.pathname === '/' || location.pathname === '/dashboard') {
        loadMyRifas();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [location.pathname, loadMyRifas]);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="dashboard-container dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="dashboard-container dashboard">
        <div className="error-state">
          <h2>❌ {t('dashboard.error')}</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container dashboard">
      <div className="dashboard-header">
        <h1>👤 {t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* Carrusel de anuncios - Mismo estilo que el portal */}
      <AdCarousel 
        placement="dashboard_banner" 
        interval={35000} 
        maxAds={5}
        className="desktop-only"
      />

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <span className="stat-number">{estadisticas.total}</span>
            <span className="stat-label">{t('dashboard.stats.totalRifas')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">{estadisticas.activas}</span>
            <span className="stat-label">{t('dashboard.stats.activas')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <span className="stat-number">{estadisticas.finalizadas}</span>
            <span className="stat-label">{t('dashboard.stats.finalizadas')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-number">${estadisticas.totalRecaudado}</span>
            <span className="stat-label">{t('dashboard.stats.totalRecaudado')}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        {/* Campo de búsqueda */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={`🔍 ${t('dashboard.search.placeholder')}`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            {busqueda && (
              <button 
                className="clear-search-btn"
                onClick={() => setBusqueda('')}
                title={t('dashboard.search.clear')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtros por estado + acción crear */}
        <div className="filtros-dashboard">
          <button 
            className={`filtro-dashboard-btn ${filtro === 'todas' ? 'activo' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            {t('dashboard.filters.all')} ({estadisticas.total})
          </button>
          <button 
            className={`filtro-dashboard-btn ${filtro === 'activas' ? 'activo' : ''}`}
            onClick={() => setFiltro('activas')}
          >
            {t('dashboard.filters.active')} ({estadisticas.activas})
          </button>
          <button 
            className={`filtro-dashboard-btn ${filtro === 'finalizadas' ? 'activo' : ''}`}
            onClick={() => setFiltro('finalizadas')}
          >
            {t('dashboard.filters.finished')} ({estadisticas.finalizadas})
          </button>
          <Link to="/gestionar" className="btn-create-rifa">
            <span className="btn-icon">+</span>
            <span>{t('dashboard.actions.createRaffle')}</span>
          </Link>
        </div>
      </div>

      {/* Cards de rifas - Desktop */}
      <div className="dashboard-rifas-grid desktop-only">
        {rifasFiltradas.length === 0 ? (
          <div className="no-rifas-card">
            <div className="no-rifas-content">
              <div className="no-rifas-icon">🎯</div>
              <h3>{t('dashboard.empty.title')}</h3>
              <p>{t('dashboard.empty.message')}</p>
              <Link to="/gestionar" className="btn-primary">{t('dashboard.empty.createButton')}</Link>
            </div>
            {/* Sugerencias de afiliados cuando no hay rifas */}
            <div style={{ marginTop: '30px' }}>
              
            </div>
          </div>
        ) : (
          <div className="rifas-cards-grid">
            {rifasFiltradas.map(rifa => {
              const primeraFoto = rifa.fotosPremios && rifa.fotosPremios.length > 0 
                ? (rifa.fotosPremios[0].url || rifa.fotosPremios[0].url_foto)
                : null;
              const porcentajeProgreso = Math.round(((rifa.elementos_vendidos || 0) / rifa.cantidad_elementos) * 100);
              
              return (
                <div key={rifa.id} className="rifa-dashboard-card">
                  {primeraFoto && (
                    <div className="rifa-card-image">
                      <img src={primeraFoto} alt={rifa.nombre} />
                      <div className="rifa-card-image-overlay">
                        <span className={`rifa-card-status-badge ${rifa.activa ? 'active' : 'finished'}`}>
                          {rifa.activa ? `🟢 ${t('dashboard.card.status.active')}` : `🔴 ${t('dashboard.card.status.finished')}`}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="rifa-card-content">
                    {/* Header compacto: Precio + Estado */}
                    
                    
                    {/* Título del premio */}
                    <h3 className="rifa-card-title">{rifa.nombre}</h3>
                    <div className="rifa-card-top">
                      <div className="rifa-card-price">
                        <span className="rifa-price-amount">${rifa.precio}</span>
                      </div>
                    </div>
                    {/* Info compacta en una línea */}
                    <div className="rifa-card-info-line">
                      <span className="rifa-info-item">
                        <span className="rifa-info-icon">🎯</span>
                        <span className="rifa-info-text">
                          {rifa.tipo === 'numeros' ? t('dashboard.card.type.numbers') :
                           rifa.tipo === 'abecedario' ? t('dashboard.card.type.alphabet') :
                           rifa.tipo === 'baraja' ? t('dashboard.card.type.deck') :
                           rifa.tipo === 'colores' ? t('dashboard.card.type.colors') :
                           rifa.tipo === 'equipos' ? t('dashboard.card.type.teams') : rifa.tipo}
                        </span>
                      </span>
                      <span className="rifa-info-divider">•</span>
                      <span className="rifa-info-item">
                        <span className="rifa-info-icon">👥</span>
                        <span className="rifa-info-text">{rifa.total_participantes || 0} {t('dashboard.card.participants')}</span>
                      </span>
                      <span className="rifa-info-divider">•</span>
                      <span className="rifa-info-item">
                        <span className="rifa-info-icon">📅</span>
                        <span className="rifa-info-text">
                          {new Date(rifa.fecha_fin).toLocaleDateString('es-MX', { 
                            day: '2-digit', 
                            month: 'short' 
                          })}
                        </span>
                      </span>
                    </div>
                    
                    {/* Progreso compacto */}
                    <div className="rifa-card-progress-compact">
                      <div className="rifa-progress-top">
                        <span className="rifa-progress-label">{t('dashboard.card.progress')}</span>
                        <span className="rifa-progress-stats">{rifa.elementos_vendidos || 0} / {rifa.cantidad_elementos}</span>
                      </div>
                      <div className="rifa-progress-bar-compact">
                        <div 
                          className="rifa-progress-fill-compact"
                          style={{ width: `${porcentajeProgreso}%` }}
                        ></div>
                      </div>
                      <span className="rifa-progress-percentage-compact">{porcentajeProgreso}%</span>
                    </div>
                    
                    {/* Botones compactos */}
                    <div className="rifa-card-actions-compact">
                      <Link to={`/gestionar/${rifa.id}`} className="rifa-card-btn-compact rifa-card-btn-primary-compact">
                        ⚙️ {t('dashboard.actions.manage')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Premios Populares - Siempre visible */}
        {rifasFiltradas.length > 0 && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            
          </div>
        )}
      </div>

      {/* Scroll Container de Rifas - Solo Móvil */}
      <div className="rifas-scroll-container mobile-only">
        {rifasFiltradas.length === 0 ? (
          <div className="no-rifas">
            <h3>{t('dashboard.empty.title')}</h3>
            <p>{t('dashboard.empty.message')}</p>
            <Link to="/gestionar" className="btn-primary">{t('dashboard.empty.createButton')}</Link>
          </div>
        ) : (
          <div className="scroll-wrapper">
            {/* Indicadores de navegación */}
            <div className="scroll-indicators">
              <span className="scroll-counter">
                {currentRifaIndex + 1} {t('dashboard.scroll.counter')} {rifasFiltradas.length}
              </span>
              <div className="scroll-dots">
                {rifasFiltradas.map((_, index) => (
                  <button
                    key={index}
                    className={`scroll-dot ${index === currentRifaIndex ? 'active' : ''}`}
                    onClick={() => scrollToRifa(index)}
                  />
                ))}
              </div>
            </div>

            {/* Contenedor de scroll con 3 cards visibles */}
            <div 
              className="scroll-container"
              onScroll={handleScroll}
            >
              {rifasFiltradas.map((rifa, index) => (
                <div 
                  key={rifa.id} 
                  className={`aurela-card-premium scroll-card ${index === currentRifaIndex ? 'active' : ''}`}
                >
                  {/* Header en una sola línea */}
                  <div className="aurela-card-header">
                    <h3 className="aurela-card-title">{rifa.nombre}</h3>
                    <div className="aurela-card-badges">
                      <span className={`aurela-status-badge ${rifa.activa ? 'active' : 'finished'}`}>
                        {rifa.activa ? `🟢 ${t('dashboard.card.status.active')}` : `🔴 ${t('dashboard.card.status.finished')}`}
                      </span>
                      {rifa.es_privada && <span className="aurela-privacy-badge">🔒 {t('dashboard.card.status.private')}</span>}
                    </div>
                    <div className="aurela-card-price">
                      <span className="aurela-price-symbol">$</span>
                      <span className="aurela-price-amount">{rifa.precio}</span>
                    </div>
                  </div>

                  {/* Información principal - Layout compacto */}
                  <div className="aurela-card-content">
                    <div className="aurela-info-grid-compact">
                      <div className="aurela-info-item-compact">
                        <div className="aurela-info-icon-compact">🎯</div>
                        <div className="aurela-info-content-compact">
                          <span className="aurela-info-label-compact">{t('dashboard.card.typeLabel')}</span>
                          <span className="aurela-info-value-compact">
                            {rifa.tipo === 'numeros' ? t('dashboard.card.type.numbers') :
                             rifa.tipo === 'abecedario' ? t('dashboard.card.type.alphabet') :
                             rifa.tipo === 'baraja' ? t('dashboard.card.type.deck') :
                             rifa.tipo === 'colores' ? t('dashboard.card.type.colors') :
                             rifa.tipo === 'equipos' ? t('dashboard.card.type.teams') : rifa.tipo}
                          </span>
                        </div>
                      </div>

                      <div className="aurela-info-item-compact">
                        <div className="aurela-info-icon-compact">📊</div>
                        <div className="aurela-info-content-compact">
                          <span className="aurela-info-label-compact">{t('dashboard.card.progressLabel')}</span>
                          <span className="aurela-info-value-compact">{rifa.elementos_vendidos || 0}/{rifa.cantidad_elementos}</span>
                        </div>
                      </div>

                      <div className="aurela-info-item-compact">
                        <div className="aurela-info-icon-compact">👥</div>
                        <div className="aurela-info-content-compact">
                          <span className="aurela-info-label-compact">{t('dashboard.card.participantsLabel')}</span>
                          <span className="aurela-info-value-compact">{rifa.total_participantes || 0}</span>
                        </div>
                      </div>

                      <div className="aurela-info-item-compact">
                        <div className="aurela-info-icon-compact">📅</div>
                        <div className="aurela-info-content-compact">
                          <span className="aurela-info-label-compact">{t('dashboard.card.ends')}</span>
                          <span className="aurela-info-value-compact">{new Date(rifa.fecha_fin).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="aurela-progress-section">
                      <div className="aurela-progress-header">
                        <span className="aurela-progress-label">{t('dashboard.card.progressSale')}</span>
                        <span className="aurela-progress-percentage">
                          {Math.round(((rifa.elementos_vendidos || 0) / rifa.cantidad_elementos) * 100)}%
                        </span>
                      </div>
                      <div className="aurela-progress-bar">
                        <div 
                          className="aurela-progress-fill"
                          style={{
                            width: `${((rifa.elementos_vendidos || 0) / rifa.cantidad_elementos) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Descripción */}
                    {rifa.descripcion && (
                      <div className="aurela-description-section">
                        <p className="aurela-description">{rifa.descripcion}</p>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="aurela-card-actions">
                    <Link to={`/gestionar/${rifa.id}`} className="aurela-btn-primary">
                      <span className="aurela-btn-icon">⚙️</span>
                      <span className="aurela-btn-text">{t('dashboard.actions.manage')}</span>
                    </Link>
                    <Link to={`/public/${rifa.id}`} className="aurela-btn-secondary">
                      <span className="aurela-btn-icon">👁️</span>
                      <span className="aurela-btn-text">{t('dashboard.actions.viewPublic')}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Premios Populares - Siempre visible en móvil también */}
        {rifasFiltradas.length > 0 && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
