const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { testConnection, query } = require('./config/database');

console.log('🚀 SERVIDOR PELELECA - V7.1');
console.log('Versão Node:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// =====================================================
// CONFIGURAÇÃO CORS - VERSÃO COMPLETA
// =====================================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware para evitar caché de CORS
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// Socket.io com CORS
const io = new Server(server, {
  cors: {
    origin: ['https://peleleca.bet', 'https://www.peleleca.bet', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// ARQUIVOS ESTÁTICOS
// =====================================================
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// FUNÇÃO PARA GERAR TOKEN
// =====================================================
const generateToken = (userId, email, rol) => {
  return jwt.sign(
    { id: userId, email, rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
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
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// =====================================================
// ROTAS DE AUTENTICAÇÃO
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
        nome: usuario.nombre,
        email: usuario.email,
        telefone: usuario.telefono,
        role: usuario.rol
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register
routerAuth.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    
    const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Este email já está registrado' });
    }
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(senha, saltRounds);
    
    const result = await query(
      `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol, created_at)
       VALUES ($1, $2, $3, $4, 'participante', CURRENT_TIMESTAMP)
       RETURNING id, nombre, email, telefono, rol`,
      [nome, email, telefone || null, passwordHash]
    );
    
    const usuario = result.rows[0];
    const token = generateToken(usuario.id, usuario.email, usuario.rol);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nome: usuario.nombre,
        email: usuario.email,
        telefone: usuario.telefono,
        role: usuario.rol
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no registro:', error);
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
    const userId = decoded.id;
    
    const result = await query(
      'SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ user: result.rows[0] });
    
  } catch (error) {
    console.error('❌ Erro no /me:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.use('/api/auth', routerAuth);

// =====================================================
// ROTAS DE RIFAS
// =====================================================
const rifasRoutes = require('./routes/rifas');
app.use('/api/rifas', rifasRoutes);

// =====================================================
// ROTAS DE ADMIN
// =====================================================
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// =====================================================
// ROTAS DE NOTIFICAÇÕES
// =====================================================
const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

// =====================================================
// ROTAS DE PARTICIPANTES
// =====================================================
const participantesRoutes = require('./routes/participantes');
app.use('/api/participantes', participantesRoutes);

// =====================================================
// ROTAS ADICIONAIS
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
// ROTAS DE PAGAMENTOS
// =====================================================
// ✅ AGREGAR ESTO - RUTAS DE PAGAMENTOS
const paymentsRoutes = require('./routes/payments');
app.use('/api/payments', paymentsRoutes);

// =====================================================
// SOCKET.IO
// =====================================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) return next(new Error('Token não fornecido'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log('✅ Cliente conectado ao Socket.io', { userId: socket.userId });
  if (socket.userId) socket.join(`user:${socket.userId}`);
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado do Socket.io', { userId: socket.userId });
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando - Peleleca V7',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'API Peleleca - Plataforma de Rifas Online',
    version: '7.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      rifas: '/api/rifas',
      participantes: '/api/participantes',
      payments: '/api/payments',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// =====================================================
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// =====================================================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado', 
    path: req.originalUrl,
    message: `A rota ${req.method} ${req.originalUrl} não existe`
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
const startServer = async () => {
  try {
    console.log('📍 Conectando ao banco de dados...');
    await testConnection();
    console.log('✅ Banco de dados conectado com sucesso');

    server.listen(PORT, () => {
      console.log(`✅ Servidor iniciado na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📦 Versão: Peleleca V7`);
      console.log(`🔌 Socket.io pronto para conexões`);
    });

    server.on('error', (error) => {
      console.error('❌ Erro no servidor:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ A porta ${PORT} já está em uso`);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Erro crítico ao iniciar servidor:', error.message);
    process.exit(1);
  }
};

startServer();