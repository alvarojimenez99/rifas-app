const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateRifa, validateRifaId, sanitizeInput } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// =====================================================
// CONFIGURACIÓN DE UPLOAD DE IMÁGENES
// =====================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/rifas/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'rifa-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

// =====================================================
// GET /api/rifas - Obtener rifas públicas (solo aprobadas)
// =====================================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { tipo, precio_min, precio_max, disponibles, search, resultado_publicado, categoria } = req.query;
    let whereConditions = ['r.es_privada = false', "r.estado = 'aprobada'"];
    let queryParams = [];
    let paramCount = 0;

    if (resultado_publicado === 'true') {
      whereConditions.push('r.resultado_publicado = true');
    } else {
      whereConditions.push('r.activa = true');
      whereConditions.push('r.fecha_fin > CURRENT_TIMESTAMP');
    }

    if (tipo) {
      paramCount++;
      whereConditions.push(`r.tipo = $${paramCount}`);
      queryParams.push(tipo);
    }

    if (categoria && categoria !== 'all' && categoria !== 'todas') {
      paramCount++;
      whereConditions.push(`r.categoria = $${paramCount}`);
      queryParams.push(categoria);
    }

    if (precio_min) {
      paramCount++;
      whereConditions.push(`r.precio >= $${paramCount}`);
      queryParams.push(parseFloat(precio_min));
    }

    if (precio_max) {
      paramCount++;
      whereConditions.push(`r.precio <= $${paramCount}`);
      queryParams.push(parseFloat(precio_max));
    }

    if (disponibles === 'true') {
      whereConditions.push('(r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0)) > 0');
    }

    if (search) {
      paramCount++;
      whereConditions.push(`r.nombre ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email,
        u.telefono as creador_telefono,
        COALESCE(ev.count, 0) as elementos_vendidos,
        COALESCE(er.count, 0) as elementos_reservados,
        r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0) as elementos_disponibles,
        COALESCE(p.count, 0) as total_participantes,
        COALESCE(tr.total, 0) as total_recaudado,
        COALESCE(ratings_stats.total_calificaciones, 0) as total_calificaciones,
        COALESCE(ratings_stats.promedio_calificacion_rifa, 0) as promedio_calificacion_rifa,
        (SELECT COUNT(*) FROM rifas WHERE usuario_id = u.id AND deleted_at IS NULL) as total_rifas_creador,
        COALESCE((
          SELECT json_agg(foto_data)
          FROM (
            SELECT json_build_object(
              'id', f.id, 
              'url', f.url_foto, 
              'url_foto', f.url_foto, 
              'descripcion', f.descripcion, 
              'orden', f.orden, 
              'premio_id', f.premio_id, 
              'premio_nombre', p.nombre, 
              'premio_posicion', p.posicion
            ) as foto_data
            FROM fotos_premios f 
            LEFT JOIN premios p ON f.premio_id = p.id 
            WHERE f.rifa_id = r.id
            ORDER BY COALESCE(p.posicion, 999), f.orden
          ) fotos_subquery
        ), '[]'::json) as fotos_premios
      FROM rifas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM elementos_vendidos
        GROUP BY rifa_id
      ) ev ON r.id = ev.rifa_id
      LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM elementos_reservados
        WHERE activo = true
        GROUP BY rifa_id
      ) er ON r.id = er.rifa_id
      LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM participantes
        GROUP BY rifa_id
      ) p ON r.id = p.rifa_id
      LEFT JOIN (
        SELECT rifa_id, SUM(total_pagado) as total
        FROM participantes
        WHERE estado = 'confirmado'
        GROUP BY rifa_id
      ) tr ON r.id = tr.rifa_id
      LEFT JOIN estadisticas_calificaciones_rifas ratings_stats ON r.id = ratings_stats.rifa_id
      WHERE ${whereClause} AND r.deleted_at IS NULL
      ORDER BY r.fecha_creacion DESC
    `, queryParams).catch(err => {
      if (err.message.includes('does not exist')) {
        console.warn('⚠️ Vistas de calificaciones no encontradas, continuando sin ellas...');
        return query(`
          SELECT 
            r.*,
            u.nombre as creador_nombre,
            u.email as creador_email,
            u.telefono as creador_telefono,
            COALESCE(ev.count, 0) as elementos_vendidos,
            COALESCE(er.count, 0) as elementos_reservados,
            r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0) as elementos_disponibles,
            COALESCE(p.count, 0) as total_participantes,
            COALESCE(tr.total, 0) as total_recaudado,
            0 as total_calificaciones,
            0 as promedio_calificacion_rifa,
            (SELECT COUNT(*) FROM rifas WHERE usuario_id = u.id AND deleted_at IS NULL) as total_rifas_creador,
            COALESCE((
              SELECT json_agg(foto_data)
              FROM (
                SELECT json_build_object(
                  'id', f.id, 
                  'url', f.url_foto, 
                  'url_foto', f.url_foto, 
                  'descripcion', f.descripcion, 
                  'orden', f.orden
                ) as foto_data
                FROM fotos_premios f 
                WHERE f.rifa_id = r.id
                ORDER BY f.orden
              ) fotos_subquery
            ), '[]'::json) as fotos_premios
          FROM rifas r
          JOIN usuarios u ON r.usuario_id = u.id
          LEFT JOIN (
            SELECT rifa_id, COUNT(*) as count
            FROM elementos_vendidos
            GROUP BY rifa_id
          ) ev ON r.id = ev.rifa_id
          LEFT JOIN (
            SELECT rifa_id, COUNT(*) as count
            FROM elementos_reservados
            WHERE activo = true
            GROUP BY rifa_id
          ) er ON r.id = er.rifa_id
          LEFT JOIN (
            SELECT rifa_id, COUNT(*) as count
            FROM participantes
            GROUP BY rifa_id
          ) p ON r.id = p.rifa_id
          LEFT JOIN (
            SELECT rifa_id, SUM(total_pagado) as total
            FROM participantes
            WHERE estado = 'confirmado'
            GROUP BY rifa_id
          ) tr ON r.id = tr.rifa_id
          WHERE ${whereClause}
          ORDER BY r.fecha_creacion DESC
        `, queryParams);
      }
      throw err;
    });

    const rifasConNumeros = await Promise.all(result.rows.map(async (rifa) => {
      const [vendidosResult, reservadosResult] = await Promise.all([
        query('SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1', [rifa.id]),
        query('SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true', [rifa.id])
      ]);

      let fotosPremios = rifa.fotos_premios || [];
      
      if (typeof fotosPremios === 'string') {
        try {
          fotosPremios = JSON.parse(fotosPremios);
        } catch (e) {
          console.error(`Error parsing fotos_premios for rifa ${rifa.id}:`, e);
          fotosPremios = [];
        }
      }
      
      if (fotosPremios === null) {
        fotosPremios = [];
      }
      
      if (!Array.isArray(fotosPremios)) {
        console.warn(`⚠️ fotosPremios no es array para rifa ${rifa.id}:`, fotosPremios);
        fotosPremios = [];
      }
      
      fotosPremios = fotosPremios.map(foto => ({
        ...foto,
        url: foto.url || foto.url_foto || '',
        url_foto: foto.url_foto || foto.url || ''
      }));

      return {
        ...rifa,
        fotosPremios: fotosPremios,
        numerosVendidos: vendidosResult.rows.map(row => String(row.elemento)),
        numerosReservados: reservadosResult.rows.map(row => String(row.elemento))
      };
    }));

    res.json({
      rifas: rifasConNumeros,
      total: rifasConNumeros.length
    });

  } catch (error) {
    console.error('Error obteniendo rifas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// GET /api/rifas/my - Obtener rifas del usuario autenticado
// =====================================================
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT *, 
        CASE 
          WHEN estado = 'pendiente' THEN '⏳ Pendente'
          WHEN estado = 'aprobada' THEN '✅ Aprovada'
          WHEN estado = 'rechazada' THEN '❌ Rejeitada'
          ELSE estado
        END as estado_texto
      FROM rifas 
      WHERE usuario_id = $1 AND deleted_at IS NULL
      ORDER BY fecha_creacion DESC
    `, [req.user.userId]);

    res.json({
      rifas: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo mis rifas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// GET /api/rifas/pendientes - Admin ver rifas pendientes
// =====================================================
router.get('/pendientes', authenticateToken, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    
    const result = await query(
      `SELECT r.*, u.nombre as criador_nome, u.email as criador_email
       FROM rifas r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.estado = 'pendiente' AND r.deleted_at IS NULL
       ORDER BY r.created_at ASC`,
      []
    );
    
    res.json({ rifas: result.rows, total: result.rows.length });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =====================================================
// PUT /api/rifas/:id/aprovar - Admin aprovar/rejeitar rifa
// =====================================================
router.put('/:id/aprovar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'aprobada' ou 'rechazada'
    
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    
    if (estado !== 'aprobada' && estado !== 'rechazada') {
      return res.status(400).json({ error: 'Estado inválido. Use "aprobada" ou "rechazada".' });
    }
    
    const result = await query(
      `UPDATE rifas 
       SET estado = $1, 
           activa = CASE WHEN $1 = 'aprobada' THEN true ELSE false END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [estado, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa não encontrada' });
    }
    
    res.json({
      success: true,
      message: estado === 'aprobada' ? '✅ Rifa aprovada e publicada!' : '❌ Rifa rejeitada.',
      rifa: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error aprobando rifa:', error);
    res.status(500).json({ error: 'Error interno do servidor' });
  }
});

// =====================================================
// PUT /api/rifas/:id/formas-pago
// =====================================================
router.put('/:id/formas-pago', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const formasPago = req.body;

    const rifaResult = await query(
      'SELECT usuario_id FROM rifas WHERE id = $1',
      [id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifaResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permiso para modificar esta rifa',
        code: 'FORBIDDEN'
      });
    }

    await query('DELETE FROM formas_pago WHERE rifa_id = $1', [id]);

    if (formasPago && (formasPago.banco || formasPago.clabe || formasPago.numero_cuenta || formasPago.nombre_titular)) {
      const valores = [
        id,
        formasPago.tipo_pago || 'transferencia',
        formasPago.banco || null,
        formasPago.clabe || null,
        formasPago.numero_cuenta || null,
        formasPago.nombre_titular || null,
        formasPago.telefono || null,
        formasPago.whatsapp || null,
        formasPago.otros_detalles || null
      ];
      
      await query(`
        INSERT INTO formas_pago (
          rifa_id, tipo_pago, banco, clabe, numero_cuenta, nombre_titular, 
          telefono, whatsapp, otros_detalles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, valores);
    }

    const formasPagoResult = await query(
      'SELECT * FROM formas_pago WHERE rifa_id = $1',
      [id]
    );

    res.json({
      message: 'Formas de pago actualizadas exitosamente',
      formasPago: formasPagoResult.rows
    });

  } catch (error) {
    console.error('Error actualizando formas de pago:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// GET /api/rifas/:id - Obtener rifa por ID
// =====================================================
router.get('/:id', validateRifaId, optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const rifaResult = await query(`
      SELECT 
        r.*, 
        u.nombre as creador_nombre, 
        u.email as creador_email, 
        u.telefono as creador_telefono,
        (SELECT COUNT(*) FROM rifas WHERE usuario_id = u.id AND deleted_at IS NULL) as total_rifas_creador
      FROM rifas r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1
    `, [id]);

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    if (rifa.deleted_at && (!req.user || req.user.id !== rifa.usuario_id)) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifa.es_privada && (!req.user || req.user.id !== rifa.usuario_id)) {
      return res.status(403).json({
        error: 'Acceso denegado a rifa privada',
        code: 'PRIVATE_RIFA_ACCESS_DENIED'
      });
    }

    const premiosResult = await query(
      'SELECT * FROM premios WHERE rifa_id = $1 ORDER BY posicion',
      [id]
    );

    let fotosResult;
    try {
      fotosResult = await query(
        `SELECT f.*, p.nombre as premio_nombre, p.posicion as premio_posicion 
         FROM fotos_premios f 
         LEFT JOIN premios p ON f.premio_id = p.id 
         WHERE f.rifa_id = $1 
         ORDER BY COALESCE(p.posicion, 999), f.orden`,
        [id]
      );
    } catch (err) {
      if (err.message.includes('premio_id') || err.message.includes('does not exist')) {
        fotosResult = await query(
          `SELECT f.*, NULL as premio_nombre, NULL as premio_posicion 
           FROM fotos_premios f 
           WHERE f.rifa_id = $1 
           ORDER BY f.orden`,
          [id]
        );
      } else {
        throw err;
      }
    }

    const formasPagoResult = await query(
      'SELECT * FROM formas_pago WHERE rifa_id = $1',
      [id]
    );

    const vendidosResult = await query(
      'SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1',
      [id]
    );

    const reservadosResult = await query(
      'SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true',
      [id]
    );

    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(DISTINCT elemento) FROM elementos_vendidos WHERE rifa_id = $1) as elementos_vendidos,
        (SELECT COUNT(DISTINCT elemento) FROM elementos_reservados WHERE rifa_id = $1 AND activo = true) as elementos_reservados,
        (SELECT COUNT(DISTINCT id) FROM participantes WHERE rifa_id = $1) as total_participantes,
        COALESCE((
          SELECT SUM(total_pagado) 
          FROM participantes 
          WHERE rifa_id = $1 AND estado = 'confirmado'
        ), 0) as total_recaudado
    `, [id]);

    let ratingsStatsResult;
    try {
      ratingsStatsResult = await query(`
        SELECT * FROM estadisticas_calificaciones_rifas WHERE rifa_id = $1
      `, [id]);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.warn('⚠️ Vista de calificaciones no encontrada, usando valores por defecto...');
        ratingsStatsResult = { rows: [] };
      } else {
        throw err;
      }
    }

    let participantes = [];
    if (req.user && req.user.id === rifa.usuario_id) {
      const participantesResult = await query(`
        SELECT * FROM participantes_detallados 
        WHERE rifa_id = $1 
        ORDER BY fecha_participacion DESC
      `, [id]);
      participantes = participantesResult.rows;
    }

    let creadorStatsResult;
    try {
      creadorStatsResult = await query(`
        SELECT * FROM estadisticas_calificaciones_creadores WHERE creador_id = $1
      `, [rifa.usuario_id]);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.warn('⚠️ Vista de calificaciones de creador no encontrada, usando valores por defecto...');
        creadorStatsResult = { rows: [] };
      } else {
        throw err;
      }
    }

    const ratingsStats = ratingsStatsResult.rows[0] || {
      total_calificaciones: 0,
      promedio_calificacion_rifa: null,
      calificaciones_5: 0,
      calificaciones_4: 0,
      calificaciones_3: 0,
      calificaciones_2: 0,
      calificaciones_1: 0
    };

    const creadorStats = creadorStatsResult.rows[0] || {
      total_rifas_creadas: 0,
      total_calificaciones: 0,
      promedio_calificacion_creador: null,
      calificaciones_5: 0,
      calificaciones_4: 0,
      calificaciones_3: 0,
      calificaciones_2: 0,
      calificaciones_1: 0
    };

    const fotosPremiosNormalizadas = fotosResult.rows.map(foto => ({
      id: foto.id,
      url: foto.url_foto,
      url_foto: foto.url_foto,
      descripcion: foto.descripcion,
      orden: foto.orden,
      premio_id: foto.premio_id,
      premio_nombre: foto.premio_nombre,
      premio_posicion: foto.premio_posicion
    }));

    res.json({
      rifa: {
        ...rifa,
        premios: premiosResult.rows,
        fotosPremios: fotosPremiosNormalizadas,
        formasPago: formasPagoResult.rows,
        estadisticas: statsResult.rows[0],
        participantes: participantes,
        numerosVendidos: vendidosResult.rows.map(row => String(row.elemento)),
        numerosReservados: reservadosResult.rows.map(row => String(row.elemento)),
        calificaciones: ratingsStats,
        creador_stats: creadorStats
      }
    });

  } catch (error) {
    console.error('Error obteniendo rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// POST /api/rifas - Crear nueva rifa (cualquier usuario logado)
// =====================================================
router.post('/', authenticateToken, sanitizeInput, validateRifa, async (req, res) => {
  try {
    console.log('🔍 Creando rifa - Usuario:', req.user.userId, 'Rol:', req.user.rol);
    
    const {
      nombre,
      descripcion,
      precio,
      fechaFin,
      tipo,
      cantidadElementos,
      elementosPersonalizados,
      reglas,
      esPrivada,
      fechaSorteo,
      plataformaTransmision,
      otraPlataforma,
      enlaceTransmision,
      metodoSorteo,
      testigos,
      premios = [],
      fotosPremios = [],
      formasPago,
      pais,
      estado,
      ciudad,
      manejaEnvio,
      alcance,
      categoria,
      pixKey,
      aceitaCartao,
      loteriaTipo,
      numeroSorteio,
      videoUrl
    } = req.body;

    const rifaId = Date.now().toString();
    
    // Determinar estado según el rol del usuario
    const estadoInicial = req.user.rol === 'admin' ? 'aprobada' : 'pendiente';
    const activaInicial = req.user.rol === 'admin' ? true : false;
    
    console.log(`📌 Creando rifa con ID: ${rifaId}, Estado: ${estadoInicial}`);

    const rifaResult = await query(`
      INSERT INTO rifas (
        id, usuario_id, nombre, descripcion, precio, fecha_fin, tipo, 
        cantidad_elementos, elementos_personalizados, reglas, es_privada,
        fecha_sorteo, plataforma_transmision, otra_plataforma, enlace_transmision,
        metodo_sorteo, testigos, pais, estado, ciudad, maneja_envio, alcance, categoria,
        numero_ganador, resultado_publicado, activa, estado,
        pix_key, aceita_cartao, loteria_tipo, numero_sorteio, video_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
        NULL, false, $24, $25,
        $26, $27, $28, $29, $30
      ) RETURNING *
    `, [
      rifaId, req.user.userId, nombre, descripcion, precio, fechaFin, tipo,
      cantidadElementos, JSON.stringify(elementosPersonalizados || []), reglas, esPrivada || false,
      fechaSorteo, plataformaTransmision, otraPlataforma, enlaceTransmision,
      metodoSorteo, testigos, pais, estado, ciudad, manejaEnvio || false, alcance || 'local', categoria || null,
      activaInicial, estadoInicial,
      pixKey || null,
      aceitaCartao || false,
      loteriaTipo || null,
      numeroSorteio || null,
      videoUrl || null
    ]);

    const rifa = rifaResult.rows[0];
    console.log(`✅ Rifa creada: ${rifa.id} - ${rifa.nombre} - Estado: ${rifa.estado}`);

    // Insertar premios
    const premioIds = [];
    if (premios && premios.length > 0) {
      console.log(`📦 Insertando ${premios.length} premios...`);
      for (let i = 0; i < premios.length; i++) {
        const premio = premios[i];
        const premioResult = await query(
          `INSERT INTO premios (rifa_id, nombre, descripcion, posicion) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [rifaId, premio.nombre, premio.descripcion || '', premio.posicion || i + 1]
        );
        premioIds.push(premioResult.rows[0].id);
        console.log(`  ✅ Premio ${i + 1}: ${premio.nombre}`);
      }
    }

    // Insertar fotos
    if (fotosPremios && fotosPremios.length > 0) {
      console.log(`📸 Procesando ${fotosPremios.length} fotos...`);
      
      for (let i = 0; i < fotosPremios.length; i++) {
        const foto = fotosPremios[i];
        let urlFoto = foto.url || foto.url_foto || foto.urlFoto || '';
        
        if (!urlFoto || urlFoto === '') {
          console.log(`  ⚠️ Foto ${i} sin URL, saltando...`);
          continue;
        }
        
        if (urlFoto.startsWith('blob:')) {
          console.log(`  ⚠️ Foto ${i} es blob URL, ignorando...`);
          continue;
        }
        
        try {
          await query(
            `INSERT INTO fotos_premios (rifa_id, url_foto, descripcion, orden) 
             VALUES ($1, $2, $3, $4)`,
            [rifaId, urlFoto, foto.descripcion || '', i]
          );
          console.log(`  ✅ Foto ${i} guardada`);
        } catch (err) {
          console.error(`  ❌ Error guardando foto ${i}:`, err.message);
        }
      }
    }

    // Insertar formas de pago
    if (formasPago && Object.keys(formasPago).length > 0) {
      console.log('💳 Insertando formas de pago...');
      const fp = formasPago;
      const normalizado = {
        tipo_pago: fp.tipo_pago || fp.tipoPago || 'transferencia',
        banco: fp.banco || null,
        clabe: fp.clabe || null,
        numero_cuenta: fp.numero_cuenta ?? fp.numeroCuenta ?? null,
        nombre_titular: fp.nombre_titular ?? fp.nombreTitular ?? null,
        telefono: fp.telefono || null,
        whatsapp: fp.whatsapp || null,
        otros_detalles: fp.otros_detalles ?? fp.otrosDetalles ?? null
      };

      await query(`
        INSERT INTO formas_pago (
          rifa_id, tipo_pago, banco, clabe, numero_cuenta, nombre_titular,
          telefono, whatsapp, otros_detalles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        rifaId,
        normalizado.tipo_pago,
        normalizado.banco,
        normalizado.clabe,
        normalizado.numero_cuenta,
        normalizado.nombre_titular,
        normalizado.telefono,
        normalizado.whatsapp,
        normalizado.otros_detalles
      ]);
      console.log('✅ Formas de pago guardadas');
    }

    const fotosVerificacion = await query(
      'SELECT id, url_foto FROM fotos_premios WHERE rifa_id = $1',
      [rifaId]
    );
    console.log(`📸 Verificación final: ${fotosVerificacion.rows.length} fotos guardadas`);

    const mensaje = estadoInicial === 'pendiente' 
      ? 'Rifa criada com sucesso! Aguardando aprovação do administrador.'
      : 'Rifa criada com sucesso!';

    res.status(201).json({
      success: true,
      message: mensaje,
      rifa: {
        id: rifa.id,
        nombre: rifa.nombre,
        descripcion: rifa.descripcion,
        precio: rifa.precio,
        fechaFin: rifa.fecha_fin,
        tipo: rifa.tipo,
        cantidadElementos: rifa.cantidad_elementos,
        esPrivada: rifa.es_privada,
        estado: rifa.estado,
        fotosGuardadas: fotosVerificacion.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error creando rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

// =====================================================
// POST /api/rifas/upload-imagen - Subir imagen temporalmente
// =====================================================
router.post('/upload-imagen', authenticateToken, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/rifas/${req.file.filename}`;
    
    console.log('📸 Imagen subida:', imageUrl);
    
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
    
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// =====================================================
// PUT /api/rifas/:id - Actualizar rifa
// =====================================================
router.put('/:id', authenticateToken, requireAdmin, validateRifaId, sanitizeInput, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rifaResult = await query(
      'SELECT usuario_id FROM rifas WHERE id = $1',
      [id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifaResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para modificar esta rifa',
        code: 'RIFA_ACCESS_DENIED'
      });
    }

    const allowedFields = [
      'nombre', 'descripcion', 'precio', 'fecha_fin', 'reglas', 'es_privada',
      'fecha_sorteo', 'plataforma_transmision', 'otra_plataforma', 
      'enlace_transmision', 'metodo_sorteo', 'testigos',
      'pais', 'estado', 'ciudad', 'maneja_envio', 'alcance',
      'numero_ganador', 'resultado_publicado', 'categoria',
      { from: 'pixKey', to: 'pix_key' },
      { from: 'aceitaCartao', to: 'aceita_cartao' },
      { from: 'loteriaTipo', to: 'loteria_tipo' },
      { from: 'numeroSorteio', to: 'numero_sorteio' },
      { from: 'videoUrl', to: 'video_url' }
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      const fieldConfig = allowedFields.find(f => f === key || (f.from && f.from === key));
      if (fieldConfig) {
        const dbField = typeof fieldConfig === 'string' ? fieldConfig : fieldConfig.to;
        paramCount++;
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No hay campos válidos para actualizar',
        code: 'NO_VALID_FIELDS'
      });
    }

    updateValues.push(id);
    paramCount++;

    const result = await query(`
      UPDATE rifas 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    res.json({
      message: 'Rifa actualizada exitosamente',
      rifa: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// DELETE /api/rifas/:id - Eliminar rifa
// =====================================================
router.delete('/:id', authenticateToken, requireAdmin, validateRifaId, async (req, res) => {
  try {
    const { id } = req.params;

    const rifaResult = await query(
      'SELECT usuario_id, deleted_at FROM rifas WHERE id = $1',
      [id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifaResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar esta rifa',
        code: 'RIFA_ACCESS_DENIED'
      });
    }

    if (rifaResult.rows[0].deleted_at) {
      return res.status(400).json({
        error: 'La rifa ya está eliminada',
        code: 'RIFA_ALREADY_DELETED'
      });
    }

    await query(
      'UPDATE rifas SET deleted_at = CURRENT_TIMESTAMP, activa = false WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Rifa eliminada exitosamente',
      deleted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error eliminando rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// PUT /api/rifas/:id/resultado - Publicar número ganador
// =====================================================
router.put('/:id/resultado', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_ganador, resultado_publicado } = req.body;

    if (resultado_publicado === true && (!numero_ganador || numero_ganador.toString().trim() === '')) {
      return res.status(400).json({ 
        error: 'Para publicar o resultado, informe o número ganador',
        code: 'WINNER_NUMBER_REQUIRED'
      });
    }

    const updateResult = await query(
      `UPDATE rifas 
       SET numero_ganador = $1, 
           resultado_publicado = $2, 
           activa = $3,
           fecha_fin = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE fecha_fin END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4
       RETURNING *`,
      [numero_ganador || null, resultado_publicado === true, resultado_publicado !== true, id]
    );

    const result = await query('SELECT numero_ganador, resultado_publicado, activa, fecha_fin FROM rifas WHERE id = $1', [id]);
    
    if (numero_ganador && resultado_publicado) {
      console.log(`🔍 Buscando ganador para rifa ${id} com número ${numero_ganador}`);
      
      try {
        const { notifyWinnerSelected } = require('../services/notifications');
        const io = req.app.get('io');
        await notifyWinnerSelected(id, numero_ganador, io);
      } catch (notifError) {
        console.error('❌ Error enviando notificação de ganhador:', notifError);
      }
      
      try {
        const ganadorResult = await query(`
          SELECT DISTINCT 
            p.id, 
            p.nombre, 
            p.email, 
            p.telefono,
            p.numeros_seleccionados,
            p.rifa_id, 
            r.nombre as rifa_nombre
          FROM participantes p
          JOIN rifas r ON p.rifa_id = r.id
          WHERE p.rifa_id = $1 
            AND p.estado = 'confirmado'
            AND (
              EXISTS (
                SELECT 1 FROM elementos_vendidos ev 
                WHERE ev.rifa_id = p.rifa_id 
                  AND ev.participante_id = p.id 
                  AND ev.elemento = $2
              )
              OR
              (
                p.numeros_seleccionados IS NOT NULL 
                AND p.numeros_seleccionados::text LIKE $3
              )
            )
          LIMIT 1
        `, [id, String(numero_ganador), `%"${numero_ganador}"%`]);
        
        if (ganadorResult.rows.length > 0) {
          const ganador = ganadorResult.rows[0];
          console.log(`✅ Ganhador encontrado: ${ganador.nombre}`);
          
          try {
            const columnExists = await query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'rifas' AND column_name = 'ganador_id'
            `);
            
            if (columnExists.rows.length > 0) {
              const ganadorId = parseInt(ganador.id, 10);
              await query('UPDATE rifas SET ganador_id = $1 WHERE id = $2', [ganadorId, id]);
            }
          } catch (updateError) {
            console.log('⚠️ No se pudo guardar ganador_id');
          }
          
          try {
            const rifaInfo = await query('SELECT nombre FROM rifas WHERE id = $1', [id]);
            const emailService = require('../config/email');
            
            await emailService.sendWinnerNotification(
              {
                nombre: ganador.nombre,
                email: ganador.email,
                telefono: ganador.telefono || 'No informado'
              },
              {
                id: id,
                nombre: rifaInfo.rows[0]?.nombre || ganador.rifa_nombre,
                numero_ganador: numero_ganador,
                numeros_comprados: ganador.numeros_seleccionados
              }
            );
          } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
          }
          
          try {
            const io = req.app.get('io');
            io.to(`rifa_${id}`).emit('raffle_finished', {
              rifaId: id,
              numero_ganador: numero_ganador,
              ganador_nombre: ganador.nombre
            });
          } catch (ioError) {
            console.error('❌ Error enviando notificación por socket:', ioError);
          }
        }
      } catch (winnerError) {
        console.error('❌ Error en proceso de ganador:', winnerError);
      }
    }
    
    res.json({ 
      message: resultado_publicado === true ? 'Resultado publicado y rifa finalizada' : 'Resultado actualizado',
      resultado: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error actualizando resultado:', error);
    res.status(500).json({ error: 'Error interno do servidor' });
  }
});

// =====================================================
// GET /api/rifas/:id/verificar - Verificar número ganador
// =====================================================
router.get('/:id/verificar', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero } = req.query;
    if (!numero) return res.status(400).json({ error: 'Falta parámetro numero' });

    const result = await query('SELECT numero_ganador, resultado_publicado FROM rifas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rifa no encontrada' });

    const { numero_ganador, resultado_publicado } = result.rows[0];
    if (!resultado_publicado) {
      return res.json({ estado: 'pendiente', mensaje: 'El resultado aún no ha sido publicado' });
    }

    if (!numero_ganador) {
      return res.json({ estado: 'sin_resultado', mensaje: 'No hay número ganador registrado' });
    }

    const esGanador = String(numero_ganador).trim() === String(numero).trim();
    return res.json({ estado: esGanador ? 'ganador' : 'no_ganador', numero_ganador });
  } catch (error) {
    console.error('Error verificando número:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =====================================================
// GET /api/rifas/preview/:id - Vista previa de rifa
// =====================================================
router.get('/preview/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rifaResult = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email
      FROM rifas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1 AND r.activa = true
    `, [id]);

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    const [vendidosResult, reservadosResult] = await Promise.all([
      query('SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1', [id]),
      query('SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true', [id])
    ]);

    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_participantes,
        COUNT(ev.elemento) as elementos_vendidos,
        COALESCE(SUM(CASE WHEN p.estado = 'confirmado' THEN p.total_pagado ELSE 0 END), 0) as total_recaudado
      FROM participantes p
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.rifa_id = $1
    `, [id]);

    const stats = statsResult.rows[0];
    const elementosDisponibles = rifa.cantidad_elementos - parseInt(stats.elementos_vendidos);

    res.json({
      rifa: {
        id: rifa.id,
        nombre: rifa.nombre,
        descripcion: rifa.descripcion,
        precio: rifa.precio,
        fecha_fin: rifa.fecha_fin,
        tipo: rifa.tipo,
        cantidad_elementos: rifa.cantidad_elementos,
        elementos_personalizados: rifa.elementos_personalizados,
        reglas: rifa.reglas,
        fecha_sorteo: rifa.fecha_sorteo,
        plataforma_transmision: rifa.plataforma_transmision,
        enlace_transmision: rifa.enlace_transmision,
        metodo_sorteo: rifa.metodo_sorteo,
        creador_nombre: rifa.creador_nombre,
        numerosVendidos: vendidosResult.rows.map(row => String(row.elemento)),
        numerosReservados: reservadosResult.rows.map(row => String(row.elemento))
      },
      estadisticas: {
        total_participantes: parseInt(stats.total_participantes),
        elementos_vendidos: parseInt(stats.elementos_vendidos),
        elementos_disponibles: elementosDisponibles,
        total_recaudado: parseFloat(stats.total_recaudado || 0)
      },
      esVistaPrevia: true
    });

  } catch (error) {
    console.error('Error obteniendo vista previa de rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;