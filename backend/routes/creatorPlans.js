const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/creator-plans
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT id, name, price_usd, max_active_rifas, max_elements_per_rifa, commission_pct, features FROM creator_plans ORDER BY price_usd ASC');
    res.json({ plans: result.rows });
  } catch (e) {
    console.error('Error fetching plans:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/creator-plans/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT ups.*, cp.name, cp.price_usd, cp.max_active_rifas, cp.max_elements_per_rifa, cp.commission_pct
       FROM user_plan_subscriptions ups
       JOIN creator_plans cp ON cp.id = ups.plan_id
       WHERE ups.user_id = $1 AND ups.status = 'active'
       ORDER BY ups.start_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json({ subscription: result.rows[0] || null });
  } catch (e) {
    console.error('Error fetching my plan:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/creator-plans/subscribe  { plan_id }
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'plan_id es requerido' });

    // Cancelar suscripción activa previa
    await query("UPDATE user_plan_subscriptions SET status='canceled', cancel_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND status = 'active'", [req.user.id]);

    // Crear nueva
    const result = await query(
      'INSERT INTO user_plan_subscriptions (user_id, plan_id, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, plan_id, 'active']
    );
    res.json({ message: 'Suscripción activada', subscription: result.rows[0] });
  } catch (e) {
    console.error('Error subscribing:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


