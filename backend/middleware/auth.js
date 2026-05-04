// middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔥 CORREGIDO: Usar decoded.id (no userId) y eliminar verificación de activo
    const result = await query(
      'SELECT id, email, nombre, rol FROM usuarios WHERE id = $1',
      [decoded.id]  // ← cambiado de decoded.userId a decoded.id
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado. É necessário ser administrador.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Middleware opcional (no requiere token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 🔥 CORREGIDO: Usar decoded.id
    const result = await query(
      'SELECT id, email, nombre, rol FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    req.user = result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

// Función para generar JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },  // ← usar "id"
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  generateToken
};