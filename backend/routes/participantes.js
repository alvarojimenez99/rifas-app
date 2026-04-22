const express = require('express');
const { pool, query, getClient } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateParticipante, validateRifaId, sanitizeInput } = require('../middleware/validation');
const emailService = require('../config/email');
const { 
  generarEmailDefault, 
  esEmailReal, 
  crearParticipanteHibrido,
  obtenerHistorialParticipaciones
} = require('../utils/participanteUtils');
const { checkAndNotifySoldOut } = require('../utils/raffleUtils');
const { notifyNewParticipation, notifyPaymentConfirmed } = require('../services/notifications');
// participantes.js


const router = express.Router();

// =====================================================
// ENDPOINT DE PRUEBA - MIS PREMIOS
// =====================================================

// =====================================================
// GET /api/participantes/mis-premios - Obtener premios ganados por el usuario
// =====================================================
router.get('/mis-premios', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    console.log('🎯 Buscando premios para usuario:', usuarioId);

    // Buscar todas las rifas donde el usuario ha participado y ha ganado
    const premiosResult = await query(`
      SELECT 
        r.id as rifa_id,
        r.nombre as rifa_nombre,
        r.numero_ganador,
        r.fecha_sorteo,
        r.fecha_fin,
        r.resultado_publicado,
        r.precio,
        p.id as participante_id,
        p.nombre as participante_nombre,
        p.email as participante_email,
        p.numeros_seleccionados,
        p.total_pagado,
        p.fecha_participacion,
        p.estado as participante_estado,
        json_agg(DISTINCT jsonb_build_object(
          'id', f.id,
          'url', f.url_foto,
          'descripcion', f.descripcion
        )) FILTER (WHERE f.id IS NOT NULL) as fotos_premios
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      LEFT JOIN fotos_premios f ON r.id = f.rifa_id
      WHERE p.usuario_id = $1 
        AND p.estado = 'confirmado'
        AND r.resultado_publicado = true
        AND r.numero_ganador IS NOT NULL
        AND (
          -- El número ganador está en los números seleccionados del participante
          p.numeros_seleccionados::text LIKE $2
          OR
          -- O el número ganador está en elementos_vendidos
          EXISTS (
            SELECT 1 FROM elementos_vendidos ev 
            WHERE ev.rifa_id = r.id 
            AND ev.participante_id = p.id 
            AND ev.elemento = r.numero_ganador
          )
        )
      GROUP BY 
        r.id, r.nombre, r.numero_ganador, r.fecha_sorteo, r.fecha_fin, 
        r.resultado_publicado, r.precio,
        p.id, p.nombre, p.email, p.numeros_seleccionados, p.total_pagado, p.fecha_participacion,
        p.estado
      ORDER BY r.fecha_sorteo DESC
    `, [usuarioId, `%"${usuarioId}"%`]);

    console.log(`📊 Encontrados ${premiosResult.rows.length} premios`);

    // Formatear los resultados
    const premios = premiosResult.rows.map(premio => ({
      id: premio.rifa_id,
      rifa_id: premio.rifa_id,
      rifa_nombre: premio.rifa_nombre,
      numero_ganador: premio.numero_ganador,
      fecha_sorteo: premio.fecha_sorteo,
      fecha_fin: premio.fecha_fin,
      resultado_publicado: premio.resultado_publicado,
      premio_nombre: premio.rifa_nombre,
      estado: 'ganador',
      participante: {
        id: premio.participante_id,
        nombre: premio.participante_nombre,
        email: premio.participante_email,
        numeros: premio.numeros_seleccionados,
        total_pagado: parseFloat(premio.total_pagado)
      },
      fotos: premio.fotos_premios || [],
      fecha_participacion: premio.fecha_participacion,
      precio: parseFloat(premio.precio)
    }));

    res.json({
      success: true,
      total: premios.length,
      premios: premios
    });

  } catch (error) {
    console.error('❌ Error obteniendo premios del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// GET /api/participantes/mis-premios/:rifaId - Detalle de un premio específico
// =====================================================
router.get('/mis-premios/:rifaId', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { rifaId } = req.params;

    console.log(`🎯 Buscando detalle del premio ${rifaId} para usuario ${usuarioId}`);

    const premioResult = await query(`
      SELECT 
        r.id as rifa_id,
        r.nombre as rifa_nombre,
        r.descripcion as rifa_descripcion,
        r.numero_ganador,
        r.fecha_sorteo,
        r.fecha_fin,
        r.resultado_publicado,
        r.reglas,
        r.precio,
        p.id as participante_id,
        p.nombre as participante_nombre,
        p.email as participante_email,
        p.telefono as participante_telefono,
        p.numeros_seleccionados,
        p.total_pagado,
        p.fecha_participacion,
        json_agg(DISTINCT jsonb_build_object(
          'id', f.id,
          'url', f.url_foto,
          'descripcion', f.descripcion
        )) FILTER (WHERE f.id IS NOT NULL) as fotos_premios,
        u.nombre as creador_nombre,
        u.email as creador_email,
        u.telefono as creador_telefono
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      LEFT JOIN fotos_premios f ON r.id = f.rifa_id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE p.usuario_id = $1 
        AND p.estado = 'confirmado'
        AND r.id = $2
        AND r.resultado_publicado = true
        AND r.numero_ganador IS NOT NULL
        AND (
          p.numeros_seleccionados::text LIKE $3
          OR EXISTS (
            SELECT 1 FROM elementos_vendidos ev 
            WHERE ev.rifa_id = r.id 
            AND ev.participante_id = p.id 
            AND ev.elemento = r.numero_ganador
          )
        )
      GROUP BY 
        r.id, r.nombre, r.descripcion, r.numero_ganador, r.fecha_sorteo, r.fecha_fin, 
        r.resultado_publicado, r.reglas, r.precio,
        p.id, p.nombre, p.email, p.telefono, p.numeros_seleccionados, p.total_pagado, p.fecha_participacion,
        u.nombre, u.email, u.telefono
    `, [usuarioId, rifaId, `%"${rifaId}"%`]);

    if (premioResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prêmio não encontrado',
        code: 'PREMIO_NOT_FOUND'
      });
    }

    const premio = premioResult.rows[0];

    res.json({
      success: true,
      premio: {
        rifa: {
          id: premio.rifa_id,
          nombre: premio.rifa_nombre,
          descripcion: premio.rifa_descripcion,
          numero_ganador: premio.numero_ganador,
          fecha_sorteo: premio.fecha_sorteo,
          fecha_fin: premio.fecha_fin,
          reglas: premio.reglas,
          precio: parseFloat(premio.precio)
        },
        participante: {
          id: premio.participante_id,
          nombre: premio.participante_nombre,
          email: premio.participante_email,
          telefono: premio.participante_telefono,
          numeros: premio.numeros_seleccionados,
          total_pagado: parseFloat(premio.total_pagado)
        },
        fotos: premio.fotos_premios || [],
        creador: {
          nombre: premio.creador_nombre,
          email: premio.creador_email,
          telefono: premio.creador_telefono
        },
        fecha_participacion: premio.fecha_participacion
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalle del premio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});
// =====================================================
// SISTEMA DE RESERVA TEMPORAL DE NÚMEROS
// =====================================================


// GET /api/participantes/admin/listar - Listar participantes con filtros (admin)
router.get('/admin/listar', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { 
      rifa_id, 
      search, 
      estado, 
      page = 1, 
      limit = 20,
      fecha_inicio,
      fecha_fin
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = ['p.rifa_id IN (SELECT id FROM rifas WHERE usuario_id = $1)'];
    let queryParams = [usuarioId];
    let paramCount = 1;

    if (rifa_id) {
      paramCount++;
      whereConditions.push(`p.rifa_id = $${paramCount}`);
      queryParams.push(rifa_id);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(p.nombre ILIKE $${paramCount} OR p.email ILIKE $${paramCount} OR p.telefono ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (estado && estado !== 'todos') {
      paramCount++;
      whereConditions.push(`p.estado = $${paramCount}`);
      queryParams.push(estado);
    }

    if (fecha_inicio) {
      paramCount++;
      whereConditions.push(`p.fecha_participacion >= $${paramCount}`);
      queryParams.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      whereConditions.push(`p.fecha_participacion <= $${paramCount}`);
      queryParams.push(fecha_fin);
    }

    const whereClause = whereConditions.join(' AND ');

    // Contar total
    const countResult = await query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM participantes p
      WHERE ${whereClause}
    `, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Obtener participantes
    const result = await query(`
      SELECT 
        p.id,
        p.rifa_id,
        p.nombre,
        p.email,
        p.telefono,
        p.numeros_seleccionados,
        p.total_pagado,
        p.estado,
        p.fecha_participacion,
        p.fecha_confirmacion,
        p.motivo_rechazo,
        r.nombre as rifa_nombre,
        r.precio as rifa_precio,
        r.activa as rifa_activa,
        r.resultado_publicado as rifa_resultado
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE ${whereClause}
      ORDER BY p.fecha_participacion DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, parseInt(limit), offset]);

    res.json({
      success: true,
      participantes: result.rows,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Error listando participantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/participantes/:id/desactivar - Desactivar participante (dar de baja)
router.put('/:id/desactivar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Verificar que el participante existe y pertenece al usuario
    const participanteResult = await query(`
      SELECT p.*, r.usuario_id 
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE p.id = $1
    `, [id]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }

    if (participanteResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    // Cambiar estado a rechazado
    await query(`
      UPDATE participantes 
      SET estado = 'rechazado', 
          motivo_rechazo = $1,
          fecha_rechazo = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [motivo || 'Cancelado por el administrador', id]);

    // Liberar números reservados/vendidos
    await query(`
      DELETE FROM elementos_vendidos WHERE participante_id = $1
    `, [id]);

    await query(`
      UPDATE elementos_reservados 
      SET activo = false 
      WHERE participante_id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Participante desactivado correctamente'
    });

  } catch (error) {
    console.error('Error desactivando participante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/participantes/:id/jugadas - Obtener jugadas de un participante
router.get('/:id/jugadas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        p.id,
        p.nombre,
        p.email,
        p.telefono,
        p.numeros_seleccionados,
        p.total_pagado,
        p.estado,
        p.fecha_participacion,
        p.fecha_confirmacion,
        r.id as rifa_id,
        r.nombre as rifa_nombre,
        r.numero_ganador,
        r.resultado_publicado,
        r.precio as rifa_precio,
        array_agg(ev.elemento) as elementos_vendidos
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.id = $1
      GROUP BY p.id, r.id, r.nombre, r.numero_ganador, r.resultado_publicado, r.precio
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }

    res.json({
      success: true,
      participante: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo jugadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// POST /api/participantes/:rifaId/reservar - Reservar números temporalmente
router.post('/:rifaId/reservar', authenticateToken, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { numerosSeleccionados } = req.body;
    const usuarioId = req.user.id;

    if (!numerosSeleccionados || numerosSeleccionados.length === 0) {
      return res.status(400).json({
        error: 'Selecione pelo menos um número',
        code: 'NO_NUMBERS'
      });
    }

    // Verificar cada número
    for (const numero of numerosSeleccionados) {
      // Verificar si ya está vendido
      const vendido = await query(
        'SELECT id FROM elementos_vendidos WHERE rifa_id = $1 AND elemento = $2',
        [rifaId, String(numero)]
      );
      if (vendido.rows.length > 0) {
        return res.status(409).json({
          error: `O número ${numero} já está vendido`,
          code: 'NUMBER_SOLD',
          numero: numero
        });
      }

      // Verificar si ya está reservado por otro usuario
      const reservado = await query(
        `SELECT id, usuario_id FROM elementos_reservados 
         WHERE rifa_id = $1 AND elemento = $2 AND activo = true AND expira_en > NOW()`,
        [rifaId, String(numero)]
      );
      if (reservado.rows.length > 0 && reservado.rows[0].usuario_id !== usuarioId) {
        return res.status(409).json({
          error: `O número ${numero} já está reservado por outro usuário`,
          code: 'NUMBER_RESERVED',
          numero: numero
        });
      }
    }

    // Calcular fecha de expiración (15 minutos)
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + 15);

    // Crear o actualizar reservas
    for (const numero of numerosSeleccionados) {
      // Eliminar reservas viejas del mismo usuario para este número
      await query(
        `DELETE FROM elementos_reservados 
         WHERE rifa_id = $1 AND elemento = $2 AND usuario_id = $3`,
        [rifaId, String(numero), usuarioId]
      );

      // Crear nueva reserva
      await query(
        `INSERT INTO elementos_reservados 
         (rifa_id, elemento, usuario_id, reservado_en, expira_en, activo)
         VALUES ($1, $2, $3, NOW(), $4, true)`,
        [rifaId, String(numero), usuarioId, expiraEn]
      );
    }

    res.json({
      success: true,
      message: `${numerosSeleccionados.length} número(s) reservado(s) por 15 minutos`,
      expira_en: expiraEn.toISOString(),
      numeros: numerosSeleccionados
    });

  } catch (error) {
    console.error('Error reservando números:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/participantes/:rifaId/reservas/usuario - Obtener reservas del usuario
router.get('/:rifaId/reservas/usuario', authenticateToken, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const usuarioId = req.user.id;

    const result = await query(
      `SELECT elemento, expira_en, 
        EXTRACT(EPOCH FROM (expira_en - NOW())) as segundos_restantes
       FROM elementos_reservados 
       WHERE rifa_id = $1 AND usuario_id = $2 AND activo = true AND expira_en > NOW()`,
      [rifaId, usuarioId]
    );

    res.json({
      reservas: result.rows,
      tiene_reservas: result.rows.length > 0
    });

  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/participantes/:rifaId/reservas - Cancelar reservas
router.delete('/:rifaId/reservas', authenticateToken, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const usuarioId = req.user.id;

    await query(
      `UPDATE elementos_reservados 
       SET activo = false 
       WHERE rifa_id = $1 AND usuario_id = $2 AND activo = true`,
      [rifaId, usuarioId]
    );

    res.json({
      success: true,
      message: 'Reservas canceladas com sucesso'
    });

  } catch (error) {
    console.error('Error cancelando reservas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId/confirmar-pago - Confirmar pago y convertir reserva en venta
// POST /api/participantes/:rifaId/confirmar-pago - Confirmar pago
router.post('/:rifaId/confirmar-pago', authenticateToken, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { numerosSeleccionados, total, metodoPago } = req.body;
    const usuarioId = req.user.id;

    // Obtener datos del usuario
    const userResult = await query(
      'SELECT nombre, email, telefono FROM usuarios WHERE id = $1',
      [usuarioId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const user = userResult.rows[0];

    // Obtener datos de la rifa
    const rifaResult = await query(
      'SELECT nombre, precio FROM rifas WHERE id = $1',
      [rifaId]
    );
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa não encontrada' });
    }
    const rifa = rifaResult.rows[0];

    // Verificar que todos los números aún están disponibles
    for (const numero of numerosSeleccionados) {
      const disponible = await query(
        `SELECT numero_disponible($1, $2)`,
        [rifaId, String(numero)]
      );
      if (!disponible.rows[0].numero_disponible) {
        return res.status(409).json({
          error: `O número ${numero} não está mais disponível`,
          code: 'NUMBER_UNAVAILABLE',
          numero: numero
        });
      }
    }

    // Usar pool directamente para la transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Crear participante
      const participanteResult = await client.query(
        `INSERT INTO participantes 
         (rifa_id, nombre, email, telefono, numeros_seleccionados, total_pagado, estado, metodo_pago)
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmado', $7)
         RETURNING id`,
        [rifaId, user.nombre, user.email, user.telefono, JSON.stringify(numerosSeleccionados), total, metodoPago]
      );
      const participanteId = participanteResult.rows[0].id;

      // Registrar números vendidos
      for (const numero of numerosSeleccionados) {
        await client.query(
          `INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
           VALUES ($1, $2, $3, NOW())`,
          [rifaId, participanteId, String(numero)]
        );
      }

      // Eliminar reservas
      await client.query(
        `UPDATE elementos_reservados 
         SET activo = false 
         WHERE rifa_id = $1 AND usuario_id = $2 AND elemento = ANY($3)`,
        [rifaId, usuarioId, numerosSeleccionados]
      );

      // Actualizar estadísticas
      await client.query(
        `UPDATE rifas 
         SET elementos_vendidos = (SELECT COUNT(*) FROM elementos_vendidos WHERE rifa_id = $1),
             total_participantes = (SELECT COUNT(DISTINCT participante_id) FROM elementos_vendidos WHERE rifa_id = $1),
             total_recaudado = (SELECT COALESCE(SUM(total_pagado), 0) FROM participantes WHERE rifa_id = $1 AND estado = 'confirmado')
         WHERE id = $1`,
        [rifaId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Pagamento confirmado e números registrados!',
        participante: {
          id: participanteId,
          numeros: numerosSeleccionados,
          total: total
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({
      error: 'Error interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// ENDPOINTS EXISTENTES
// =====================================================

// GET /api/participantes/:rifaId - Obtener participantes de una rifa
router.get('/:rifaId', validateRifaId, optionalAuth, async (req, res) => {
  try {
    const { rifaId } = req.params;

    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    if (rifa.es_privada && (!req.user || req.user.id !== rifa.usuario_id)) {
      return res.status(403).json({
        error: 'Acceso denegado a rifa privada',
        code: 'PRIVATE_RIFA_ACCESS_DENIED'
      });
    }

    const result = await query(`
      SELECT * FROM participantes_detallados 
      WHERE rifa_id = $1 
      ORDER BY fecha_participacion DESC
    `, [rifaId]);

    res.json({
      participantes: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo participantes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId - Participar en una rifa (Registro Obligatorio)
router.post('/:rifaId', validateRifaId, sanitizeInput, validateParticipante, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { nombre, telefono, email, numerosSeleccionados } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email es obligatorio para participar',
        code: 'EMAIL_REQUIRED'
      });
    }

    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1 AND activa = true AND fecha_fin > CURRENT_TIMESTAMP',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_AVAILABLE'
      });
    }

    const rifa = rifaResult.rows[0];

    const elementosDisponibles = await query(`
      SELECT elemento 
      FROM (
        SELECT jsonb_array_elements_text(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
      ) todos_elementos
      WHERE elemento NOT IN (
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
        UNION
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      )
    `, [rifaId]);

    const disponibles = elementosDisponibles.rows.map(row => String(row.elemento));
    const noDisponibles = numerosSeleccionados.filter(num => !disponibles.includes(String(num)));

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        error: 'Algunos números no están disponibles',
        details: {
          noDisponibles,
          disponibles: disponibles.slice(0, 10)
        },
        code: 'NUMBERS_NOT_AVAILABLE'
      });
    }

    const reservaId = `reserva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);

    const participante = await crearParticipanteHibrido(
      { nombre, telefono, email, numerosSeleccionados },
      rifaId,
      rifa,
      'pendiente',
      reservaId,
      fechaExpiracion
    );

    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_reservados (
          rifa_id, participante_id, elemento, reserva_id, fecha_expiracion
        ) VALUES ($1, $2, $3, $4, $5)
      `, [rifaId, participante.id, elemento, reservaId, fechaExpiracion]);
    }

    try {
      await emailService.sendParticipationConfirmation({
        participante: {
          nombre: participante.nombre,
          email: participante.email,
          numerosSeleccionados: participante.numeros_seleccionados,
          totalPagado: participante.total_pagado
        },
        rifa: {
          nombre: rifa.nombre,
          descripcion: rifa.descripcion,
          fechaFin: rifa.fecha_fin,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/participante/${rifaId}/${participante.id}`
        }
      });
      console.log(`✅ Correo enviado a ${participante.email} para participación`);
    } catch (emailError) {
      console.error('❌ Error enviando correo de confirmación:', emailError);
    }

    try {
      const io = req.app.get('io');
      await notifyNewParticipation(
        rifaId,
        rifa.usuario_id,
        {
          nombre_participante: participante.nombre,
          numeros: participante.numeros_seleccionados,
          total: participante.total_pagado
        },
        io
      );
    } catch (notifError) {
      console.error('❌ Error enviando notificación de participación:', notifError);
    }

    res.status(201).json({
      message: 'Participación registrada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        telefono: participante.telefono,
        numerosSeleccionados: participante.numeros_seleccionados,
        totalPagado: participante.total_pagado,
        estado: participante.estado,
        reservaId: participante.reserva_id,
        fechaExpiracion: participante.reserva_expiracion
      },
      instrucciones: {
        mensaje: 'Los números han sido apartados temporalmente por 15 minutos.',
        pasos: [
          '1. Realiza el pago según las instrucciones de la rifa',
          '2. Envía el comprobante al organizador',
          '3. El organizador validará tu pago',
          '4. Una vez validado, tu participación será confirmada'
        ]
      }
    });

  } catch (error) {
    console.error('Error registrando participación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/participantes/:participanteId/validar - Validar pago de participante
router.put('/:participanteId/validar', authenticateToken, async (req, res) => {
  try {
    const { participanteId } = req.params;

    const participanteResult = await query(`
      SELECT p.*, r.usuario_id, r.precio
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE p.id = $1 AND p.estado = 'pendiente'
    `, [participanteId]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado o ya procesado',
        code: 'PARTICIPANTE_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    if (participante.usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para validar este participante',
        code: 'VALIDATION_ACCESS_DENIED'
      });
    }

    if (new Date() > new Date(participante.reserva_expiracion)) {
      return res.status(400).json({
        error: 'La reserva ha expirado',
        code: 'RESERVA_EXPIRED'
      });
    }

    const client = await query.getClient();
    await client.query('BEGIN');

    try {
      await client.query(`
        UPDATE participantes 
        SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [participanteId]);

      const elementosReservados = await client.query(`
        SELECT elemento FROM elementos_reservados 
        WHERE participante_id = $1 AND activo = true
      `, [participanteId]);

      for (const row of elementosReservados.rows) {
        await client.query(`
          INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento)
          VALUES ($1, $2, $3)
        `, [participante.rifa_id, participanteId, row.elemento]);
      }

      await client.query(`
        UPDATE elementos_reservados 
        SET activo = false 
        WHERE participante_id = $1
      `, [participanteId]);

      await client.query('COMMIT');

      res.json({
        message: 'Pago validado exitosamente',
        participante: {
          id: participante.id,
          nombre: participante.nombre,
          estado: 'confirmado',
          fechaConfirmacion: new Date().toISOString()
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error validando pago:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/participantes/:participanteId/rechazar - Rechazar participante
router.put('/:participanteId/rechazar', authenticateToken, async (req, res) => {
  try {
    const { participanteId } = req.params;
    const { motivo } = req.body;

    const participanteResult = await query(`
      SELECT p.*, r.usuario_id
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE p.id = $1 AND p.estado = 'pendiente'
    `, [participanteId]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado o ya procesado',
        code: 'PARTICIPANTE_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    if (participante.usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para rechazar este participante',
        code: 'REJECTION_ACCESS_DENIED'
      });
    }

    const client = await query.getClient();
    await client.query('BEGIN');

    try {
      await client.query(`
        UPDATE participantes 
        SET estado = 'rechazado', fecha_rechazo = CURRENT_TIMESTAMP, motivo_rechazo = $1
        WHERE id = $2
      `, [motivo || 'Sin motivo especificado', participanteId]);

      await client.query(`
        UPDATE elementos_reservados 
        SET activo = false 
        WHERE participante_id = $1
      `, [participanteId]);

      await client.query('COMMIT');

      res.json({
        message: 'Participante rechazado exitosamente',
        participante: {
          id: participante.id,
          nombre: participante.nombre,
          estado: 'rechazado',
          motivoRechazo: motivo || 'Sin motivo especificado',
          fechaRechazo: new Date().toISOString()
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error rechazando participante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/participantes/:rifaId/elementos - Obtener elementos disponibles de una rifa
router.get('/:rifaId/elementos', validateRifaId, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { estado } = req.query;

    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];
    let elementos = [];

    if (estado === 'disponibles') {
      const result = await query(`
        SELECT elemento 
        FROM (
          SELECT unnest(elementos_personalizados) as elemento 
          FROM rifas 
          WHERE id = $1
        ) todos_elementos
        WHERE elemento NOT IN (
          SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
          UNION
          SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
        )
        ORDER BY elemento
      `, [rifaId]);
      elementos = result.rows.map(row => ({ elemento: row.elemento, estado: 'disponible' }));

    } else if (estado === 'vendidos') {
      const result = await query(`
        SELECT ev.elemento, ev.fecha_venta, p.nombre as participante_nombre
        FROM elementos_vendidos ev
        JOIN participantes p ON ev.participante_id = p.id
        WHERE ev.rifa_id = $1
        ORDER BY ev.fecha_venta DESC
      `, [rifaId]);
      elementos = result.rows.map(row => ({ 
        elemento: row.elemento, 
        estado: 'vendido',
        fechaVenta: row.fecha_venta,
        participanteNombre: row.participante_nombre
      }));

    } else if (estado === 'reservados') {
      const result = await query(`
        SELECT er.elemento, er.fecha_reserva, er.fecha_expiracion, p.nombre as participante_nombre
        FROM elementos_reservados er
        LEFT JOIN participantes p ON er.participante_id = p.id
        WHERE er.rifa_id = $1 AND er.activo = true
        ORDER BY er.fecha_reserva ASC
      `, [rifaId]);
      elementos = result.rows.map(row => ({ 
        elemento: row.elemento, 
        estado: 'reservado',
        fechaReserva: row.fecha_reserva,
        fechaExpiracion: row.fecha_expiracion,
        participanteNombre: row.participante_nombre
      }));

    } else {
      const todosResult = await query(`
        SELECT unnest(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
        ORDER BY elemento
      `, [rifaId]);

      const vendidosResult = await query(`
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
      `, [rifaId]);

      const reservadosResult = await query(`
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      `, [rifaId]);

      const vendidos = new Set(vendidosResult.rows.map(row => row.elemento));
      const reservados = new Set(reservadosResult.rows.map(row => row.elemento));

      elementos = todosResult.rows.map(row => {
        const elemento = row.elemento;
        let estado = 'disponible';
        if (vendidos.has(elemento)) estado = 'vendido';
        else if (reservados.has(elemento)) estado = 'reservado';
        return { elemento, estado };
      });
    }

    res.json({
      rifaId,
      elementos,
      total: elementos.length,
      estadisticas: {
        disponibles: elementos.filter(e => e.estado === 'disponible').length,
        vendidos: elementos.filter(e => e.estado === 'vendido').length,
        reservados: elementos.filter(e => e.estado === 'reservado').length
      }
    });

  } catch (error) {
    console.error('Error obteniendo elementos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId/vender - Venta directa por participantes
router.post('/:rifaId/vender', validateRifaId, authenticateToken, sanitizeInput, validateParticipante, async (req, res) => {
  try {
    const { rifaId } = req.params;
    const { nombre, telefono, email, numerosSeleccionados } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email es obligatorio para participar',
        code: 'EMAIL_REQUIRED'
      });
    }

    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1 AND activa = true AND fecha_fin > CURRENT_TIMESTAMP',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_AVAILABLE'
      });
    }

    const rifa = rifaResult.rows[0];

    const elementosDisponibles = await query(`
      SELECT elemento 
      FROM (
        SELECT jsonb_array_elements_text(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
      ) todos_elementos
      WHERE elemento NOT IN (
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
        UNION
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      )
    `, [rifaId]);

    const disponibles = elementosDisponibles.rows.map(row => String(row.elemento));
    const noDisponibles = numerosSeleccionados.filter(num => !disponibles.includes(String(num)));

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        error: 'Algunos números no están disponibles',
        details: {
          noDisponibles,
          disponibles: disponibles.slice(0, 10)
        },
        code: 'NUMBERS_NOT_AVAILABLE'
      });
    }

    const participante = await crearParticipanteHibrido(
      { nombre, telefono, email, numerosSeleccionados },
      rifaId,
      rifa,
      'confirmado'
    );

    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_vendidos (
          rifa_id, participante_id, elemento, fecha_venta
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [rifaId, participante.id, elemento]);
    }

    await query(`
      UPDATE rifas 
      SET elementos_vendidos = (SELECT COUNT(*) FROM elementos_vendidos WHERE rifa_id = $1),
          total_participantes = (SELECT COUNT(DISTINCT participante_id) FROM elementos_vendidos WHERE rifa_id = $1),
          total_recaudado = (SELECT COALESCE(SUM(total_pagado), 0) FROM participantes WHERE rifa_id = $1 AND estado = 'confirmado')
      WHERE id = $1
    `, [rifaId]);

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const participanteUrl = `${frontendUrl}/participante/${rifaId}/${participante.id}`;
      
      await emailService.sendParticipationConfirmation({
        participante: {
          nombre: participante.nombre,
          email: participante.email,
          numerosSeleccionados: participante.numeros_seleccionados,
          totalPagado: participante.total_pagado
        },
        rifa: {
          nombre: rifa.nombre,
          descripcion: rifa.descripcion,
          fechaFin: rifa.fecha_fin,
          url: participanteUrl
        }
      });
      console.log(`✅ Correo enviado a ${participante.email} para venta directa`);
    } catch (emailError) {
      console.error('❌ Error enviando correo de confirmación:', emailError);
    }

    try {
      const io = req.app.get('io');
      await notifyNewParticipation(
        rifaId,
        rifa.usuario_id,
        {
          nombre_participante: participante.nombre,
          numeros: participante.numeros_seleccionados,
          total: participante.total_pagado
        },
        io
      );
    } catch (notifError) {
      console.error('❌ Error enviando notificación de participación:', notifError);
    }

    res.status(201).json({
      message: 'Participación registrada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        telefono: participante.telefono,
        numerosSeleccionados: participante.numeros_seleccionados,
        totalPagado: participante.total_pagado,
        estado: participante.estado,
        fechaParticipacion: participante.fecha_participacion
      },
      venta: {
        tipo: 'directa',
        confirmada: true,
        mensaje: 'Los números han sido vendidos y confirmados automáticamente'
      }
    });

  } catch (error) {
    console.error('Error en venta directa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/participantes/:rifaId/vender-admin - Venta directa por admin
router.post('/:rifaId/vender-admin', validateRifaId, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { rifaId } = req.params;
    let { nombre, telefono, email, numerosSeleccionados } = req.body;

    if (!Array.isArray(numerosSeleccionados) || numerosSeleccionados.length === 0) {
      return res.status(400).json({
        error: 'Debes seleccionar al menos un elemento',
        code: 'NO_ELEMENTS_SELECTED'
      });
    }

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        error: 'El nombre del participante es obligatorio',
        code: 'NAME_REQUIRED'
      });
    }

    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1 AND activa = true AND fecha_fin > CURRENT_TIMESTAMP',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_AVAILABLE'
      });
    }

    const rifa = rifaResult.rows[0];

    const elementosDisponibles = await query(`
      SELECT elemento 
      FROM (
        SELECT jsonb_array_elements_text(elementos_personalizados) as elemento 
        FROM rifas 
        WHERE id = $1
      ) todos_elementos
      WHERE elemento NOT IN (
        SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1
        UNION
        SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true
      )
    `, [rifaId]);

    const disponibles = elementosDisponibles.rows.map(row => String(row.elemento));
    const noDisponibles = numerosSeleccionados.filter(num => !disponibles.includes(String(num)));

    if (noDisponibles.length > 0) {
      return res.status(400).json({
        error: 'Algunos números no están disponibles',
        details: { noDisponibles, disponibles: disponibles.slice(0, 10) },
        code: 'NUMBERS_NOT_AVAILABLE'
      });
    }

    if (!email || !email.trim()) {
      email = generarEmailDefault(nombre, rifaId);
    }

    const participante = await crearParticipanteHibrido(
      { nombre, telefono: telefono || null, email, numerosSeleccionados },
      rifaId,
      rifa,
      'confirmado'
    );

    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_vendidos (
          rifa_id, participante_id, elemento, fecha_venta
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [rifaId, participante.id, elemento]);
    }

    try {
      if (esEmailReal(email)) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const participanteUrl = `${frontendUrl}/participante/${rifaId}/${participante.id}`;
        await emailService.sendParticipationConfirmation({
          participante: {
            nombre: participante.nombre,
            email: participante.email,
            numerosSeleccionados: participante.numeros_seleccionados,
            totalPagado: participante.total_pagado
          },
          rifa: {
            nombre: rifa.nombre,
            descripcion: rifa.descripcion,
            fechaFin: rifa.fecha_fin,
            url: participanteUrl
          }
        });
      }
    } catch (emailError) {
      console.error('❌ Error enviando correo (invitado permitido):', emailError);
    }

    res.status(201).json({
      message: 'Venta realizada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        email: participante.email,
        telefono: participante.telefono,
        numerosSeleccionados: participante.numeros_seleccionados,
        totalPagado: participante.total_pagado,
        estado: participante.estado
      },
      venta: { tipo: 'directa_admin', confirmada: true }
    });

  } catch (error) {
    console.error('Error en vender-admin:', error);
    res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/participantes/:rifaId/confirmar-venta - Confirmar venta de administrador
router.post('/:rifaId/confirmar-venta', validateRifaId, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    console.log('Confirmar venta - Iniciando...');
    const { rifaId } = req.params;
    const { participanteId } = req.body;

    const rifaResult = await query(
      'SELECT * FROM rifas WHERE id = $1',
      [rifaId]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    if (req.user.id !== rifa.usuario_id) {
      return res.status(403).json({
        error: 'Solo el creador de la rifa puede confirmar ventas',
        code: 'UNAUTHORIZED_CONFIRMATION'
      });
    }

    const participanteResult = await query(
      'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2',
      [participanteId, rifaId]
    );

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    await query(`
      UPDATE participantes 
      SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [participanteId]);

    const numerosSeleccionados = participante.numeros_seleccionados;
    
    await query(`
      DELETE FROM elementos_reservados 
      WHERE rifa_id = $1 AND participante_id = $2
    `, [rifaId, participanteId]);
    
    for (const elemento of numerosSeleccionados) {
      await query(`
        INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (rifa_id, elemento) DO NOTHING
      `, [rifaId, participanteId, elemento]);
    }

    try {
      const participanteData = {
        nombre: participante.nombre,
        email: participante.email,
        numerosSeleccionados: numerosSeleccionados,
        totalPagar: (parseFloat(rifa.precio) * numerosSeleccionados.length).toFixed(2)
      };

      const rifaData = {
        id: rifa.id,
        nombre: rifa.nombre,
        fecha_sorteo: rifa.fecha_sorteo,
        plataforma_transmision: rifa.plataforma_transmision
      };

      await emailService.sendParticipationConfirmation(participanteData, rifaData);
      console.log('✅ Email de confirmación enviado al participante');
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
    }

    try {
      const io = req.app.get('io');
      const total = (parseFloat(rifa.precio) * numerosSeleccionados.length).toFixed(2);
      
      await notifyPaymentConfirmed(
        participanteId,
        rifaId,
        {
          usuario_id: null,
          total: total
        },
        rifa.usuario_id,
        io
      );
    } catch (notifError) {
      console.error('❌ Error enviando notificación de pago confirmado:', notifError);
    }

    try {
      await checkAndNotifySoldOut(rifaId);
    } catch (soldOutError) {
      console.error('❌ Error verificando rifa agotada:', soldOutError);
    }

    res.json({
      message: 'Venta confirmada exitosamente',
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        estado: 'confirmado',
        numerosSeleccionados: numerosSeleccionados
      }
    });

  } catch (error) {
    console.error('Error confirmando venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/participantes/:rifaId/participante/:participanteId - Vista confidencial del participante
router.get('/:rifaId/participante/:participanteId', async (req, res) => {
  try {
    const { rifaId, participanteId } = req.params;

    const rifaResult = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email
      FROM rifas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1 AND r.activa = true
    `, [rifaId]);

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    const participanteResult = await query(`
      SELECT 
        p.*,
        array_agg(ev.elemento ORDER BY ev.elemento) as numeros_seleccionados
      FROM participantes p
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.id = $1 AND p.rifa_id = $2
      GROUP BY p.id
    `, [participanteId, rifaId]);

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Participante no encontrado',
        code: 'PARTICIPANTE_NOT_FOUND'
      });
    }

    const participante = participanteResult.rows[0];

    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_participantes,
        COUNT(ev.elemento) as elementos_vendidos,
        COALESCE(SUM(CASE WHEN p.estado = 'confirmado' THEN p.total_pagado ELSE 0 END), 0) as total_recaudado
      FROM participantes p
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.rifa_id = $1
    `, [rifaId]);

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
        creador_nombre: rifa.creador_nombre
      },
      participante: {
        id: participante.id,
        nombre: participante.nombre,
        email: participante.email,
        telefono: participante.telefono,
        numeros_seleccionados: participante.numeros_seleccionados || [],
        total_pagado: participante.total_pagado,
        fecha_participacion: participante.fecha_participacion,
        estado: participante.estado
      },
      estadisticas: {
        total_participantes: parseInt(stats.total_participantes),
        elementos_vendidos: parseInt(stats.elementos_vendidos),
        elementos_disponibles: elementosDisponibles,
        total_recaudado: parseFloat(stats.total_recaudado || 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos del participante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/participantes/historial/:email - Obtener historial de participaciones
router.get('/historial/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!esEmailReal(email)) {
      return res.status(400).json({
        error: 'Email no válido para historial',
        code: 'INVALID_EMAIL'
      });
    }

    const participaciones = await obtenerHistorialParticipaciones(email);

    res.json({
      email,
      totalParticipaciones: participaciones.length,
      participaciones: participaciones.map(p => ({
        id: p.id,
        rifa: {
          id: p.rifa_id,
          nombre: p.rifa_nombre,
          descripcion: p.rifa_descripcion,
          precio: p.rifa_precio,
          fecha_fin: p.fecha_fin,
          tipo: p.rifa_tipo,
          activa: p.rifa_activa,
          creador: p.creador_nombre
        },
        numeros_seleccionados: p.numeros_seleccionados,
        total_pagado: p.total_pagado,
        estado: p.estado,
        fecha_participacion: p.fecha_participacion,
        fecha_confirmacion: p.fecha_confirmacion
      }))
    });

  } catch (error) {
    console.error('Error obteniendo historial de participaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});


// POST /api/participantes/registro - Registro de participante
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    if (!nombre || !email || !telefono) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
        code: 'MISSING_FIELDS'
      });
    }

    const usuarioExistente = await query(
      'SELECT id FROM usuarios_participantes WHERE email = $1',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        error: 'Este email ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }

    const nuevoUsuario = await query(`
      INSERT INTO usuarios_participantes (email, nombre, telefono)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [email, nombre, telefono]);

    res.status(201).json({
      message: 'Usuario participante registrado exitosamente',
      usuario: {
        id: nuevoUsuario.rows[0].id,
        nombre: nuevoUsuario.rows[0].nombre,
        email: nuevoUsuario.rows[0].email,
        telefono: nuevoUsuario.rows[0].telefono
      }
    });

  } catch (error) {
    console.error('Error registrando participante:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;