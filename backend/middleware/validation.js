// Middleware para validación de datos de entrada

// Validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar teléfono - Acepta cualquier formato internacional
const isValidPhone = (phone) => {
  if (!phone) return true; // Teléfono opcional
  
  // Remover todos los caracteres no numéricos
  const numeros = phone.replace(/\D/g, '');
  
  // Validar que tenga al menos 8 dígitos y máximo 15 (estándar internacional)
  // La mayoría de los países tienen entre 8 y 12 dígitos
  if (numeros.length >= 8 && numeros.length <= 15) {
    return true;
  }
  
  return false;
};

// Validar que sea un número positivo
const isValidPrice = (price) => {
  return !isNaN(price) && parseFloat(price) > 0;
};

// Validar que sea una fecha futura
const isValidFutureDate = (dateString) => {
  const date = new Date(dateString);
  return date > new Date();
};

// Middleware para validar datos de usuario
const validateUser = (req, res, next) => {
  const { email, password, nombre, telefono } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Email válido es requerido');
  }

  if (!password || password.length < 6) {
    errors.push('Password debe tener al menos 6 caracteres');
  }

  if (!nombre || nombre.trim().length < 2) {
    errors.push('Nombre debe tener al menos 2 caracteres');
  }

  if (telefono && !isValidPhone(telefono)) {
    errors.push('Teléfono debe tener formato válido');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors
    });
  }

  next();
};

// Middleware para validar datos de rifa
const validateRifa = (req, res, next) => {
  const { nombre, precio, fechaFin, tipo, cantidadElementos } = req.body;
  const errors = [];

  if (!nombre || nombre.trim().length < 3) {
    errors.push('Nombre de la rifa debe tener al menos 3 caracteres');
  }

  if (!precio || !isValidPrice(precio)) {
    errors.push('Precio debe ser un número positivo');
  }

  if (!fechaFin || !isValidFutureDate(fechaFin)) {
    errors.push('Fecha de fin debe ser una fecha futura');
  }

  const tiposValidos = ['numeros', 'baraja', 'abecedario', 'animales', 'colores', 'equipos', 'emojis', 'paises'];
  if (!tipo || !tiposValidos.includes(tipo)) {
    errors.push('Tipo de rifa debe ser uno de: ' + tiposValidos.join(', '));
  }

  if (!cantidadElementos || cantidadElementos < 1 || cantidadElementos > 1000) {
    errors.push('Cantidad de elementos debe estar entre 1 y 1000');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Datos de rifa inválidos',
      details: errors
    });
  }

  next();
};

// Middleware para validar datos de participante
const validateParticipante = (req, res, next) => {
  const { nombre, telefono, numerosSeleccionados } = req.body;
  const errors = [];

  if (!nombre || nombre.trim().length < 2) {
    errors.push('Nombre debe tener al menos 2 caracteres');
  }

  if (telefono && telefono.trim() !== '' && !isValidPhone(telefono)) {
    errors.push('Teléfono debe tener un formato válido');
  }

  if (!numerosSeleccionados || !Array.isArray(numerosSeleccionados) || numerosSeleccionados.length === 0) {
    errors.push('Debe seleccionar al menos un número/elemento');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Datos de participante inválidos',
      details: errors
    });
  }

  next();
};

// Middleware para validar ID de rifa
const validateRifaId = (req, res, next) => {
  const { id, rifaId } = req.params;
  const rifaIdParam = id || rifaId; // Soporte para ambos nombres de parámetro
  
  if (!rifaIdParam || rifaIdParam.trim().length === 0) {
    return res.status(400).json({
      error: 'ID de rifa es requerido'
    });
  }

  next();
};

// Middleware para sanitizar datos de entrada (mejorado)
const sanitizeInput = (req, res, next) => {
  // Función para sanitizar strings (más robusta)
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Trim espacios
    let sanitized = str.trim();
    
    // Remover caracteres peligrosos para XSS
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers (onclick, etc.)
      .replace(/&#x?[0-9a-f]+;/gi, '') // Remover entidades HTML
      .replace(/&[a-z]+;/gi, ''); // Remover entidades HTML nombradas
    
    // Limitar longitud máxima (prevenir DoS)
    const maxLength = 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  };

  // Función recursiva para sanitizar objetos y arrays
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return sanitizeString(value);
    } else if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    } else if (value && typeof value === 'object') {
      const sanitized = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          sanitized[key] = sanitizeValue(value[key]);
        }
      }
      return sanitized;
    }
    return value;
  };

  // Sanitizar body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitizar query params
  if (req.query) {
    for (const key in req.query) {
      if (req.query.hasOwnProperty(key) && typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  // Sanitizar params
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key) && typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }

  next();
};

module.exports = {
  validateUser,
  validateRifa,
  validateParticipante,
  validateRifaId,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidPrice,
  isValidFutureDate
};
