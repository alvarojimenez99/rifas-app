console.log('✅ Cargando módulo de pagos...');
const express = require('express');
const axios = require('axios');
const Stripe = require('stripe');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// =====================================================
// ASaaS - PIX
// =====================================================

// Crear cliente en Asaas
async function criarClienteAsaas(email, nome, telefone) {
  try {
    const response = await axios.post(
      'https://sandbox.asaas.com/api/v3/customers',
      {
        email: email,
        name: nome,
        phone: telefone,
        notificationDisabled: false
      },
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creando cliente Asaas:', error.response?.data || error.message);
    throw error;
  }
}

// POST /api/payments/pix/create - Crear cobro PIX
// POST /api/payments/pix/create - Crear cobro PIX
router.post('/pix/create', authenticateToken, async (req, res) => {
  try {
    console.log('Recibida solicitud PIX:', req.body);
    
    const { rifaId, numerosSeleccionados, total, email, nome, telefone, cpf } = req.body;
    const usuarioId = req.user.id;

    // Validar datos requeridos
    if (!rifaId || !numerosSeleccionados || !total || !email || !nome) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Obtener información de la rifa
    const rifaResult = await query(
      'SELECT nombre FROM rifas WHERE id = $1',
      [rifaId]
    );
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    const rifa = rifaResult.rows[0];

    // Usar CPF proporcionado o uno de prueba
    let cpfCliente = cpf;
    if (!cpfCliente && process.env.NODE_ENV !== 'production') {
      cpfCliente = '59337942011';
      console.log('Usando CPF de prueba:', cpfCliente);
    }

    if (!cpfCliente) {
      return res.status(400).json({ error: 'CPF es requerido para pago PIX' });
    }

    // Crear o obtener cliente Asaas
    let clienteAsaas;
    try {
      clienteAsaas = await criarClienteAsaas(email, nome, telefone, cpfCliente);
    } catch (error) {
      console.error('Error creando cliente Asaas:', error.response?.data || error.message);
      return res.status(400).json({ error: 'Error creando cliente de pago' });
    }

    // Crear cobro PIX
    const response = await axios.post(
      'https://sandbox.asaas.com/api/v3/payments',
      {
        customer: clienteAsaas.id,
        billingType: 'PIX',
        value: total,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Participação na rifa: ${rifa.nombre} - Números: ${numerosSeleccionados.join(', ')}`,
        externalReference: `${rifaId}_${usuarioId}_${Date.now()}`
      },
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const payment = response.data;
    
    console.log('Respuesta Asaas - payment.id:', payment.id);
    
    // IMPORTANTE: Obtener el QR Code por separado
    let qrCode = null;
    let copiaECola = null;
    
    try {
      console.log('Obteniendo QR Code para payment:', payment.id);
      const qrResponse = await axios.get(
        `https://sandbox.asaas.com/api/v3/payments/${payment.id}/pixQrCode`,
        {
          headers: {
            'access_token': process.env.ASAAS_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Respuesta QR Code:', JSON.stringify(qrResponse.data, null, 2));
      
      // El QR Code puede venir en diferentes formatos
      if (qrResponse.data) {
        // Para Asaas, el QR viene como encodedImage (base64)
        if (qrResponse.data.encodedImage) {
          qrCode = qrResponse.data.encodedImage;
          console.log('QR Code obtenido (encodedImage)');
        } 
        // O como qrCode (imagen base64)
        else if (qrResponse.data.qrCode) {
          qrCode = qrResponse.data.qrCode;
          console.log('QR Code obtenido (qrCode)');
        }
        // O como payload (solo texto)
        else if (qrResponse.data.payload) {
          copiaECola = qrResponse.data.payload;
          console.log('Solo payload obtenido');
        }
        
        // El código copia y cola es el payload
        if (qrResponse.data.payload) {
          copiaECola = qrResponse.data.payload;
        }
      }
      
      // Si no encontramos el QR, generamos uno de prueba
      if (!qrCode && !copiaECola) {
        console.log('No se obtuvo QR, generando datos de prueba');
        // Generar un payload PIX de prueba (simulado)
        copiaECola = `00020126360014br.gov.bcb.pix0119${cpfCliente}5204000053039865404${total.toFixed(2)}5802BR5925${nome}6009SAO PAULO62070503***6304E2A9`;
        // Generar un QR simulado (SVG simple)
        qrCode = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="white"/><rect x="40" y="40" width="120" height="120" fill="black"/><rect x="60" y="60" width="20" height="20" fill="white"/><rect x="120" y="60" width="20" height="20" fill="white"/><rect x="60" y="120" width="20" height="20" fill="white"/><rect x="120" y="120" width="20" height="20" fill="white"/></svg>`;
      }
      
    } catch (qrError) {
      console.error('Error obteniendo QR Code:', qrError.response?.data || qrError.message);
      // Generar datos de prueba si falla
      copiaECola = `00020126360014br.gov.bcb.pix0119${cpfCliente}5204000053039865404${total.toFixed(2)}5802BR5925${nome}6009SAO PAULO62070503***6304E2A9`;
      qrCode = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="white"/><text x="100" y="110" text-anchor="middle" font-size="12" fill="black">QR PIX</text></svg>`;
    }

    // Guardar transacción en la base de datos
    await query(
      `INSERT INTO transacoes_pagamento 
       (rifa_id, usuario_id, numeros, total, metodo, status, transacao_id, qr_code, copia_e_cola)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        rifaId, usuarioId, JSON.stringify(numerosSeleccionados), total, 'pix', 
        'pending', payment.id, qrCode || '', copiaECola || ''
      ]
    );

    // Devolver la respuesta
    res.json({
      success: true,
      qrCode: qrCode,
      copiaECola: copiaECola,
      paymentId: payment.id,
      expiresIn: 1800
    });

  } catch (error) {
    console.error('Error creando pago PIX:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al crear pago PIX', 
      details: error.response?.data?.errors?.[0]?.description || error.message 
    });
  }
});

// Modificar la función criarClienteAsaas para incluir CPF
async function criarClienteAsaas(email, nome, telefone, cpf) {
  try {
    const clienteData = {
      email: email,
      name: nome,
      phone: telefone,
      notificationDisabled: false
    };
    
    // Agregar CPF si está disponible
    if (cpf) {
      clienteData.cpfCnpj = cpf;
    }
    
    console.log('Creando cliente Asaas con:', clienteData);
    
    const response = await axios.post(
      'https://sandbox.asaas.com/api/v3/customers',
      clienteData,
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Cliente Asaas creado:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Error creando cliente Asaas:', error.response?.data || error.message);
    throw error;
  }
}
// POST /api/payments/pix/webhook - Webhook para confirmar pagos PIX
router.post('/pix/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    
    if (event.event === 'PAYMENT_CONFIRMED') {
      const paymentId = event.payment.id;
      
      await query(
        `UPDATE transacoes_pagamento 
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE transacao_id = $1`,
        [paymentId]
      );

      const transacao = await query(
        `SELECT * FROM transacoes_pagamento WHERE transacao_id = $1`,
        [paymentId]
      );

      if (transacao.rows.length > 0) {
        const { rifa_id, usuario_id, numeros, total } = transacao.rows[0];
        await registrarParticipacao(rifa_id, usuario_id, JSON.parse(numeros), total);
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error en webhook PIX:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// =====================================================
// STRIPE - Tarjetas de crédito
// =====================================================

router.post('/card/create-intent', authenticateToken, async (req, res) => {
  try {
    const { rifaId, numerosSeleccionados, total, email, nome } = req.body;
    const usuarioId = req.user.id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'brl',
      description: `Participação na rifa ${rifaId}`,
      metadata: {
        rifaId,
        userId: usuarioId,
        numeros: numerosSeleccionados.join(',')
      }
    });

    await query(
      `INSERT INTO transacoes_pagamento 
       (rifa_id, usuario_id, numeros, total, metodo, status, transacao_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        rifaId, usuarioId, JSON.stringify(numerosSeleccionados), total, 
        'card', 'pending', paymentIntent.id
      ]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});

router.post('/card/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Error verificando webhook:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    await query(
      `UPDATE transacoes_pagamento 
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE transacao_id = $1`,
      [paymentIntent.id]
    );

    const transacao = await query(
      `SELECT * FROM transacoes_pagamento WHERE transacao_id = $1`,
      [paymentIntent.id]
    );

    if (transacao.rows.length > 0) {
      const { rifa_id, usuario_id, numeros, total } = transacao.rows[0];
      await registrarParticipacao(rifa_id, usuario_id, JSON.parse(numeros), total);
    }
  }

  res.json({ received: true });
});

async function registrarParticipacao(rifaId, userId, numeros, total) {
  const userResult = await query(
    'SELECT nombre, email, telefono FROM usuarios WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  const participanteResult = await query(
    `INSERT INTO participantes 
     (rifa_id, nombre, email, telefono, numeros_seleccionados, total_pagado, estado, metodo_pago)
     VALUES ($1, $2, $3, $4, $5, $6, 'confirmado', $7)
     RETURNING id`,
    [rifaId, user.nombre, user.email, user.telefono, JSON.stringify(numeros), total, 'pix']
  );

  const participanteId = participanteResult.rows[0].id;

  for (const numero of numeros) {
    await query(
      `INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento)
       VALUES ($1, $2, $3)`,
      [rifaId, participanteId, String(numero)]
    );
  }
}

console.log('✅ Rutas de pagos registradas:', router.stack.map(r => r.route?.path).filter(Boolean));

module.exports = router;