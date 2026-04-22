// Configuración base de la API
// Usa variable de entorno en producción, fallback a localhost en desarrollo
const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:5001/api';

// Función para hacer peticiones HTTP
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Configuración por defecto
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Agregar token de autenticación si existe
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  // Combinar opciones
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    // Si la respuesta no es exitosa, lanzar error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Retornar datos JSON
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Servicios de Autenticación
export const authService = {
  // Registrar nuevo usuario
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Iniciar sesión
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Obtener información del usuario actual
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  // Verificar email con token
  verifyEmail: async (token) => {
    return apiRequest(`/verify/${token}`, {
      method: 'GET',
    });
  },

  // Cerrar sesión (limpiar token local)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Guardar token y usuario
  saveAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Verificar si hay token
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

// Servicios de Rifas
export const rifasService = {
  // Obtener rifas públicas
  getPublicRifas: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.tipo) queryParams.append('tipo', filters.tipo);
    if (filters.precio_min) queryParams.append('precio_min', filters.precio_min);
    if (filters.precio_max) queryParams.append('precio_max', filters.precio_max);
    if (filters.disponibles) queryParams.append('disponibles', filters.disponibles);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.categoria) queryParams.append('categoria', filters.categoria);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/rifas?${queryString}` : '/rifas';
    
    // Forzar no-cache en headers (suficiente sin parámetros en URL)
    return apiRequest(endpoint, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },

  // Obtener mis rifas (admin)
  getMyRifas: async () => {
    return apiRequest('/rifas/my');
  },

  // Obtener rifa por ID
  getRifaById: async (id) => {
    return apiRequest(`/rifas/${id}`);
  },

  // Crear nueva rifa
  createRifa: async (rifaData) => {
    return apiRequest('/rifas', {
      method: 'POST',
      body: JSON.stringify(rifaData),
    });
  },

  // Actualizar rifa
  updateRifa: async (id, rifaData) => {
    return apiRequest(`/rifas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rifaData),
    });
  },

  // Eliminar rifa
  deleteRifa: async (id) => {
    return apiRequest(`/rifas/${id}`, {
      method: 'DELETE',
    });
  }
};

// Servicios de Participantes
export const participantesService = {
  // Obtener participantes de una rifa
  getParticipantes: async (rifaId) => {
    return apiRequest(`/participantes/${rifaId}`);
  },

  // Participar en una rifa
  participar: async (rifaId, participanteData) => {
    return apiRequest(`/participantes/${rifaId}`, {
      method: 'POST',
      body: JSON.stringify(participanteData),
    });
  },

  // Registrar usuario participante (sin login, solo ficha de contacto)
  registrarParticipante: async ({ nombre, email, telefono }) => {
    return apiRequest('/participantes/registro', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, telefono }),
    });
  },

  // Venta directa por admin (email opcional, soporta invitados)
  venderAdmin: async (rifaId, { nombre, telefono, email, numerosSeleccionados }) => {
    return apiRequest(`/participantes/${rifaId}/vender-admin`, {
      method: 'POST',
      body: JSON.stringify({ nombre, telefono, email, numerosSeleccionados }),
    });
  },

  // Validar pago de participante
  validarPago: async (participanteId) => {
    return apiRequest(`/participantes/${participanteId}/validar`, {
      method: 'PUT',
    });
  },

  // Rechazar participante
  rechazarParticipante: async (participanteId, motivo) => {
    return apiRequest(`/participantes/${participanteId}/rechazar`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    });
  },

  // Obtener elementos de una rifa
  getElementos: async (rifaId, estado = 'todos') => {
    return apiRequest(`/participantes/${rifaId}/elementos?estado=${estado}`);
  }
};

// Servicio de utilidades
export const utilsService = {
  // Verificar salud del servidor
  healthCheck: async () => {
    return apiRequest('/health');
  },

  // Obtener información de la API
  getApiInfo: async () => {
    return apiRequest('/');
  }
};

// Servicio de Catálogos
export const catalogosService = {
  // Obtener lista de países
  getPaises: async () => {
    return apiRequest('/catalogos/paises');
  },

  // Obtener estados por país
  getEstados: async (paisCodigo) => {
    return apiRequest(`/catalogos/estados/${paisCodigo}`);
  },

  // Obtener lista de categorías
  getCategorias: async () => {
    return apiRequest('/catalogos/categorias');
  }
};

// Función para manejar errores de API
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Si es error de autenticación, limpiar token
  if (error.message.includes('Token') || error.message.includes('401')) {
    authService.logout();
    window.location.reload();
  }
  
  return {
    error: true,
    message: error.message || 'Error de conexión con el servidor',
  };
};

// Servicio de Upload
export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // No incluir 'Content-Type' - el navegador lo establecerá automáticamente con el boundary para FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
};

const apiServices = {
  authService,
  rifasService,
  participantesService,
  utilsService,
  catalogosService,
  uploadService,
  handleApiError,
};

export default apiServices;