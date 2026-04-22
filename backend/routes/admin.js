const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats - Estadísticas generales
// GET /api/admin/stats - Estadísticas generales
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const result = await query(`
        SELECT 
          (SELECT COUNT(*) FROM rifas WHERE (resultado_publicado = false OR resultado_publicado IS NULL) AND deleted_at IS NULL) as rifas_ativas,
          (SELECT COUNT(*) FROM rifas WHERE deleted_at IS NULL) as rifas_total,
          (SELECT COUNT(DISTINCT p.id) FROM participantes p WHERE p.estado = 'confirmado') as participantes_total,
          (SELECT COALESCE(SUM(p.total_pagado), 0) FROM participantes p WHERE p.estado = 'confirmado') as receita_total,
          (SELECT COUNT(*) FROM participantes p WHERE p.fecha_participacion >= date_trunc('month', CURRENT_DATE)) as participantes_mes
      `);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

// GET /api/admin/rifas-recentes - Últimas rifas
router.get('/rifas-recentes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.id,
        r.nombre,
        r.tipo,
        r.activa,
        COUNT(DISTINCT p.id) as total_participantes
      FROM rifas r
      LEFT JOIN participantes p ON r.id = p.rifa_id AND p.estado = 'confirmado'
      WHERE r.deleted_at IS NULL
      GROUP BY r.id, r.nombre, r.tipo, r.activa, r.created_at
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    res.json({ rifas: result.rows });
  } catch (error) {
    console.error('Error obteniendo rifas recientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/participantes-recentes - Últimos participantes
router.get('/participantes-recentes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.id,
        p.nombre,
        p.total_pagado,
        p.estado,
        p.fecha_participacion,
        r.nombre as rifa_nombre
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      WHERE p.estado = 'confirmado'
      ORDER BY p.fecha_participacion DESC
      LIMIT 10
    `);
    
    res.json({ participantes: result.rows });
  } catch (error) {
    console.error('Error obteniendo participantes recientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/vendas-por-dia - Ventas por día
router.get('/vendas-por-dia', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { periodo = '7d' } = req.query;
    let intervalo;
    
    if (periodo === '7d') {
      intervalo = "INTERVAL '7 days'";
    } else {
      intervalo = "INTERVAL '30 days'";
    }
    
    const result = await query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', p.fecha_participacion), 'DD/MM') as data,
        COUNT(*) as vendas
      FROM participantes p
      WHERE p.estado = 'confirmado'
        AND p.fecha_participacion >= CURRENT_DATE - ${intervalo}
      GROUP BY DATE_TRUNC('day', p.fecha_participacion)
      ORDER BY DATE_TRUNC('day', p.fecha_participacion) ASC
    `);
    
    res.json({ vendas: result.rows });
  } catch (error) {
    console.error('Error obteniendo ventas por día:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/rifas-por-status - Rifas por estado (ativas vs finalizadas)
// GET /api/admin/rifas-por-status - Rifas por estado (ativas vs finalizadas)
router.get('/rifas-por-status', authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Contar rifas activas (no tienen resultado publicado)
      const ativasResult = await query(`
        SELECT COUNT(*) as total
        FROM rifas
        WHERE deleted_at IS NULL
          AND (resultado_publicado = false OR resultado_publicado IS NULL)
      `);
      
      // Contar rifas finalizadas (tienen resultado publicado)
      const finalizadasResult = await query(`
        SELECT COUNT(*) as total
        FROM rifas
        WHERE deleted_at IS NULL
          AND resultado_publicado = true
      `);
      
      const status = [];
      const ativas = parseInt(ativasResult.rows[0].total);
      const finalizadas = parseInt(finalizadasResult.rows[0].total);
      
      if (ativas > 0) {
        status.push({ name: 'Ativas', total: ativas });
      }
      
      if (finalizadas > 0) {
        status.push({ name: 'Finalizadas', total: finalizadas });
      }
      
      // Si no hay ninguna rifa, mostrar valores por defecto
      if (status.length === 0) {
        status.push({ name: 'Ativas', total: 0 });
        status.push({ name: 'Finalizadas', total: 0 });
      }
      
      console.log('Rifas por status:', { ativas, finalizadas });
      
      res.json({ status });
    } catch (error) {
      console.error('Error obteniendo rifas por status:', error);
      res.json({ 
        status: [
          { name: 'Ativas', total: 0 },
          { name: 'Finalizadas', total: 0 }
        ] 
      });
    }
  });

// GET /api/admin/rifas-por-tipo - Rifas agrupadas por tipo
router.get('/rifas-por-tipo', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const result = await query(`
        SELECT 
          CASE 
            WHEN tipo = 'numeros' THEN 'Números'
            WHEN tipo = 'baraja' THEN 'Baraja'
            WHEN tipo = 'abecedario' THEN 'Abecedário'
            WHEN tipo = 'animales' THEN 'Animales'
            WHEN tipo = 'colores' THEN 'Cores'
            WHEN tipo = 'equipos' THEN 'Equipos'
            WHEN tipo = 'emojis' THEN 'Emojis'
            WHEN tipo = 'paises' THEN 'Países'
            ELSE 'Outros'
          END as name,
          COUNT(*) as total
        FROM rifas
        WHERE deleted_at IS NULL
        GROUP BY tipo
        ORDER BY total DESC
      `);
      
      // Si no hay resultados, devolver datos de ejemplo
      if (result.rows.length === 0) {
        return res.json({ 
          tipos: [
            { name: 'Números', total: 0 }
          ] 
        });
      }
      
      res.json({ tipos: result.rows });
    } catch (error) {
      console.error('Error obteniendo rifas por tipo:', error);
      // En caso de error, devolver array vacío
      res.json({ tipos: [] });
    }
  });

module.exports = router;