const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { testConnection, query } = require('./config/database');

console.log('🚀 SERVER V7 - CON SOCKET.IO');
console.log('Node version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://peleleca.bet',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// SERVIR ARCHIVOS ESTÁTICOS DE UPLOADS
// =====================================================
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// FUNCIÓN PARA GENERAR TOKEN
// =====================================================
const generateToken = (userId, email, rol) => {
  return jwt.sign(
    { id: userId, email, rol },  // ← Usa "id" en lugar de "userId"
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN (para usar en otras rutas)
// =====================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,      // ← usar id
      email: decoded.email,
      rol: decoded.rol
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware requireAdmin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================
const routerAuth = express.Router();

// POST /api/auth/login
routerAuth.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const result = await query(
      'SELECT id, nombre, email, telefono, rol, password_hash FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const usuario = result.rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = generateToken(usuario.id, usuario.email, usuario.rol);
    
    await query(
      'UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1',
      [usuario.id]
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register
routerAuth.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    
    const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Este email já está registrado' });
    }
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await query(
      `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol, created_at)
       VALUES ($1, $2, $3, $4, 'participante', CURRENT_TIMESTAMP)
       RETURNING id, nombre, email, telefono, rol`,
      [nombre, email, telefono || null, passwordHash]
    );
    
    const usuario = result.rows[0];
    const token = generateToken(usuario.id, usuario.email, usuario.rol);
    
    res.status(201).json({
      success: true,
      token,
      user: usuario
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
routerAuth.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const result = await query(
      'SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ user: result.rows[0] });
    
  } catch (error) {
    console.error('Erro no /me:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.use('/api/auth', routerAuth);

// =====================================================
// RUTAS DE RIFAS
// =====================================================
const rifasRoutes = require('./routes/rifas');
app.use('/api/rifas', rifasRoutes);

// =====================================================
// RUTAS DE ADMIN - Versión completa desde admin.js
// =====================================================
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);


const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);
// =====================================================
// RUTAS DE PARTICIPANTES
// =====================================================
const routerParticipantes = express.Router();

routerParticipantes.get('/:rifaId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM participantes WHERE rifa_id = $1 ORDER BY fecha_participacion DESC', [req.params.rifaId]);
    res.json({ participantes: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener participantes' });
  }
});

routerParticipantes.post('/:rifaId/confirmar-pago', authenticateToken, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { numerosSeleccionados, total, metodoPago } = req.body;
    console.log('✅ Pago confirmado:', { rifaId, numerosSeleccionados, total, metodoPago });
    res.json({ success: true, message: 'Pago confirmado', participante: { id: Date.now(), numeros: numerosSeleccionados, total } });
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
});

app.use('/api/participantes', routerParticipantes);

// =====================================================
// RUTAS ADICIONALES
// =====================================================
const catalogosRoutes = require('./routes/catalogos');
const uploadRoutes = require('./routes/upload');
const stripeRoutes = require('./routes/stripe');
const verifyRoutes = require('./routes/verify');

app.use('/api/catalogos', catalogosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/verify', verifyRoutes);

// =====================================================
// RUTAS DE PAGOS
// =====================================================
const routerPayments = express.Router();

routerPayments.post('/pix/create', async (req, res) => {
  try {
    const { rifaId, numerosSeleccionados, total, email, nome } = req.body;
    console.log('📦 PIX Request:', { rifaId, numerosSeleccionados, total, email, nome });
    res.json({
      success: true,
      qrCode: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      copiaECola: '00020101021226820014br.gov.bcb.pix2560pix-h.asaas.com/qr/mock',
      paymentId: 'mock_' + Date.now(),
      expiresIn: 1800
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear pago PIX' });
  }
});

routerPayments.post('/card/create-intent', async (req, res) => {
  try {
    const { rifaId, numerosSeleccionados, total, email, nome } = req.body;
    console.log('💳 Stripe Request:', { rifaId, numerosSeleccionados, total, email, nome });
    res.json({
      clientSecret: 'pi_mock_' + Date.now() + '_secret_mock',
      paymentIntentId: 'pi_mock_' + Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear pago con tarjeta' });
  }
});

app.use('/api/payments', routerPayments);

// =====================================================
// SOCKET.IO CONNECTION
// =====================================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) return next(new Error('Token no proporcionado'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado a Socket.io', { userId: socket.userId });
  if (socket.userId) socket.join(`user:${socket.userId}`);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado de Socket.io', { userId: socket.userId });
  });
});

// =====================================================
// HEALTH
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando - V7', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'API de Peleleca - V7', status: 'running' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado', path: req.originalUrl });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
const startServer = async () => {
  try {
    console.log('📍 Conectando a BD...');
    await testConnection();
    console.log('✅ BD conectada');

    server.listen(PORT, () => {
      console.log(`✅ Servidor iniciado en puerto ${PORT}`);
      console.log(`📦 Versión: V7 - CON SOCKET.IO`);
    });

    server.on('error', (error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error crítico:', error.message);
    process.exit(1);
  }
};

startServer();