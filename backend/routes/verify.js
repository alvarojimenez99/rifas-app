const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/verify/:token - Verificar email
// GET /api/verify/:token - Verificar email
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verificar si la solicitud espera JSON o HTML
    const acceptsJson = req.headers.accept?.includes('application/json');

    const result = await query(
      `SELECT id, email, nombre FROM usuarios 
       WHERE token_verificacion = $1 
       AND token_verificacion_expira > CURRENT_TIMESTAMP
       AND email_verificado = false`,
      [token]
    );

    if (result.rows.length === 0) {
      if (acceptsJson) {
        return res.status(400).json({
          success: false,
          error: 'Link inválido ou expirado'
        });
      }
      return res.status(400).send(/* HTML de error */);
    }

    const user = result.rows[0];

    await query(
      `UPDATE usuarios 
       SET email_verificado = true, 
           token_verificacion = NULL,
           token_verificacion_expira = NULL
       WHERE id = $1`,
      [user.id]
    );

    if (acceptsJson) {
      return res.json({
        success: true,
        message: 'Email verificado com sucesso'
      });
    }

    res.send(/* HTML de éxito */);

  } catch (error) {
    console.error('Error verificando email:', error);
    if (req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, error: 'Erro interno' });
    } else {
      res.status(500).send(/* HTML de error */);
    }
  }
});

module.exports = router;