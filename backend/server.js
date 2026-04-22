const express = require('express');
const http = require('http');
const cors = require('cors');
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
// RUTAS DE RIFAS
// =====================================================
const routerRifas = express.Router();

routerRifas.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rifas WHERE deleted_at IS NULL ORDER BY fecha_creacion DESC LIMIT 20');
    res.json({ rifas: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rifas' });
  }
});

routerRifas.get('/my', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rifas WHERE deleted_at IS NULL ORDER BY fecha_creacion DESC');
    res.json({ rifas: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rifas' });
  }
});

routerRifas.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rifas WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rifa no encontrada' });
    res.json({ rifa: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rifa' });
  }
});

app.use('/api/rifas', routerRifas);

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

routerParticipantes.post('/:rifaId/confirmar-pago', async (req, res) => {
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
// RUTAS DE AUTENTICACIÓN
// =====================================================
const routerAuth = express.Router();

routerAuth.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login:', email);
  res.json({ success: true, token: 'mock-token', user: { id: 1, nombre: 'Admin', email } });
});

routerAuth.post('/register', async (req, res) => {
  const { nombre, email, password, telefono } = req.body;
  console.log('Registro:', nombre, email);
  res.json({ success: true, user: { id: Date.now(), nombre, email, telefono } });
});

routerAuth.get('/me', async (req, res) => {
  res.json({ user: { id: 1, nombre: 'Administrador', email: 'admin@peleleca.bet', telefono: '+5511999999999' } });
});

app.use('/api/auth', routerAuth);

// =====================================================
// RUTAS DE ADMIN
// =====================================================
const routerAdmin = express.Router();

routerAdmin.get('/rifas', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rifas ORDER BY fecha_creacion DESC');
    res.json({ rifas: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rifas' });
  }
});

routerAdmin.put('/rifas/:id/activar', async (req, res) => {
  const { id } = req.params;
  const { activa } = req.body;
  try {
    await query('UPDATE rifas SET activa = $1 WHERE id = $2', [activa, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

app.use('/api/admin', routerAdmin);

// Agrega estas líneas después de las rutas de admin
/*


const verifyRoutes = require('./routes/verify');
app.use('/api/verify', verifyRoutes);*/

const catalogosRoutes = require('./routes/catalogos');
app.use('/api/catalogos', catalogosRoutes);

const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);


const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe', stripeRoutes);

/*const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);*/

const verifyRoutes = require('./routes/verify');
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
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) return next(new Error('Token no proporcionado'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId || decoded.id;
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

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado', path: req.originalUrl });
});

// =====================================================
// INICIAR
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