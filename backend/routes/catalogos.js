const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/catalogos/paises - Obtener lista de países
router.get('/paises', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, codigo, nombre, nombre_es FROM paises WHERE activo = true ORDER BY nombre_es'
    );
    
    res.json({
      paises: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo países:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/catalogos/estados/:paisCodigo - Obtener estados por país
router.get('/estados/:paisCodigo', async (req, res) => {
  try {
    const { paisCodigo } = req.params;
    
    const result = await query(
      `SELECT e.id, e.codigo, e.nombre, e.nombre_es 
       FROM estados e
       JOIN paises p ON e.pais_id = p.id
       WHERE p.codigo = $1 AND e.activo = true
       ORDER BY e.nombre_es`,
      [paisCodigo]
    );
    
    res.json({
      estados: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/catalogos/ciudades/:estadoId - Obtener ciudades por estado
router.get('/ciudades/:estadoId', async (req, res) => {
  try {
    const { estadoId } = req.params;
    
    const result = await query(
      `SELECT id, nombre, nombre_es, codigo_postal 
       FROM ciudades
       WHERE estado_id = $1 AND activo = true
       ORDER BY nombre_es`,
      [estadoId]
    );
    
    res.json({
      ciudades: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo ciudades:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/catalogos/ciudades/estado/:estadoCodigo - Obtener ciudades por código de estado
router.get('/ciudades/estado/:estadoCodigo', async (req, res) => {
  try {
    const { estadoCodigo } = req.params;
    
    const result = await query(
      `SELECT c.id, c.nombre, c.nombre_es, c.codigo_postal 
       FROM ciudades c
       JOIN estados e ON c.estado_id = e.id
       WHERE e.codigo = $1 AND c.activo = true
       ORDER BY c.nombre_es`,
      [estadoCodigo]
    );
    
    res.json({
      ciudades: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo ciudades:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// NUEVO ENDPOINT: GET /api/catalogos/categorias
// =====================================================
router.get('/categorias', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nome, slug, descricao 
       FROM categorias 
       WHERE ativo = true 
       ORDER BY ordem`
    );
    
    res.json({
      categorias: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    
    // Si la tabla no existe, crearla automáticamente
    if (error.code === '42P01') {
      console.log('📦 Tabla "categorias" no encontrada. Creándola...');
      
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS categorias (
              id SERIAL PRIMARY KEY,
              nome VARCHAR(100) NOT NULL,
              slug VARCHAR(100) UNIQUE NOT NULL,
              descricao TEXT,
              ativo BOOLEAN DEFAULT true,
              ordem INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        await query(`
          INSERT INTO categorias (nome, slug, descricao, ordem) VALUES
          ('Infantil', 'infantil', 'Rifas com prêmios para crianças', 1),
          ('Automóveis', 'automoveis', 'Carros, motos e veículos', 2),
          ('Imóveis', 'imoveis', 'Casas, apartamentos, terrenos', 3),
          ('Eletrodomésticos', 'eletrodomesticos', 'Geladeiras, TVs, máquinas de lavar', 4),
          ('Eletrônicos', 'eletronicos', 'Celulares, notebooks, tablets', 5),
          ('Viagens', 'viagens', 'Pacotes de viagem, passagens', 6),
          ('Experiências', 'experiencias', 'Jantares, eventos, cursos', 7),
          ('Outros', 'outros', 'Outros tipos de prêmios', 8)
          ON CONFLICT (slug) DO NOTHING;
        `);
        
        // Reintentar consulta después de crear la tabla
        const resultRetry = await query(
          `SELECT id, nome, slug, descricao 
           FROM categorias 
           WHERE ativo = true 
           ORDER BY ordem`
        );
        
        console.log('✅ Tabla "categorias" creada exitosamente');
        
        return res.json({
          categorias: resultRetry.rows
        });
      } catch (createError) {
        console.error('Error creando tabla categorias:', createError);
        return res.status(500).json({
          error: 'Error al crear tabla de categorías',
          code: 'INTERNAL_ERROR'
        });
      }
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;