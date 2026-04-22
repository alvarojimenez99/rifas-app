const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Para generar tokens de verificación
const { query } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateUser, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', sanitizeInput, validateUser, async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;

    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'O email já está registrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Encriptar password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generar token de verificación
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const tokenExpiracion = new Date();
    tokenExpiracion.setHours(tokenExpiracion.getHours() + 24); // 24 horas para verificar

    // Crear usuario con rol 'invitado' y token de verificación
const result = await query(
  `INSERT INTO usuarios (email, password_hash, nombre, telefono, rol, 
    token_verificacion, token_verificacion_expira, email_verificado) 
   VALUES ($1, $2, $3, $4, 'invitado', $5, $6, false) 
   RETURNING id, email, nombre, telefono, rol, fecha_registro`,
  [email, passwordHash, nombre, telefono, tokenVerificacion, tokenExpiracion]
);

    const user = result.rows[0];

    // Generar token de acceso
    const token = generateToken(user.id);

    // Actualizar último acceso
    await query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Enviar email de bienvenida (no bloquea el registro si falla)
    try {
      const emailService = require('../config/email');
      const emailResult = await emailService.sendWelcomeEmail({
        nombre: user.nombre,
        email: user.email,
        verificationToken: tokenVerificacion
      });
      
      if (emailResult.success) {
        console.log('✅ Email de bienvenida enviado al nuevo usuario:', user.email);
      } else {
        console.warn('⚠️  No se pudo enviar email de bienvenida:', emailResult.error || emailResult.message);
      }
    } catch (emailError) {
      console.error('❌ Error enviando email de bienvenida:', emailError);
      // No fallar el registro por error de email
    }

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefono: user.telefono,
        rol: user.rol,
        fechaRegistro: user.fecha_registro,
        email_verificado: false
      },
      token,
      verificationToken: tokenVerificacion,
      needsVerification: true
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', sanitizeInput, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuario
    const result = await query(
      'SELECT id, email, password_hash, nombre, telefono, rol, activo, email_verificado FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(401).json({
        error: 'Conta desativada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar email (opcional - se quiser bloquear login de não verificados)
    // if (!user.email_verificado) {
    //   return res.status(401).json({
    //     error: 'Email não verificado. Verifique sua caixa de entrada.',
    //     code: 'EMAIL_NOT_VERIFIED'
    //   });
    // }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token
    const token = generateToken(user.id);

    // Actualizar último acceso
    await query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefono: user.telefono,
        rol: user.rol,
        email_verificado: user.email_verificado
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;