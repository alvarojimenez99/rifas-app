import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RifasProvider, useRifas } from './contexts/RifasContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { API_BASE } from './config/api';
import LandingPage from './components/LandingPage';
import RafflePortal from './components/RafflePortal';
import RifaManagement from './components/RifaManagement';
import PublicRifaView from './components/PublicRifaView';
import ParticipateRaffle from './components/ParticipateRaffle';
import AdminDashboard from './components/AdminDashboard';
import CreateRifaWizard from './components/CreateRifaWizard';
import ParticipantesPage from './components/ParticipantesPage';
import ProtectedRoute from './components/ProtectedRoute';
import ParticipanteView from './components/ParticipanteView';
import RifaPreview from './components/RifaPreview';
import Footer from './components/Footer';
import AdvertiserPortal from './components/AdvertiserPortal';
import NumeroCheckerPage from './components/NumeroCheckerPage';
import NotificationToast from './components/NotificationToast';
import ConfirmDialog from './components/ConfirmDialog';
import BusinessProfile from './components/BusinessProfile';
import BusinessProfileModal from './components/BusinessProfileModal';
import ErrorBoundary from './components/ErrorBoundary';
import TerminosCondiciones from './components/TerminosCondiciones';
import PoliticaPrivacidad from './components/PoliticaPrivacidad';
import PoliticaCookies from './components/PoliticaCookies';
import AvisoLegal from './components/AvisoLegal';
import AllCuponesPage from './components/AllCuponesPage';
import CookieBanner from './components/CookieBanner';
import LanguageSwitcher from './components/LanguageSwitcher';
import NotificationBadge from './components/NotificationBadge';
import './components/ErrorBoundary.css';
import RifasList from './components/RifasList';
import EditRifa from './components/EditRifa';
import RifaDetails from './components/RifaDetails';
import VerifyEmail from './components/VerifyEmail';
import ParticipantDashboard from './components/participant/ParticipantDashboard';
import AdminReports from './components/admin/AdminReports';
import AdminSettings from './components/admin/AdminSettings';
import GerenciarParticipantes from './components/admin/GerenciarParticipantes';

// Componente interno que usa useLocation dentro del Router
function LogoutRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    logout();
    navigate('/landing', { replace: true });
  }, [logout, navigate]);
  return null;
}

function AppWithRouter() {
  const { t } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  const { myRifas, rifas: publicRifas, createRifa } = useRifas();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [advertiser, setAdvertiser] = useState(null);
  const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
  const userMenuRef = useRef(null);
  const [nuevaRifa, setNuevaRifa] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    fechaFin: '',
    tipo: 'numeros',
    cantidadNumeros: 100,
    elementosPersonalizados: [],
    premios: [],
    reglas: '',
    fotosPremios: [],
    formasPago: {
      transferencia: false,
      clabe: '',
      banco: '',
      numeroCuenta: '',
      nombreTitular: '',
      telefono: '',
      whatsapp: ''
    },
    esPrivada: false,
    creadorId: null,
    pais: '',
    estado: '',
    ciudad: '',
    manejaEnvio: false,
    alcance: 'local',
    categoria: '',
    videoUrl: '',
    pixKey: '',
    aceitaCartao: false,
    loteriaTipo: '',
    numeroSorteio: ''
  });

  // Funciones para manejar menús
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Verificar si hay un anunciante autenticado
  useEffect(() => {
    const checkAdvertiser = async () => {
      const token = localStorage.getItem('advertiserToken');
      if (token && token !== 'null' && token !== 'undefined') {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.advertiserId) {
            const res = await fetch(`${API_BASE}/advertisers/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.advertiser) {
                setAdvertiser(data.advertiser);
              }
            } else {
              localStorage.removeItem('advertiserToken');
              setAdvertiser(null);
            }
          }
        } catch (e) {
          localStorage.removeItem('advertiserToken');
          setAdvertiser(null);
        }
      } else {
        setAdvertiser(null);
      }
    };
    
    checkAdvertiser();
    
    const handleStorageChange = () => {
      checkAdvertiser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('advertiserAuthChange', handleStorageChange);
    
    const interval = setInterval(checkAdvertiser, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('advertiserAuthChange', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }

      const mobileMenu = document.querySelector('.mobile-menu');
      const hamburgerBtn = document.querySelector('.hamburger-btn');
      if (isMenuOpen && mobileMenu && hamburgerBtn) {
        if (!mobileMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMenuOpen]);

  const generarElementosRifa = (tipo, cantidad) => {
    if (tipo === 'numeros') {
      return Array.from({ length: cantidad }, (_, i) => i + 1);
    }
    return Array.from({ length: cantidad }, (_, i) => i + 1);
  };

  const agregarRifa = async () => {
    if (nuevaRifa.nombre && nuevaRifa.precio) {
      try {
        const todasLasFotos = [];
        if (nuevaRifa.premios && nuevaRifa.premios.length > 0) {
          nuevaRifa.premios.forEach((premio, premioIndex) => {
            if (premio.fotos && premio.fotos.length > 0) {
              premio.fotos.forEach((foto) => {
                const urlFinal = foto.url || foto.url_foto || '';
                if (urlFinal && !urlFinal.startsWith('blob:') && (urlFinal.startsWith('http') || urlFinal.startsWith('/'))) {
                  todasLasFotos.push({
                    url: urlFinal,
                    url_foto: urlFinal,
                    descripcion: foto.descripcion || '',
                    orden: todasLasFotos.length,
                    premioIndex: premioIndex,
                    premioNombre: premio.nombre || `Premio ${premioIndex + 1}`,
                  });
                }
              });
            }
          });
        }

        const rifaData = {
          ...nuevaRifa,
          cantidadElementos: nuevaRifa.cantidadNumeros,
          elementosPersonalizados: generarElementosRifa(nuevaRifa.tipo, nuevaRifa.cantidadNumeros),
          premios: nuevaRifa.premios || [],
          fotosPremios: todasLasFotos.length > 0 ? todasLasFotos : (nuevaRifa.fotosPremios || []),
          formasPago: nuevaRifa.formasPago || {}
        };

        const response = await createRifa(rifaData);
        
        if (response.success) {
          setNuevaRifa({ 
            nombre: '', 
            descripcion: '', 
            precio: '', 
            fechaFin: '',
            tipo: 'numeros',
            cantidadNumeros: 100,
            premios: [],
            reglas: '',
            fotosPremios: [],
            formasPago: {
              transferencia: false,
              clabe: '',
              banco: '',
              numeroCuenta: '',
              nombreTitular: '',
              telefono: '',
              whatsapp: ''
            },
            esPrivada: false,
            creadorId: null,
            pais: '',
            estado: '',
            ciudad: '',
            manejaEnvio: false,
            alcance: 'local',
            categoria: ''
          });
          return response.rifa.id;
        }
        return null;
      } catch (error) {
        console.error('Error creando rifa:', error);
        return null;
      }
    }
    return null;
  };

  const manejarCambioTipo = (nuevoTipo) => {
    setNuevaRifa({
      ...nuevaRifa,
      tipo: nuevoTipo,
      cantidadNumeros: 100,
      elementosPersonalizados: generarElementosRifa(nuevoTipo, 100)
    });
  };

  const agregarPremio = () => {
    const nuevoPremio = {
      id: Date.now(),
      nombre: '',
      descripcion: '',
      posicion: nuevaRifa.premios.length + 1,
      fotos: []
    };
    setNuevaRifa({
      ...nuevaRifa,
      premios: [...nuevaRifa.premios, nuevoPremio]
    });
  };

  const actualizarPremio = (index, campo, valor) => {
    const nuevosPremios = [...nuevaRifa.premios];
    nuevosPremios[index] = { ...nuevosPremios[index], [campo]: valor };
    setNuevaRifa({
      ...nuevaRifa,
      premios: nuevosPremios
    });
  };

  const eliminarPremio = (index) => {
    setNuevaRifa({
      ...nuevaRifa,
      premios: nuevaRifa.premios.filter((_, i) => i !== index)
    });
  };

  const manejarFotosPremios = (event) => {
    const archivos = Array.from(event.target.files);
    const fotos = archivos.map(archivo => ({
      id: Date.now() + Math.random(),
      nombre: archivo.name,
      archivo: archivo,
      url: URL.createObjectURL(archivo)
    }));
    setNuevaRifa({
      ...nuevaRifa,
      fotosPremios: [...nuevaRifa.fotosPremios, ...fotos]
    });
  };

  const eliminarFoto = (id) => {
    setNuevaRifa({
      ...nuevaRifa,
      fotosPremios: nuevaRifa.fotosPremios.filter(foto => foto.id !== id)
    });
  };

  const actualizarFormaPago = (campo, valor) => {
    setNuevaRifa({
      ...nuevaRifa,
      formasPago: {
        ...nuevaRifa.formasPago,
        [campo]: valor
      }
    });
  };

  return (
    <div className="App">
      <nav className="grana-navbar">
        <div className="grana-navbar-container">
          {/* Logo - Siempre a la izquierda */}
          <div 
            className="grana-navbar-logo" 
            onClick={() => {
              if (user) {
                if (user.rol === 'admin') {
                  navigate('/');
                } else {
                  navigate('/dashboard-participante');
                }
              } else {
                navigate('/');
              }
            }}
          >
            <span className="grana-navbar-logo-icon">💰</span>
            <span className="grana-navbar-logo-text">
              <span style={{ color: '#00d26a' }}>Grana</span>
              <span style={{ color: '#ffd700' }}>Fácil</span>
            </span>
          </div>

          {/* Enlaces de navegación - Centrados */}
          <div className="grana-navbar-links desktop-only">
            {isAdmin ? (
              <>
                <Link to="/" className={`grana-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                  <span>📊 Dashboard</span>
                </Link>
                <Link to="/rifas" className={`grana-nav-link ${location.pathname === '/rifas' ? 'active' : ''}`}>
                  <span>📋 Todas as Rifas</span>
                </Link>
                <Link to="/gestionar" className={`grana-nav-link ${location.pathname === '/gestionar' ? 'active' : ''}`}>
                  <span>✨ Criar Rifa</span>
                </Link>
              </>
            ) : user ? (
              <Link to="/dashboard-participante" className={`grana-nav-link ${location.pathname === '/dashboard-participante' ? 'active' : ''}`}>
                <span>📊 Meu Painel</span>
              </Link>
            ) : (
              <Link to="/portal" className={`grana-nav-link ${location.pathname === '/portal' ? 'active' : ''}`}>
                <span>🎟️ Ver Rifas</span>
              </Link>
            )}
          </div>

          {/* Sección derecha: Idioma + Autenticación */}
          <div className="grana-navbar-right">
            {/* Idioma - Siempre visible */}
            <div className="grana-nav-language">
              <LanguageSwitcher />
            </div>

            {/* Autenticación */}
            {user ? (
              <>
                <NotificationBadge />
                <div className="grana-user-menu-wrapper" ref={userMenuRef}>
                  <button 
                    className="grana-user-menu-btn" 
                    onClick={toggleUserMenu}
                  >
                    <span className="grana-user-avatar">👤</span>
                    <span className="grana-user-name">{user.nombre?.split(' ')[0]}</span>
                    <span className="grana-user-arrow">▼</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="grana-user-dropdown">
                      <div className="grana-user-info">
                        <span className="grana-user-name-full">{user.nombre}</span>
                        <span className="grana-user-role">{user.rol === 'admin' ? 'Administrador' : 'Participante'}</span>
                      </div>
                      {user.rol !== 'admin' && (
                        <Link 
                          to="/dashboard-participante" 
                          className="grana-user-menu-item"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span>📊</span> Meu Painel
                        </Link>
                      )}
                      <Link 
                        to="/salir" 
                        className="grana-user-menu-item logout"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span>🚪</span> Sair
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="grana-auth-buttons">
                <button 
                  className="grana-btn-login"
                  onClick={() => window.dispatchEvent(new CustomEvent('showLoginModal'))}
                >
                  🔑 Entrar
                </button>
                <button 
                  className="grana-btn-register"
                  onClick={() => window.dispatchEvent(new CustomEvent('showRegisterModal'))}
                >
                  📝 Criar conta
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="grana-mobile-menu-btn" onClick={toggleMenu}>
            <span className={`grana-mobile-line ${isMenuOpen ? 'active' : ''}`}></span>
            <span className={`grana-mobile-line ${isMenuOpen ? 'active' : ''}`}></span>
            <span className={`grana-mobile-line ${isMenuOpen ? 'active' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="grana-mobile-overlay" onClick={closeMenus}>
            <div className="grana-mobile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="grana-mobile-header">
                <span>Menu</span>
                <button className="grana-mobile-close" onClick={closeMenus}>✕</button>
              </div>
              <div className="grana-mobile-links">
                {isAdmin ? (
                  <>
                    <Link to="/" className="grana-mobile-link" onClick={closeMenus}>
                      <span>📊</span> Dashboard
                    </Link>
                    <Link to="/rifas" className="grana-mobile-link" onClick={closeMenus}>
                      <span>📋</span> Todas as Rifas
                    </Link>
                    <Link to="/gestionar" className="grana-mobile-link" onClick={closeMenus}>
                      <span>✨</span> Criar Rifa
                    </Link>
                  </>
                ) : user ? (
                  <>
                    <Link to="/dashboard-participante" className="grana-mobile-link" onClick={closeMenus}>
                      <span>📊</span> Meu Painel
                    </Link>
                    <Link to="/portal" className="grana-mobile-link" onClick={closeMenus}>
                      <span>🎟️</span> Ver Rifas
                    </Link>
                  </>
                ) : (
                  <Link to="/portal" className="grana-mobile-link" onClick={closeMenus}>
                    <span>🎟️</span> Ver Rifas
                  </Link>
                )}
                {user && (
                  <>
                    <div className="grana-mobile-divider"></div>
                    <div className="grana-mobile-user-info">
                      <span className="grana-mobile-user-name">{user.nombre}</span>
                      <span className="grana-mobile-user-role">{user.rol === 'admin' ? 'Admin' : 'Participante'}</span>
                    </div>
                    {user.rol !== 'admin' && (
                      <Link 
                        to="/dashboard-participante" 
                        className="grana-mobile-menu-item"
                        onClick={closeMenus}
                      >
                        <span>📊</span> Meu Painel
                      </Link>
                    )}
                    <Link to="/salir" className="grana-mobile-logout" onClick={closeMenus}>
                      <span>🚪</span> Sair
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {advertiser && (
        <BusinessProfileModal 
          isOpen={showBusinessProfileModal}
          onClose={() => setShowBusinessProfileModal(false)}
          advertiserId={advertiser.id}
        />
      )}

      <Routes>
        <Route path="/anunciantes" element={<AdvertiserPortal />} />
        <Route path="/anunciantes/registro" element={<AdvertiserPortal />} />
        <Route path="/negocio/:id" element={<BusinessProfile />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/admin/reportes" element={<AdminReports />} />
         <Route path="/admin/configuracoes" element={<AdminSettings />} />
         <Route path="/participantes" element={<GerenciarParticipantes />} />
        
        <Route path="/" element={
          <main className="App-main">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner">⏳</div>
                <p>{t('common.loading')}</p>
              </div>
            ) : isAdmin ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/landing" replace />
            )}
          </main>
        } />
        
        <Route path="/landing" element={
          <main className="App-main">
            <LandingPage />
            <Footer />
          </main>
        } />
        
        <Route path="/salir" element={<LogoutRoute />} />
        
        <Route path="/rifas" element={
          <ProtectedRoute requireAdmin={true}>
            <main className="App-main">
              <RifasList />
            </main>
          </ProtectedRoute>
        } />
        
        <Route path="/rifa/:id" element={
          <ProtectedRoute requireAdmin={true}>
            <main className="App-main">
              <RifaDetails />
            </main>
          </ProtectedRoute>
        } />
        
        <Route path="/gestionar" element={
          <ProtectedRoute requireAdmin={true}>
            <main className="App-main">
              <CreateRifaWizard
                nuevaRifa={nuevaRifa}
                setNuevaRifa={setNuevaRifa}
                tiposRifas={{ numeros: { nombre: 'Números', descripcion: 'Rifa tradicional por números', elementos: 'numeros', cantidadDefault: 100 } }}
                manejarCambioTipo={manejarCambioTipo}
                agregarRifa={agregarRifa}
                agregarPremio={agregarPremio}
                actualizarPremio={actualizarPremio}
                eliminarPremio={eliminarPremio}
                manejarFotosPremios={manejarFotosPremios}
                eliminarFoto={eliminarFoto}
                actualizarFormaPago={actualizarFormaPago}
              />
            </main>
          </ProtectedRoute>
        } />
        
        <Route path="/gestionar/:id" element={
          <ProtectedRoute requireAdmin={true}>
            <RifaManagement rifas={myRifas} setRifas={() => {}} />
          </ProtectedRoute>
        } />
        
        <Route path="/gestionar/:id/editar" element={
          <ProtectedRoute requireAdmin={true}>
            <main className="App-main">
              <EditRifa />
            </main>
          </ProtectedRoute>
        } />
        
        <Route path="/participantes/:id" element={
          <ProtectedRoute requireAdmin={true}>
            <ParticipantesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/public/:id" element={<PublicRifaView rifas={publicRifas} />} />
        <Route path="/portal" element={<RafflePortal />} />
        <Route path="/consulta-ganadores" element={<NumeroCheckerPage />} />
        
        <Route path="/dashboard-participante" element={
          <ProtectedRoute requireAdmin={false}>
            <main className="App-main">
              <ParticipantDashboard />
            </main>
          </ProtectedRoute>
        } />
        
        <Route path="/cupones" element={<AllCuponesPage />} />
        <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
        <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/politica-cookies" element={<PoliticaCookies />} />
        <Route path="/aviso-legal" element={<AvisoLegal />} />
        <Route path="/preview/:id" element={<RifaPreview />} />
        <Route path="/participar/:id" element={<ParticipateRaffle rifas={publicRifas} setRifas={() => {}} />} />
        <Route path="/participante/:rifaId/:participanteId" element={<ParticipanteView />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RifasProvider>
          <NotificationsProvider>
            <Router>
              <AppWithRouter />
            </Router>
            <NotificationToast />
            <ConfirmDialog />
            <CookieBanner />
          </NotificationsProvider>
        </RifasProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;