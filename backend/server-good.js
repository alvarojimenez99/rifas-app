const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const path = require('path');

// =====================================================
// CARGA DE VARIABLES DE ENTORNO - HÍBRIDO
// =====================================================
console.log('🚀 Iniciando servidor...');

// Intentar cargar config.env SOLO si existe (desarrollo local)
try {
  const fs = require('fs');
  const envPath = path.join(__dirname, 'config.env');
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('✅ Configuración local cargada desde config.env');
  } else {
    console.log('📌 Usando variables del sistema (producción/Hostinger)');
  }
} catch (error) {
  console.log('📌 Usando variables del sistema (producción)');
}

// Mostrar configuración actual
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 PORT: ${process.env.PORT || 5000}`);
console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

// Inicializar Sentry
const { initSentry, sentryErrorHandler } = require('./config/sentry');
initSentry();

// Importar logger y alertas
const logger = require('./config/logger');
const { alerts } = require('./config/alerts');

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// Importar middlewares de seguridad
const { 
  getCorsConfig, 
  validateJWTSecret, 
  validatePayloadSize,
  preventClickjacking,
  preventMimeSniffing,
  validateContentType
} = require('./middleware/security');

const {
  authRateLimiter,
  createContentRateLimiter,
  uploadRateLimiter,
  paymentRateLimiter,
  apiRateLimiter,
  publicRateLimiter,
  resetRateLimitStore,
  getRateLimitStats
} = require('./middleware/rateLimiter');

// Importar rutas (solo las que se usan)
const authRoutes = require('./routes/auth');
const rifasRoutes = require('./routes/rifas');
const participantesRoutes = require('./routes/participantes');
const catalogosRoutes = require('./routes/catalogos');
// const advertisersRoutes = require('./routes/advertisers'); // NO USADO
// const adsPublicRoutes = require('./routes/adsPublic'); // NO USADO
// const cuponesPublicRoutes = require('./routes/advertisers/cuponesPublic'); // NO USADO
// const ratingsRoutes = require('./routes/ratings'); // NO USADO
// const creatorPlansRoutes = require('./routes/creatorPlans'); // NO USADO
const uploadRoutes = require('./routes/upload');
const stripeRoutes = require('./routes/stripe');
const notificationsRoutes = require('./routes/notifications');
const verifyRoutes = require('./routes/verify'); 
const adminRoutes = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');

// Importar scheduler
const { startScheduler } = require('./scheduler/emailScheduler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Almacenar Socket.io en app para acceso desde rutas
app.set('io', io);

// Validar JWT_SECRET al iniciar (solo en producción)
if (process.env.NODE_ENV === 'production') {
  try {
    validateJWTSecret();
    logger.info('JWT_SECRET validado correctamente');
  } catch (error) {
    logger.error(error.message);
    logger.error('CRÍTICO: No se puede iniciar el servidor sin un JWT_SECRET válido');
    process.exit(1);
  }
}

// Middleware de seguridad Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware de seguridad adicional
app.use(preventClickjacking);
app.use(preventMimeSniffing);
app.use(validateContentType);
app.use(validatePayloadSize('10mb'));

// Middleware CORS
const corsConfig = getCorsConfig();
app.use(cors(corsConfig));

// Logging de CORS
if (process.env.NODE_ENV === 'development') {
  logger.info('CORS configurado para desarrollo');
} else {
  logger.info(`CORS configurado para producción: ${process.env.FRONTEND_URL}`);
}

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// =====================================================
// RUTAS DE LA API (SOLO LAS QUE SE USAN)
// =====================================================

// Autenticación
app.use('/api/auth', authRateLimiter, authRoutes);

// Rifas
app.use('/api/rifas', (req, res, next) => {
  if (req.method === 'GET' && req.path.includes('/verificar')) {
    return publicRateLimiter(req, res, next);
  }
  if (req.method === 'GET') {
    return apiRateLimiter(req, res, next);
  }
  return createContentRateLimiter(req, res, next);
}, rifasRoutes);

// Participantes
app.use('/api/participantes', createContentRateLimiter, participantesRoutes);

// Pagos
app.use('/api/payments', paymentsRoutes);

// Admin
app.use('/api/admin', adminRoutes);

// Verificación
app.use('/api/verify', verifyRoutes);

// Uploads
app.use('/api/upload', uploadRateLimiter, uploadRoutes);

// Stripe
app.use('/api/stripe', paymentRateLimiter, stripeRoutes);

// Notificaciones
app.use('/api/notifications', apiRateLimiter, notificationsRoutes);

// Catalogos
app.use('/api/catalogos', apiRateLimiter, catalogosRoutes);

// =====================================================
// RUTAS NO UTILIZADAS (COMENTADAS)
// =====================================================
// app.use('/api/advertisers', apiRateLimiter, advertisersRoutes);
// app.use('/api/ads', publicRateLimiter, adsPublicRoutes);
// app.use('/api/cupones', publicRateLimiter, cuponesPublicRoutes);
// app.use('/api/ratings', apiRateLimiter, ratingsRoutes);
// app.use('/api/creator-plans', apiRateLimiter, creatorPlansRoutes);

// =====================================================
// RUTAS DE ADMINISTRACIÓN (SOLO DESARROLLO)
// =====================================================
if (process.env.NODE_ENV === 'development') {
  app.post('/api/admin/reset-rate-limit', (req, res) => {
    try {
      resetRateLimitStore();
      res.json({ success: true, message: 'Rate limit store reseteado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/admin/reset-rate-limit', (req, res) => {
    try {
      resetRateLimitStore();
      res.json({ success: true, message: 'Rate limit store reseteado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/rate-limit-stats', (req, res) => {
    try {
      const stats = getRateLimitStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// =====================================================
// ENDPOINTS PÚBLICOS
// =====================================================

// Salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Rifas Digital',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      rifas: '/api/rifas',
      participantes: '/api/participantes',
      catalogos: '/api/catalogos',
      payments: '/api/payments',
      health: '/api/health'
    }
  });
});

// 404 - Endpoint no encontrado
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`
  });
});

// Sentry error handler
sentryErrorHandler(app);

// =====================================================
// MANEJO DE ERRORES GLOBAL
// =====================================================
app.use((error, req, res, next) => {
  logger.error('Error no manejado:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  const { captureException } = require('./config/sentry');
  captureException(error, { path: req.path, method: req.method });
  
  res.status(error.status || 500).json({
    error: error.message,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// INICIO DEL SERVIDOR
// =====================================================
const startServer = async () => {
  try {
    logger.info('Iniciando servidor...');
    logger.info('Probando conexión a la base de datos...');
    
    await Promise.race([
      testConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de conexión a BD')), 10000)
      )
    ]);
    logger.info('✅ Conexión a base de datos exitosa');
    
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
      logger.info('Cliente conectado a Socket.io', { userId: socket.userId });
      if (socket.userId) socket.join(`user:${socket.userId}`);
      socket.on('disconnect', () => {
        logger.info('Cliente desconectado de Socket.io', { userId: socket.userId });
      });
    });
    
    server.listen(PORT, () => {
      console.log(`✅ Servidor iniciado exitosamente en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Servidor iniciado exitosamente', { port: PORT });
      alerts.serverStarted(PORT, process.env.NODE_ENV || 'development');
      
      try {
        startScheduler();
        logger.info('Scheduler de emails iniciado');
      } catch (schedulerError) {
        logger.warn('Error iniciando scheduler:', { error: schedulerError.message });
      }
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    server.on('error', (error) => {
      logger.error('Error del servidor:', { error: error.message, code: error.code });
      if (error.code === 'EADDRINUSE') {
        logger.error(`Puerto ${PORT} ya está en uso`);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error crítico:', error.message);
    logger.error('Error crítico iniciando servidor:', { error: error.message });
    process.exit(1);
  }
};

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    logger.warn('Cierre ya en progreso, forzando salida...');
    process.exit(1);
  }
  
  isShuttingDown = true;
  logger.info(`Recibida señal ${signal}, iniciando cierre graceful...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('Error cerrando servidor:', { error: err.message });
        process.exit(1);
      }
      logger.info('Servidor cerrado correctamente');
      alerts.serverShutdown(signal);
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.warn('Timeout en cierre graceful, forzando salida...');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Señales del sistema
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada:', { reason: reason?.message || reason });
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Continuando en producción después de unhandledRejection');
  } else {
    gracefulShutdown('unhandledRejection');
  }
});

// Iniciar servidor
startServer();