const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Función para calcular gasto mensual de un anuncio (modelo híbrido)
const calcularGastoMensual = async (anuncioId) => {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    // Obtener configuración del modelo de facturación del anuncio
    const adConfig = await query(
      'SELECT modelo_facturacion, costo_por_mil, costo_por_click FROM anuncios WHERE id = $1',
      [anuncioId]
    );
    
    if (adConfig.rows.length === 0) return 0;
    
    const modelo = adConfig.rows[0].modelo_facturacion || 'HYBRID';
    const costoPorMil = parseFloat(adConfig.rows[0].costo_por_mil || 2.00);
    const costoPorClick = parseFloat(adConfig.rows[0].costo_por_click || 0.50);
    
    // Obtener impresiones y clicks del mes
    const [impressionsRes, clicksRes] = await Promise.all([
      query('SELECT COUNT(*) as total FROM ad_impressions WHERE anuncio_id = $1 AND created_at >= $2', [anuncioId, inicioMes]),
      query('SELECT COUNT(*) as total FROM ad_clicks WHERE anuncio_id = $1 AND created_at >= $2', [anuncioId, inicioMes])
    ]);
    
    const impresiones = parseInt(impressionsRes.rows[0]?.total || '0', 10);
    const clicks = parseInt(clicksRes.rows[0]?.total || '0', 10);
    
    // Calcular gasto según el modelo
    let gasto = 0;
    if (modelo === 'CPM') {
      // Solo impresiones: (impresiones / 1000) * costo_por_mil
      gasto = (impresiones / 1000) * costoPorMil;
    } else if (modelo === 'CPC') {
      // Solo clicks: clicks * costo_por_click
      gasto = clicks * costoPorClick;
    } else {
      // HYBRID: ambos (impresiones + clicks)
      gasto = ((impresiones / 1000) * costoPorMil) + (clicks * costoPorClick);
    }
    
    return Math.max(0, gasto); // Asegurar que no sea negativo
  } catch (e) {
    console.error('Error calculando gasto mensual:', e);
    return 0;
  }
};

// Función para verificar si un anuncio tiene crédito y presupuesto disponible
const verificarPresupuesto = async (anuncioId) => {
  try {
    // Obtener información del anuncio y su anunciante
    const adResult = await query(
      `SELECT a.presupuesto_mensual, a.anunciante_id, a.modelo_facturacion, 
              a.costo_por_mil, a.costo_por_click,
              an.credito_actual
       FROM anuncios a
       JOIN anunciantes an ON a.anunciante_id = an.id
       WHERE a.id = $1`,
      [anuncioId]
    );
    
    if (adResult.rows.length === 0) return false;
    
    const ad = adResult.rows[0];
    const presupuesto = parseFloat(ad.presupuesto_mensual || 0);
    const creditoActual = parseFloat(ad.credito_actual || 0);
    
    // Verificar crédito disponible
    if (creditoActual <= 0) {
      // Sin crédito = desactivar anuncio
      await query('UPDATE anuncios SET activo = false WHERE id = $1', [anuncioId]);
      console.log(`⚠️ Anuncio ${anuncioId} desactivado por falta de crédito. Crédito: $${creditoActual.toFixed(2)}`);
      return false;
    }
    
    // Verificar límite de presupuesto mensual
    if (presupuesto > 0) {
      const gastoActual = await calcularGastoMensual(anuncioId);
      
      // Si el gasto alcanzó o superó el presupuesto, desactivar anuncio
      if (gastoActual >= presupuesto) {
        await query('UPDATE anuncios SET activo = false WHERE id = $1', [anuncioId]);
        console.log(`⚠️ Anuncio ${anuncioId} desactivado automáticamente por haber alcanzado el límite de presupuesto mensual. Gasto: $${gastoActual.toFixed(2)} / Presupuesto: $${presupuesto.toFixed(2)}`);
        return false;
      }
      
      // Verificar si está cerca del límite (80% o más) para alertar
      const porcentajeUsado = (gastoActual / presupuesto) * 100;
      if (porcentajeUsado >= 80 && porcentajeUsado < 100) {
        console.log(`⚠️ Anuncio ${anuncioId} está cerca del límite: ${porcentajeUsado.toFixed(1)}% usado ($${gastoActual.toFixed(2)} / $${presupuesto.toFixed(2)})`);
      }
      
      // Verificar que el crédito sea suficiente para al menos una impresión más
      const modelo = ad.modelo_facturacion || 'HYBRID';
      const costoPorMil = parseFloat(ad.costo_por_mil || 2.00);
      const costoPorClick = parseFloat(ad.costo_por_click || 0.50);
      
      // Costo mínimo (una impresión o un click)
      const costoMinimo = modelo === 'CPC' ? costoPorClick : 
                         modelo === 'CPM' ? (costoPorMil / 1000) :
                         Math.min(costoPorMil / 1000, costoPorClick);
      
      if (creditoActual < costoMinimo) {
        await query('UPDATE anuncios SET activo = false WHERE id = $1', [anuncioId]);
        console.log(`⚠️ Anuncio ${anuncioId} desactivado por crédito insuficiente. Crédito: $${creditoActual.toFixed(2)} / Mínimo: $${costoMinimo.toFixed(4)}`);
        return false;
      }
    }
    
    return true;
  } catch (e) {
    console.error('Error verificando presupuesto:', e);
    return true; // En caso de error, permitir impresión
  }
};

// Función para descontar crédito cuando se registra una impresión o click
const descontarCredito = async (anuncioId, tipo = 'impression') => {
  try {
    // Obtener configuración del anuncio
    const adResult = await query(
      `SELECT a.modelo_facturacion, a.costo_por_mil, a.costo_por_click, a.anunciante_id
       FROM anuncios a
       WHERE a.id = $1`,
      [anuncioId]
    );
    
    if (adResult.rows.length === 0) return false;
    
    const ad = adResult.rows[0];
    const modelo = ad.modelo_facturacion || 'HYBRID';
    const costoPorMil = parseFloat(ad.costo_por_mil || 2.00);
    const costoPorClick = parseFloat(ad.costo_por_click || 0.50);
    
    let costoDescontar = 0;
    
    if (tipo === 'click') {
      // Descontar por click (si el modelo incluye CPC)
      if (modelo === 'CPC' || modelo === 'HYBRID') {
        costoDescontar = costoPorClick;
      }
    } else {
      // Descontar por impresión (si el modelo incluye CPM)
      if (modelo === 'CPM' || modelo === 'HYBRID') {
        costoDescontar = costoPorMil / 1000; // Costo por impresión
      }
    }
    
    if (costoDescontar > 0) {
      // Descontar del crédito del anunciante
      await query(
        `UPDATE anunciantes 
         SET credito_actual = credito_actual - $1
         WHERE id = $2 AND credito_actual >= $1`,
        [costoDescontar, ad.anunciante_id]
      );
      
      // Registrar transacción de gasto
      await query(
        `INSERT INTO advertiser_credit_transactions (anunciante_id, monto, tipo, descripcion, anuncio_id)
         VALUES ($1, $2, 'gasto', $3, $4)`,
        [
          ad.anunciante_id,
          -costoDescontar,
          `Gasto por ${tipo === 'click' ? 'click' : 'impresión'} - Anuncio ${anuncioId}`,
          anuncioId
        ]
      );
    }
    
    return true;
  } catch (e) {
    console.error('Error descontando crédito:', e);
    return false;
  }
};

// GET /api/ads/placements?placement=portal_top|landing_inline
router.get('/placements', async (req, res) => {
  try {
    const placement = req.query.placement;
    if (!placement) return res.status(400).json({ error: 'placement requerido' });

    const now = new Date().toISOString().slice(0, 10);
    
    // Primero obtener anuncios candidatos
    // Buscar en el array JSONB de ubicaciones (soporta arrays y strings antiguos)
    const candidatesResult = await query(
      `SELECT id, titulo, descripcion_corta, url_destino, imagen_url, categoria, presupuesto_mensual
       FROM anuncios
       WHERE (
         ubicacion_display @> $1::jsonb
         OR ubicacion_display = $1::jsonb
         OR ubicacion_display::text = $2
       )
         AND activo = true AND aprobado = true
         AND (fecha_inicio IS NULL OR fecha_inicio <= $3)
         AND (fecha_fin IS NULL OR fecha_fin >= $3)
       ORDER BY RANDOM()
       LIMIT 10`,
      [JSON.stringify([placement]), placement, now]
    );

    // Filtrar anuncios que aún tienen presupuesto disponible
    const adsConPresupuesto = [];
    for (const ad of candidatesResult.rows) {
      const tienePresupuesto = await verificarPresupuesto(ad.id);
      if (tienePresupuesto) {
        // No incluir presupuesto_mensual en la respuesta pública
        const { presupuesto_mensual, ...adPublico } = ad;
        adsConPresupuesto.push(adPublico);
        if (adsConPresupuesto.length >= 5) break;
      }
    }

    res.json({ ads: adsConPresupuesto });
  } catch (e) {
    console.error('Error obteniendo anuncios:', e);
    res.status(500).json({ error: 'Error obteniendo anuncios' });
  }
});

// POST /api/ads/:id/impression
router.post('/:id/impression', async (req, res) => {
  try {
    const adId = req.params.id;
    const path = req.body?.path || '';
    
    // Verificar presupuesto antes de registrar impresión
    const tienePresupuesto = await verificarPresupuesto(adId);
    if (!tienePresupuesto) {
      return res.status(403).json({ 
        success: false, 
        error: 'Presupuesto agotado',
        message: 'Este anuncio ha alcanzado su presupuesto mensual' 
      });
    }
    
    // Registrar impresión
    await query(
      'INSERT INTO ad_impressions (anuncio_id, path, ip, user_agent) VALUES ($1,$2,$3,$4)',
      [adId, path, req.ip, req.headers['user-agent'] || '']
    );
    
    // Descontar crédito por impresión
    await descontarCredito(adId, 'impression');
    
    // Verificar nuevamente después de registrar (puede haber alcanzado el límite justo ahora)
    await verificarPresupuesto(adId);
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error registrando impresión:', e);
    res.status(500).json({ error: 'Error registrando impresión' });
  }
});

// Función para extraer IP real de formato IPv6 mapped IPv4
const extractRealIP = (ip) => {
  if (!ip) return null;
  
  // Si es formato IPv6 mapped IPv4 (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7); // Extraer la parte IPv4
  }
  
  // Si es formato IPv6 con IPv4 embedded
  if (ip.includes('::ffff:')) {
    const parts = ip.split('::ffff:');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
  }
  
  return ip;
};

// Función para verificar si una IP es local/privada
const isPrivateIP = (ip) => {
  if (!ip) return true;
  
  // IPs locales
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  
  // Rangos privados IPv4
  if (ip.startsWith('192.168.') || 
      ip.startsWith('10.') || 
      ip.startsWith('172.16.') || 
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')) return true;
  
  // Link-local
  if (ip.startsWith('169.254.')) return true;
  
  return false;
};

// Función para obtener ubicación por IP
const getLocationFromIP = async (ip) => {
  // Extraer IP real si está en formato IPv6 mapped
  const realIP = extractRealIP(ip);
  
  // Ignorar IPs locales/privadas
  if (isPrivateIP(realIP)) {
    return { ciudad: null, estado: null, pais: null, pais_codigo: null };
  }

  try {
    // Usar ip-api.com (gratis, sin API key para uso básico, límite 45 req/min)
    const response = await fetch(`http://ip-api.com/json/${realIP}?fields=status,message,country,countryCode,regionName,city&lang=es`, {
      timeout: 3000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        ciudad: data.city || null,
        estado: data.regionName || null,
        pais: data.country || null,
        pais_codigo: data.countryCode || null
      };
    }
  } catch (e) {
    console.error('Error obteniendo ubicación por IP:', e.message);
  }
  
  return { ciudad: null, estado: null, pais: null, pais_codigo: null };
};

// POST /api/ads/:id/click
router.post('/:id/click', async (req, res) => {
  try {
    const adId = req.params.id;
    const path = req.body?.path || '';
    const ip = req.ip;
    
    // Obtener ubicación por IP (asíncrono, no bloquea la respuesta)
    const location = await getLocationFromIP(ip);
    
    await query(
      'INSERT INTO ad_clicks (anuncio_id, path, ip, user_agent, ciudad, estado, pais, pais_codigo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        adId, 
        path, 
        ip, 
        req.headers['user-agent'] || '',
        location.ciudad,
        location.estado,
        location.pais,
        location.pais_codigo
      ]
    );
    
    // Descontar crédito por click
    await descontarCredito(adId, 'click');
    
    // Verificar nuevamente después de registrar click
    await verificarPresupuesto(adId);
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error registrando click:', e);
    res.status(500).json({ error: 'Error registrando click' });
  }
});

module.exports = router;
