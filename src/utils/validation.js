// Utilidades de validación para formularios

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'El email es requerido' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'El email no tiene un formato válido' };
  }

  // Validar longitud
  if (email.length > 254) {
    return { valid: false, error: 'El email es demasiado largo (máximo 254 caracteres)' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password || password.trim() === '') {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `La contraseña debe tener al menos ${minLength} caracteres` };
  }

  if (password.length > 128) {
    return { valid: false, error: 'La contraseña es demasiado larga (máximo 128 caracteres)' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password - Contraseña
 * @param {string} confirmPassword - Confirmación de contraseña
 * @returns {object} - { valid: boolean, error: string }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { valid: false, error: 'Por favor confirma tu contraseña' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Las contraseñas no coinciden' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida un nombre
 * @param {string} nombre - Nombre a validar
 * @param {number} minLength - Longitud mínima (default: 2)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateNombre = (nombre, minLength = 2) => {
  if (!nombre || nombre.trim() === '') {
    return { valid: false, error: 'El nombre es requerido' };
  }

  if (nombre.trim().length < minLength) {
    return { valid: false, error: `El nombre debe tener al menos ${minLength} caracteres` };
  }

  if (nombre.length > 100) {
    return { valid: false, error: 'El nombre es demasiado largo (máximo 100 caracteres)' };
  }

  // Validar que solo contenga letras, espacios y algunos caracteres especiales
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!nombreRegex.test(nombre.trim())) {
    return { valid: false, error: 'El nombre solo puede contener letras, espacios y guiones' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida un teléfono (formato mexicano e internacional)
 * @param {string} telefono - Teléfono a validar
 * @param {boolean} required - Si es requerido (default: false)
 * @returns {object} - { valid: boolean, error: string }
 */
// Validación de teléfono - Acepta números brasileños
export const validateTelefono = (telefono) => {
  if (!telefono) {
    return { valid: false, error: 'Telefone é obrigatório' };
  }
  
  // Remover todos os caracteres não numéricos
  const numeros = telefono.replace(/\D/g, '');
  
  // Validar número brasileño: 10 ou 11 dígitos (com ou sem DDD)
  // Padrões: 11999999999 (11 dígitos) ou 999999999 (9 dígitos)
  const isValid = numeros.length >= 10 && numeros.length <= 11;
  
  if (!isValid) {
    return { valid: false, error: 'Digite um número válido (DDD + 8 ou 9 dígitos)' };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida un número
 * @param {string|number} value - Valor a validar
 * @param {object} options - Opciones { min, max, required, integer }
 * @returns {object} - { valid: boolean, error: string, value: number }
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, required = false, integer = false } = options;

  if (!value && value !== 0) {
    if (required) {
      return { valid: false, error: 'Este campo es requerido', value: null };
    }
    return { valid: true, error: '', value: null };
  }

  // Convertir a número
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { valid: false, error: 'Debe ser un número válido', value: null };
  }

  if (integer && !Number.isInteger(numValue)) {
    return { valid: false, error: 'Debe ser un número entero', value: null };
  }

  if (min !== undefined && numValue < min) {
    return { valid: false, error: `El valor mínimo es ${min}`, value: numValue };
  }

  if (max !== undefined && numValue > max) {
    return { valid: false, error: `El valor máximo es ${max}`, value: numValue };
  }

  return { valid: true, error: '', value: numValue };
};

/**
 * Valida una fecha
 * @param {string} fecha - Fecha a validar
 * @param {object} options - Opciones { minDate, maxDate, required }
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateDate = (fecha, options = {}) => {
  const { minDate, maxDate, required = false } = options;

  if (!fecha || fecha.trim() === '') {
    if (required) {
      return { valid: false, error: 'La fecha es requerida' };
    }
    return { valid: true, error: '' };
  }

  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'La fecha no es válida' };
  }

  if (minDate) {
    const min = new Date(minDate);
    if (date < min) {
      return { valid: false, error: `La fecha debe ser posterior a ${min.toLocaleDateString()}` };
    }
  }

  if (maxDate) {
    const max = new Date(maxDate);
    if (date > max) {
      return { valid: false, error: `La fecha debe ser anterior a ${max.toLocaleDateString()}` };
    }
  }

  return { valid: true, error: '' };
};

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @param {boolean} required - Si es requerido (default: false)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateURL = (url, required = false) => {
  if (!url || url.trim() === '') {
    if (required) {
      return { valid: false, error: 'La URL es requerida' };
    }
    return { valid: true, error: '' };
  }

  try {
    new URL(url);
    return { valid: true, error: '' };
  } catch (e) {
    return { valid: false, error: 'La URL no tiene un formato válido (ej: https://ejemplo.com)' };
  }
};

/**
 * Valida un texto con longitud mínima/máxima
 * @param {string} text - Texto a validar
 * @param {object} options - Opciones { minLength, maxLength, required }
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateText = (text, options = {}) => {
  const { minLength, maxLength, required = false } = options;

  if (!text || text.trim() === '') {
    if (required) {
      return { valid: false, error: 'Este campo es requerido' };
    }
    return { valid: true, error: '' };
  }

  if (minLength && text.trim().length < minLength) {
    return { valid: false, error: `Debe tener al menos ${minLength} caracteres` };
  }

  if (maxLength && text.length > maxLength) {
    return { valid: false, error: `Debe tener máximo ${maxLength} caracteres` };
  }

  return { valid: true, error: '' };
};

/**
 * Valida un formulario completo
 * @param {object} formData - Datos del formulario
 * @param {object} rules - Reglas de validación { fieldName: { validator, options } }
 * @returns {object} - { valid: boolean, errors: object }
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    if (rule.validator) {
      const result = rule.validator(value, rule.options || {});
      if (!result.valid) {
        errors[field] = result.error;
        isValid = false;
      }
    }
  });

  return { valid: isValid, errors };
};

