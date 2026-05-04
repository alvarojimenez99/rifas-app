const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');
const {
  stripe,
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  calculateCommission,
  createPaymentIntent,
  createOXXOPaymentIntent,
  createCreditPaymentIntent,
  getAccountStatus,
  saveTransaction
} = require('../services/stripe');

const { notifyPaymentConfirmed } = require('../services/notifications');

// POST /api/stripe/connect/create-account
router.post('/connect/create-account', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    const existing = await query(
      'SELECT * FROM stripe_connect_accounts WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length > 0) {
      const account = existing.rows[0];
      
      try {
        const accountStatus = await getAccountStatus(account.stripe_account_id);
        
        await query(`
          UPDATE stripe_connect_accounts
          SET 
            charges_enabled = $1,
            payouts_enabled = $2,
            details_submitted = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_account_id = $4
        `, [
          accountStatus.chargesEnabled,
          accountStatus.payoutsEnabled,
          accountStatus.detailsSubmitted,
          account.stripe_account_id
        ]);
        
        if (accountStatus.chargesEnabled && accountStatus.payoutsEnabled) {
          return res.json({
            connected: true,
            accountId: account.stripe_account_id,
            message: 'Cuenta Stripe ya está conectada y lista para recibir pagos'
          });
        }
      } catch (error) {
        console.error('Error verificando cuenta:', error.message);
      }
      
      const accountLink = await createAccountLink(
        account.stripe_account_id,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=success`,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=refresh`
      );
      
      return res.json({
        connected: false,
        onboardingUrl: accountLink.url,
        message: 'Completa la configuración de tu cuenta Stripe'
      });
    }
    
    const account = await createConnectAccount(userId, userEmail, 'MX');
    
    await query(`
      INSERT INTO stripe_connect_accounts 
      (user_id, stripe_account_id, account_type, email, country)
      VALUES ($1, $2, 'express', $3, 'MX')
    `, [userId, account.id, userEmail]);
    
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=success`,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=refresh`
    );
    
    res.json({
      connected: false,
      onboardingUrl: accountLink.url,
      accountId: account.id,
      message: 'Redirigiendo a Stripe para completar configuración'
    });
    
  } catch (error) {
    console.error('Error creando cuenta Stripe:', error.message);
    res.status(500).json({ 
      error: 'Error al crear cuenta Stripe',
      message: error.message 
    });
  }
});

// GET /api/stripe/connect/status/:userId
router.get('/connect/status/:userId', optionalAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    
    const result = await query(`
      SELECT 
        stripe_account_id,
        charges_enabled,
        payouts_enabled,
        details_submitted
      FROM stripe_connect_accounts
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        connected: false,
        available: false
      });
    }
    
    const account = result.rows[0];
    
    try {
      const accountStatus = await getAccountStatus(account.stripe_account_id);
      
      await query(`
        UPDATE stripe_connect_accounts
        SET 
          charges_enabled = $1,
          payouts_enabled = $2,
          details_submitted = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_account_id = $4
      `, [
        accountStatus.chargesEnabled,
        accountStatus.payoutsEnabled,
        accountStatus.detailsSubmitted,
        account.stripe_account_id
      ]);
      
      res.json({
        connected: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
        available: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
        chargesEnabled: accountStatus.chargesEnabled,
        payoutsEnabled: accountStatus.payoutsEnabled
      });
    } catch (error) {
      console.error('Error verificando estado:', error.message);
      res.json({
        connected: account.charges_enabled && account.payouts_enabled,
        available: account.charges_enabled && account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stripe/connect/status
router.get('/connect/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT 
        stripe_account_id,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        email,
        country
      FROM stripe_connect_accounts
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        connected: false,
        message: 'No tienes cuenta Stripe conectada'
      });
    }
    
    const account = result.rows[0];
    
    try {
      const accountStatus = await getAccountStatus(account.stripe_account_id);
      
      await query(`
        UPDATE stripe_connect_accounts
        SET 
          charges_enabled = $1,
          payouts_enabled = $2,
          details_submitted = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_account_id = $4
      `, [
        accountStatus.chargesEnabled,
        accountStatus.payoutsEnabled,
        accountStatus.detailsSubmitted,
        account.stripe_account_id
      ]);
      
      res.json({
        connected: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
        chargesEnabled: accountStatus.chargesEnabled,
        payoutsEnabled: accountStatus.payoutsEnabled,
        detailsSubmitted: accountStatus.detailsSubmitted,
        accountId: account.stripe_account_id,
        email: accountStatus.email,
        country: accountStatus.country
      });
    } catch (error) {
      console.error('Error verificando estado:', error.message);
      res.json({
        connected: account.charges_enabled && account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        accountId: account.stripe_account_id,
        email: account.email,
        country: account.country
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stripe/connect/login-link
router.get('/connect/login-link', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT stripe_account_id
      FROM stripe_connect_accounts
      WHERE user_id = $1 AND charges_enabled = true
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No tienes cuenta Stripe conectada o no está habilitada'
      });
    }
    
    const loginLink = await createLoginLink(result.rows[0].stripe_account_id);
    
    res.json({
      url: loginLink.url
    });
    
  } catch (error) {
    console.error('Error creando login link:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/payment-intent
router.post('/payment-intent', optionalAuth, async (req, res) => {
  try {
    const { rifaId, amount, currency = 'mxn', numerosSeleccionados, paymentMethod = 'card', participanteId: participanteIdFromBody } = req.body;
    const participanteId = participanteIdFromBody || req.user?.id || null;
    
    if (!rifaId || !amount) {
      return res.status(400).json({ error: 'rifaId y amount son requeridos' });
    }
    
    const rifaResult = await query(`
      SELECT usuario_id, precio, nombre
      FROM rifas
      WHERE id = $1
    `, [rifaId]);
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    const creadorId = rifaResult.rows[0].usuario_id;
    const precioRifa = parseFloat(rifaResult.rows[0].precio);
    const rifaNombre = rifaResult.rows[0].nombre;
    
    const cantidadNumeros = numerosSeleccionados?.length || 1;
    const totalAmount = precioRifa * cantidadNumeros;
    
    const stripeAccountResult = await query(`
      SELECT stripe_account_id, charges_enabled, payouts_enabled
      FROM stripe_connect_accounts
      WHERE user_id = $1
    `, [creadorId]);
    
    const hasStripeConnect = stripeAccountResult.rows.length > 0 && 
                            stripeAccountResult.rows[0].charges_enabled && 
                            stripeAccountResult.rows[0].payouts_enabled;
    
    let paymentIntentResult;
    if (paymentMethod === 'oxxo') {
      paymentIntentResult = await createOXXOPaymentIntent(
        totalAmount,
        currency,
        creadorId,
        rifaId,
        {
          participante_id: participanteId?.toString() || 'guest',
          numeros: numerosSeleccionados?.join(',') || '',
          rifa_nombre: rifaNombre
        }
      );
    } else {
      paymentIntentResult = await createPaymentIntent(
        totalAmount,
        currency,
        creadorId,
        rifaId,
        {
          participante_id: participanteId?.toString() || 'guest',
          numeros: numerosSeleccionados?.join(',') || '',
          rifa_nombre: rifaNombre
        }
      );
    }
    
    const { paymentIntent, commission, commissionPct, amountToCreator } = paymentIntentResult;
    
    try {
      await saveTransaction({
        rifaId,
        participanteId,
        creadorId,
        paymentIntentId: paymentIntent.id,
        accountId: 'sorteohub_main',
        amount: totalAmount,
        currency: currency.toUpperCase(),
        commissionAmount: commission,
        commissionPct,
        amountToCreator,
        status: 'pending',
        metadata: {
          numeros: numerosSeleccionados,
          rifa_nombre: rifaNombre
        }
      });
    } catch (error) {
      console.error('Error guardando transacción:', error.message);
    }
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      commission: commission,
      commissionPct: commissionPct,
      amountToCreator: amountToCreator,
      currency: currency.toUpperCase(),
      paymentMethod: paymentMethod
    });
    
  } catch (error) {
    console.error('Error creando Payment Intent:', error.message);
    res.status(500).json({ 
      error: 'Error al crear intención de pago',
      message: error.message 
    });
  }
});

// POST /api/stripe/credit-payment-intent
router.post('/credit-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'mxn' } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido. Debe ser mayor a $0' });
    }
    
    const MIN_AMOUNT = 10.00;
    const amountNum = parseFloat(amount);
    if (amountNum < MIN_AMOUNT) {
      return res.status(400).json({ 
        error: `El monto mínimo para cargar créditos es $${MIN_AMOUNT.toFixed(2)} MXN`,
        minAmount: MIN_AMOUNT
      });
    }
    
    let advertiserId;
    try {
      const authHeader = req.headers.authorization;
      const authToken = authHeader && authHeader.split(' ')[1];
      if (!authToken) {
        return res.status(401).json({ error: 'Token requerido' });
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      if (!decoded.advertiserId) {
        return res.status(403).json({ error: 'Este endpoint es solo para anunciantes' });
      }
      advertiserId = decoded.advertiserId;
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    const result = await createCreditPaymentIntent(amountNum, currency, advertiserId, {
      descripcion: `Carga de crédito desde dashboard`
    });
    
    res.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: result.amount,
      currency: result.currency.toUpperCase()
    });
    
  } catch (error) {
    console.error('Error creando Payment Intent para créditos:', error.message);
    res.status(500).json({ 
      error: 'Error al crear intención de pago',
      message: error.message 
    });
  }
});

// POST /api/stripe/confirm-payment
router.post('/confirm-payment', optionalAuth, async (req, res) => {
  try {
    const { paymentIntentId, participanteId, rifaId } = req.body;
    
    if (!paymentIntentId || !participanteId || !rifaId) {
      return res.status(400).json({ 
        error: 'paymentIntentId, participanteId y rifaId son requeridos' 
      });
    }
    
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError) {
      console.error('Error recuperando Payment Intent:', stripeError.message);
      return res.status(400).json({ error: 'Payment Intent no encontrado' });
    }
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `El pago no está completado. Estado: ${paymentIntent.status}` 
      });
    }
    
    const participanteResult = await query(
      'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2 AND estado = $3',
      [participanteId, rifaId, 'pendiente']
    );
    
    if (participanteResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Participante no encontrado o ya procesado' 
      });
    }
    
    const participante = participanteResult.rows[0];
    const numerosArray = participante.numeros_seleccionados || [];
    
    const rifaResult = await query(
      'SELECT usuario_id, precio, nombre FROM rifas WHERE id = $1',
      [rifaId]
    );
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    const rifa = rifaResult.rows[0];
    const total = (parseFloat(rifa.precio) * numerosArray.length).toFixed(2);
    
    const { getClient } = require('../config/database');
    const client = await getClient();
    await client.query('BEGIN');
    
    try {
      await client.query(`
        UPDATE participantes 
        SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [participanteId]);
      
      const elementosReservados = await client.query(`
        SELECT elemento FROM elementos_reservados 
        WHERE participante_id = $1 AND rifa_id = $2 AND activo = true
      `, [participanteId, rifaId]);
      
      for (const row of elementosReservados.rows) {
        await client.query(`
          INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (rifa_id, elemento) DO NOTHING
        `, [rifaId, participanteId, row.elemento]);
      }
      
      await client.query(`
        UPDATE elementos_reservados 
        SET activo = false 
        WHERE participante_id = $1 AND rifa_id = $2
      `, [participanteId, rifaId]);
      
      await client.query('COMMIT');
      
      try {
        const emailService = require('../config/email');
        await emailService.sendPaymentValidated(
          {
            nombre: participante.nombre,
            email: participante.email,
            numerosSeleccionados: numerosArray,
            totalPagado: total
          },
          {
            id: rifaId,
            nombre: rifa.nombre
          }
        );
      } catch (emailError) {
        console.error('Error enviando email:', emailError.message);
      }
      
      const io = req.app.get('io');
      
      try {
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
        console.error('Error enviando notificación:', notifError.message);
      }
      
      res.json({
        success: true,
        message: 'Pago confirmado y procesado exitosamente',
        data: {
          participanteId,
          rifaId,
          total,
          numeros: numerosArray
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error procesando pago:', error.message);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error confirmando pago:', error.message);
    res.status(500).json({ 
      error: 'Error procesando confirmación de pago',
      message: error.message 
    });
  }
});

// POST /api/stripe/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET no configurado, ignorando webhook');
    return res.status(400).send('Webhook secret no configurado');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log('Webhook recibido:', { type: event.type, id: event.id });
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const io = req.app.get('io');
        await handlePaymentSuccess(event.data.object, io);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'account.updated':
        await handleAccountUpdate(event.data.object);
        break;
        
      default:
        console.log('Evento no manejado:', event.type);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error.message);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Funciones helper para webhooks
async function handlePaymentSuccess(paymentIntent, io = null) {
  try {
    const { rifa_id, participante_id, numeros, creador_id, tipo, advertiser_id } = paymentIntent.metadata;
    
    console.log('Pago exitoso:', { 
      paymentIntentId: paymentIntent.id,
      rifaId: rifa_id,
      participanteId: participante_id,
      tipo: tipo
    });
    
    if (tipo === 'credit_load' && advertiser_id) {
      const amount = paymentIntent.amount / 100;
      const advertiserId = parseInt(advertiser_id);
      
      const result = await query(
        `UPDATE anunciantes 
         SET credito_actual = credito_actual + $1,
             credito_total_acumulado = credito_total_acumulado + $1
         WHERE id = $2
         RETURNING credito_actual, credito_total_acumulado`,
        [amount, advertiserId]
      );
      
      if (result.rows.length === 0) {
        console.error('Anunciante no encontrado:', advertiserId);
        return;
      }
      
      await query(
        `INSERT INTO advertiser_credit_transactions (anunciante_id, monto, tipo, descripcion, referencia_pago)
         VALUES ($1, $2, 'carga', $3, $4)`,
        [advertiserId, amount, `Carga de crédito vía Stripe`, paymentIntent.id]
      );
      
      console.log('Crédito cargado exitosamente:', { advertiserId, amount });
      return;
    }
    
    const rifaId = rifa_id;
    const participanteId = participante_id;
    
    await query(`
      UPDATE stripe_transactions
      SET 
        status = 'succeeded',
        stripe_fee = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = $2
    `, [
      paymentIntent.charges?.data[0]?.balance_transaction?.fee / 100 || null,
      paymentIntent.id
    ]);
    
    if (participanteId && participanteId !== 'guest' && rifaId) {
      const numerosArray = numeros ? numeros.split(',').map(n => n.trim()) : [];
      
      let participanteResult = await query(
        'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2 AND estado = $3',
        [participanteId, rifaId, 'pendiente']
      );
      
      if (participanteResult.rows.length === 0) {
        const yaProcesado = await query(
          'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2 AND estado = $3',
          [participanteId, rifaId, 'confirmado']
        );
        
        if (yaProcesado.rows.length > 0) {
          console.log('Participante ya procesado, webhook ignorado');
          return;
        }
      }
      
      const rifaResult = await query(
        'SELECT usuario_id, precio, nombre FROM rifas WHERE id = $1',
        [rifaId]
      );
      
      if (participanteResult.rows.length > 0 && rifaResult.rows.length > 0) {
        const participante = participanteResult.rows[0];
        const rifa = rifaResult.rows[0];
        const total = (parseFloat(rifa.precio) * numerosArray.length).toFixed(2);
        
        const { getClient } = require('../config/database');
        const client = await getClient();
        await client.query('BEGIN');
        
        try {
          await client.query(`
            UPDATE participantes 
            SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [participanteId]);
          
          const elementosReservados = await client.query(`
            SELECT elemento FROM elementos_reservados 
            WHERE participante_id = $1 AND rifa_id = $2 AND activo = true
          `, [participanteId, rifaId]);
          
          for (const row of elementosReservados.rows) {
            await client.query(`
              INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
              VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
              ON CONFLICT (rifa_id, elemento) DO NOTHING
            `, [rifaId, participanteId, row.elemento]);
          }
          
          await client.query(`
            UPDATE elementos_reservados 
            SET activo = false 
            WHERE participante_id = $1 AND rifa_id = $2
          `, [participanteId, rifaId]);
          
          await client.query('COMMIT');
          
          try {
            const emailService = require('../config/email');
            await emailService.sendPaymentValidated(
              {
                nombre: participante.nombre,
                email: participante.email,
                numerosSeleccionados: numerosArray,
                totalPagado: total
              },
              {
                id: rifaId,
                nombre: rifa.nombre
              }
            );
          } catch (emailError) {
            console.error('Error enviando email:', emailError.message);
          }
          
          try {
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
            console.error('Error enviando notificación:', notifError.message);
          }
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Error auto-registrando participación:', error.message);
          throw error;
        } finally {
          client.release();
        }
      }
    }
    
  } catch (error) {
    console.error('Error en handlePaymentSuccess:', error.message);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    console.warn('Pago fallido:', { paymentIntentId: paymentIntent.id });
    
    await query(`
      UPDATE stripe_transactions
      SET 
        status = 'failed',
        updated_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = $1
    `, [paymentIntent.id]);
    
  } catch (error) {
    console.error('Error en handlePaymentFailed:', error.message);
  }
}

async function handleAccountUpdate(account) {
  try {
    console.log('Cuenta Stripe actualizada:', { accountId: account.id });
    
    await query(`
      UPDATE stripe_connect_accounts
      SET 
        charges_enabled = $1,
        payouts_enabled = $2,
        details_submitted = $3,
        email = $4,
        country = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE stripe_account_id = $6
    `, [
      account.charges_enabled,
      account.payouts_enabled,
      account.details_submitted,
      account.email,
      account.country,
      account.id
    ]);
    
  } catch (error) {
    console.error('Error en handleAccountUpdate:', error.message);
  }
}

// GET /api/stripe/transactions
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(`
      SELECT 
        st.*,
        r.nombre as rifa_nombre,
        u.nombre as participante_nombre
      FROM stripe_transactions st
      LEFT JOIN rifas r ON st.rifa_id = r.id
      LEFT JOIN usuarios u ON st.participante_id = u.id
      WHERE st.creador_id = $1
      ORDER BY st.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);
    
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM stripe_transactions
      WHERE creador_id = $1
    `, [userId]);
    
    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error obteniendo transacciones:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/simulate-payment
router.post('/simulate-payment', authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Este endpoint solo está disponible en desarrollo'
      });
    }

    const { rifa_id, participante_id, numeros, monto } = req.body;

    if (!rifa_id || !participante_id) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: rifa_id y participante_id son obligatorios'
      });
    }

    const io = req.app.get('io');

    const participanteResult = await query(
      'SELECT * FROM participantes WHERE id = $1',
      [participante_id]
    );

    const rifaResult = await query(
      'SELECT usuario_id, precio, nombre FROM rifas WHERE id = $1',
      [rifa_id]
    );

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Participante no encontrado'
      });
    }

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rifa no encontrada'
      });
    }

    const participante = participanteResult.rows[0];
    const rifa = rifaResult.rows[0];
    
    const numerosArray = numeros ? (Array.isArray(numeros) ? numeros : numeros.split(',').map(n => n.trim())) : participante.numeros_seleccionados || [];
    const total = monto || (parseFloat(rifa.precio) * numerosArray.length).toFixed(2);

    console.log('Simulando pago confirmado:', { rifa_id, participante_id, total });

    await query(`
      UPDATE participantes 
      SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [participante_id]);

    await query(`
      DELETE FROM elementos_reservados 
      WHERE rifa_id = $1 AND participante_id = $2
    `, [rifa_id, participante_id]);

    for (const elemento of numerosArray) {
      await query(`
        INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (rifa_id, elemento) DO NOTHING
      `, [rifa_id, participante_id, elemento]);
    }

    await query(`
      INSERT INTO stripe_transactions (
        rifa_id, participante_id, stripe_payment_intent_id, 
        monto, status, tipo, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      rifa_id,
      participante_id,
      `simulated_${Date.now()}`,
      total,
      'succeeded',
      'raffle_payment'
    ]);

    await notifyPaymentConfirmed(
      participante_id,
      rifa_id,
      {
        usuario_id: null,
        total: total
      },
      rifa.usuario_id,
      io
    );

    res.json({
      success: true,
      message: 'Pago simulado exitosamente',
      data: {
        rifa_id,
        participante_id,
        total,
        numeros: numerosArray,
        rifa_nombre: rifa.nombre,
        participante_nombre: participante.nombre
      }
    });

  } catch (error) {
    console.error('Error simulando pago:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error simulando pago',
      message: error.message
    });
  }
});

module.exports = router;