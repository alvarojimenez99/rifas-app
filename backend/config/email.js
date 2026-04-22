// ============================================
// CONFIGURACIÓN DE EMAIL - MODO DESARROLLO
// Para producción, configura RESEND_API_KEY en config.env
// ============================================

// Verificar si Resend está configurado
const isResendConfigured = () => {
  return !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '';
};

// Inicializar Resend solo si hay API key
let resend = null;
let FROM_EMAIL = process.env.FROM_EMAIL || 'SorteoHub <noreply@sorteohub.com>';

if (isResendConfigured()) {
  try {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend configurado para enviar emails');
  } catch (error) {
    console.warn('⚠️ No se pudo inicializar Resend:', error.message);
  }
} else {
  console.log('📧 Modo desarrollo: Los emails se mostrarán en consola (no se enviarán realmente)');
}

// Emails autorizados para desarrollo
const AUTHORIZED_EMAILS = ['tiendaap25@gmail.com'];

// Función para validar email en desarrollo
const validateEmailForDevelopment = (email) => {
  if (process.env.NODE_ENV === 'development' && !isResendConfigured()) {
    return AUTHORIZED_EMAILS.includes(email);
  }
  return true;
};

// Función mock para desarrollo (no envía emails reales)
const mockSendEmail = (to, subject, html) => {
  console.log('\n📧 [MODO DESARROLLO] Email simulado:');
  console.log('   To:', to);
  console.log('   Subject:', subject);
  console.log('   Content preview:', html?.substring(0, 150) + '...');
  console.log('   (No se envió realmente - configura RESEND_API_KEY para enviar emails reales)\n');
  return { success: true, mock: true, messageId: `mock_${Date.now()}` };
};

// ============================================
// TEMPLATES DE EMAIL COMPLETOS
// ============================================

const emailTemplates = {
  // Confirmación de participación
  participationConfirmation: (participantData, rifaData) => ({
    subject: `🎫 Confirmación de participación - ${rifaData.nombre}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Confirmación</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #1e22aa;">🎫 Confirmación de Participación</h1>
        <p>Hola <strong>${participantData.nombre}</strong>,</p>
        <p>Tu participación en la rifa <strong>"${rifaData.nombre}"</strong> ha sido confirmada exitosamente.</p>
        <p>Números seleccionados: <strong>${participantData.numerosSeleccionados?.join(', ') || 'N/A'}</strong></p>
        <p>Total pagado: <strong>$${participantData.totalPagado || '0'}</strong></p>
        <br>
        <p>¡Buena suerte!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  }),

  // Notificación de rifa agotada
  raffleSoldOut: (rifaData) => ({
    subject: `🎉 ¡Felicidades! Tu rifa "${rifaData.nombre}" está agotada`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Rifa Agotada</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #10b981;">🎉 ¡Felicidades!</h1>
        <p>Tu rifa <strong>"${rifaData.nombre}"</strong> está completamente agotada.</p>
        <p>Total recaudado: <strong>$${rifaData.total_recaudado || '0'}</strong></p>
        <br>
        <p>¡Excelente trabajo!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  }),

  // Recordatorio de sorteo
  drawReminder: (rifaData) => ({
    subject: `⏰ Recordatorio: Sorteo de "${rifaData.nombre}" en 1 hora`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Recordatorio</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #f59e0b;">⏰ Recordatorio</h1>
        <p>El sorteo de la rifa <strong>"${rifaData.nombre}"</strong> comienza en <strong>1 hora</strong>.</p>
        <p>Fecha: <strong>${rifaData.fecha_sorteo || 'Por definir'}</strong></p>
        <p>Plataforma: <strong>${rifaData.plataforma_transmision || 'Por definir'}</strong></p>
        <br>
        <p>¡Prepárate para el sorteo!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  }),

  // Email de bienvenida
  welcome: (userData) => ({
    subject: `🎉 ¡Bienvenido a SorteoHub, ${userData.nombre}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Bienvenido</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #1e22aa;">🎉 ¡Bienvenido a SorteoHub!</h1>
        <p>Hola <strong>${userData.nombre}</strong>,</p>
        <p>Gracias por registrarte en SorteoHub, la plataforma profesional para rifas digitales.</p>
        <p>Ya puedes comenzar a crear tus rifas y llegar a miles de participantes.</p>
        <br>
        <p>¡Que tengas éxito con tus rifas!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  }),

  // Email al ganador
  winnerNotification: (participantData, rifaData) => ({
    subject: `🎉 ¡FELICIDADES! Eres el ganador de "${rifaData.nombre}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>¡Eres el Ganador!</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #10b981;">🎉 ¡FELICIDADES!</h1>
        <p>Hola <strong>${participantData.nombre}</strong>,</p>
        <p>¡Has ganado la rifa <strong>"${rifaData.nombre}"</strong>!</p>
        <p>Número ganador: <strong style="font-size: 24px;">${rifaData.numero_ganador || 'N/A'}</strong></p>
        ${rifaData.premio ? `<p>Premio: <strong>${rifaData.premio}</strong></p>` : ''}
        <br>
        <p>En breve el organizador se pondrá en contacto contigo.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  }),

  // Recordatorio de finalización (24h antes)
  endingSoonReminder: (rifaData) => ({
    subject: `⏰ Tu rifa "${rifaData.nombre}" termina en 24 horas`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Últimas horas</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #f59e0b;">⏰ ¡Atención!</h1>
        <p>Tu rifa <strong>"${rifaData.nombre}"</strong> termina en <strong>24 horas</strong>.</p>
        <p>Elementos vendidos: <strong>${rifaData.elementos_vendidos || 0} / ${rifaData.cantidad_elementos || 0}</strong></p>
        <br>
        <p>¡Aprovecha las últimas horas para vender los números restantes!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  }),

  // Email de pago validado (Stripe)
  paymentValidated: (participantData, rifaData) => ({
    subject: `✅ Pago confirmado - ${rifaData.nombre}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Pago Confirmado</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #10b981;">✅ Pago Confirmado</h1>
        <p>Hola <strong>${participantData.nombre}</strong>,</p>
        <p>Tu pago para la rifa <strong>"${rifaData.nombre}"</strong> ha sido confirmado exitosamente.</p>
        <p>Números: <strong>${participantData.numerosSeleccionados?.join(', ') || 'N/A'}</strong></p>
        <p>Total pagado: <strong>$${participantData.totalPagado || '0'}</strong></p>
        <br>
        <p>¡Tu participación está oficialmente registrada!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">SorteoHub - Plataforma de rifas</p>
      </body>
      </html>
    `
  })
};

// ============================================
// SERVICIO DE EMAIL
// ============================================

const emailService = {
  // Enviar confirmación de participación
  async sendParticipationConfirmation(participantData, rifaData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.participationConfirmation(participantData, rifaData);
      return mockSendEmail(participantData.email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.participationConfirmation(participantData, rifaData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [participantData.email],
        subject: template.subject,
        html: template.html,
      });
      console.log('✅ Email de confirmación enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar notificación de rifa agotada
  async sendRaffleSoldOut(rifaData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.raffleSoldOut(rifaData);
      return mockSendEmail(rifaData.creador_email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.raffleSoldOut(rifaData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [rifaData.creador_email],
        subject: template.subject,
        html: template.html,
      });
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar recordatorio de sorteo
  async sendDrawReminder(rifaData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.drawReminder(rifaData);
      return mockSendEmail(rifaData.creador_email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.drawReminder(rifaData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [rifaData.creador_email],
        subject: template.subject,
        html: template.html,
      });
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar email de bienvenida
  async sendWelcomeEmail(userData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.welcome(userData);
      return mockSendEmail(userData.email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.welcome(userData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [userData.email],
        subject: template.subject,
        html: template.html,
      });
      console.log('✅ Email de bienvenida enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar email al ganador
  async sendWinnerNotification(participantData, rifaData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.winnerNotification(participantData, rifaData);
      return mockSendEmail(participantData.email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.winnerNotification(participantData, rifaData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [participantData.email],
        subject: template.subject,
        html: template.html,
      });
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar recordatorio de finalización
  async sendEndingSoonReminder(rifaData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.endingSoonReminder(rifaData);
      return mockSendEmail(rifaData.creador_email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.endingSoonReminder(rifaData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [rifaData.creador_email],
        subject: template.subject,
        html: template.html,
      });
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar email de pago validado
  async sendPaymentValidated(participantData, rifaData) {
    if (!isResendConfigured()) {
      const template = emailTemplates.paymentValidated(participantData, rifaData);
      return mockSendEmail(participantData.email, template.subject, template.html);
    }
    try {
      const template = emailTemplates.paymentValidated(participantData, rifaData);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [participantData.email],
        subject: template.subject,
        html: template.html,
      });
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;