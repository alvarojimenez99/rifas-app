const { Resend } = require('resend');

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración del remitente
const FROM_EMAIL = process.env.FROM_EMAIL || 'SorteoHub <noreply@sorteohub.com>';

// Templates de email
const emailTemplates = {
  // Confirmación de participación
  participationConfirmation: (participantData, rifaData) => ({
    subject: `🎫 Confirmación de participación - ${rifaData.nombre}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Participación</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
          .content { padding: 2rem; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-row { display: flex; justify-content: space-between; margin: 0.5rem 0; }
          .info-label { font-weight: 600; color: #666; }
          .info-value { font-weight: 700; color: #1e22aa; }
          .numbers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 0.5rem; margin: 1rem 0; }
          .number-item { background: #1e22aa; color: white; padding: 0.75rem; border-radius: 8px; text-align: center; font-weight: 600; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 SorteoHub</h1>
            <p>Confirmación de Participación</p>
          </div>
          
          <div class="content">
            <h2>¡Hola ${participantData.nombre}!</h2>
            <p>Tu participación en la rifa <strong>"${rifaData.nombre}"</strong> ha sido confirmada exitosamente.</p>
            
            <div class="info-card">
              <h3>📋 Detalles de tu Participación</h3>
              <div class="info-row">
                <span class="info-label">Rifa:</span>
                <span class="info-value">${rifaData.nombre}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Elementos seleccionados:</span>
                <span class="info-value">${participantData.numerosSeleccionados.length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total pagado:</span>
                <span class="info-value">$${participantData.totalPagado}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de participación:</span>
                <span class="info-value">${new Date().toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            
            <div class="info-card">
              <h3>🎯 Tus Elementos</h3>
              <div class="numbers-grid">
                ${participantData.numerosSeleccionados.map(numero => 
                  `<div class="number-item">${numero}</div>`
                ).join('')}
              </div>
            </div>
            
            <div class="info-card">
              <h3>📅 Información del Sorteo</h3>
              <div class="info-row">
                <span class="info-label">Fecha de sorteo:</span>
                <span class="info-value">${rifaData.fecha_sorteo ? new Date(rifaData.fecha_sorteo).toLocaleDateString('es-MX') : 'Por definir'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Plataforma:</span>
                <span class="info-value">${rifaData.plataforma_transmision || 'Por definir'}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL}/preview/${rifaData.id}" class="cta-button">
                Ver Rifa Completa
              </a>
            </div>
            
            <p><strong>¡Buena suerte!</strong> Te notificaremos cuando se realice el sorteo.</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
            <p>Si no participaste en esta rifa, puedes ignorar este correo.</p>
          </div>
        </div>
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rifa Agotada</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
          .content { padding: 2rem; }
          .success-card { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-row { display: flex; justify-content: space-between; margin: 0.5rem 0; }
          .info-label { font-weight: 600; color: #666; }
          .info-value { font-weight: 700; color: #1e22aa; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Felicidades!</h1>
            <p>Tu rifa está completamente vendida</p>
          </div>
          
          <div class="content">
            <h2>¡Excelente trabajo!</h2>
            <p>Tu rifa <strong>"${rifaData.nombre}"</strong> ha sido completamente vendida.</p>
            
            <div class="success-card">
              <h3>🎯 Resumen de Ventas</h3>
              <div class="info-row">
                <span class="info-label">Total de elementos:</span>
                <span class="info-value">${rifaData.cantidad_elementos}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Elementos vendidos:</span>
                <span class="info-value">${rifaData.cantidad_elementos}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total recaudado:</span>
                <span class="info-value">$${(parseFloat(rifaData.precio) * rifaData.cantidad_elementos).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Participantes:</span>
                <span class="info-value">${rifaData.total_participantes || 0}</span>
              </div>
            </div>
            
            <div class="info-card">
              <h3>📅 Próximos Pasos</h3>
              <p><strong>1.</strong> Realiza el sorteo en la fecha programada: <strong>${rifaData.fecha_sorteo ? new Date(rifaData.fecha_sorteo).toLocaleDateString('es-MX') : 'Por definir'}</strong></p>
              <p><strong>2.</strong> Transmite el sorteo en: <strong>${rifaData.plataforma_transmision || 'Por definir'}</strong></p>
              <p><strong>3.</strong> Notifica al ganador y entrega el premio</p>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL}/gestionar/${rifaData.id}" class="cta-button">
                Gestionar Rifa
              </a>
            </div>
            
            <p><strong>¡Gracias por usar SorteoHub!</strong> Tu rifa ha sido un éxito total.</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
          </div>
        </div>
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Sorteo</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
          .content { padding: 2rem; }
          .urgent-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-row { display: flex; justify-content: space-between; margin: 0.5rem 0; }
          .info-label { font-weight: 600; color: #666; }
          .info-value { font-weight: 700; color: #1e22aa; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ ¡Recordatorio!</h1>
            <p>Tu sorteo comienza en 1 hora</p>
          </div>
          
          <div class="content">
            <h2>¡Es hora del sorteo!</h2>
            <p>Tu rifa <strong>"${rifaData.nombre}"</strong> está programada para comenzar en <strong>1 hora</strong>.</p>
            
            <div class="urgent-card">
              <h3>🎯 Detalles del Sorteo</h3>
              <div class="info-row">
                <span class="info-label">Rifa:</span>
                <span class="info-value">${rifaData.nombre}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha y hora:</span>
                <span class="info-value">${rifaData.fecha_sorteo ? new Date(rifaData.fecha_sorteo).toLocaleString('es-MX') : 'Por definir'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Plataforma:</span>
                <span class="info-value">${rifaData.plataforma_transmision || 'Por definir'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Método de sorteo:</span>
                <span class="info-value">${rifaData.metodo_sorteo || 'Por definir'}</span>
              </div>
            </div>
            
            <div class="info-card">
              <h3>📋 Checklist Pre-Sorteo</h3>
              <p><strong>✅</strong> Verifica que tengas todos los elementos para el sorteo</p>
              <p><strong>✅</strong> Confirma que la transmisión esté lista</p>
              <p><strong>✅</strong> Ten a mano la lista de participantes</p>
              <p><strong>✅</strong> Prepara el premio para el ganador</p>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL}/gestionar/${rifaData.id}" class="cta-button">
                Gestionar Sorteo
              </a>
            </div>
            
            <p><strong>¡Que tengas un excelente sorteo!</strong> Los participantes están emocionados.</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
          </div>
        </div>
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a SorteoHub</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
          .content { padding: 2rem; }
          .welcome-card { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #3b82f6; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .feature-list { list-style: none; padding: 0; }
          .feature-list li { padding: 0.5rem 0; border-bottom: 1px solid #e1e5e9; }
          .feature-list li:last-child { border-bottom: none; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido a SorteoHub!</h1>
            <p>Tu plataforma profesional para rifas digitales</p>
          </div>
          
          <div class="content">
            <h2>¡Hola ${userData.nombre}!</h2>
            <p>Nos complace darte la bienvenida a <strong>SorteoHub</strong>, la plataforma que te permite crear, gestionar y vender rifas de manera profesional y transparente.</p>
            
            <div class="welcome-card">
              <h3>🚀 Comienza Ahora</h3>
              <p>Estás a solo unos pasos de crear tu primera rifa y llegar a miles de participantes.</p>
            </div>
            
            <div class="info-card">
              <h3>✨ Características Principales</h3>
              <ul class="feature-list">
                <li><strong>🎯 Creación Fácil:</strong> Crea tu rifa en minutos con nuestro asistente paso a paso</li>
                <li><strong>💳 Pagos Seguros:</strong> Procesa pagos de forma segura con Stripe</li>
                <li><strong>📊 Gestión Total:</strong> Controla ventas, participantes y premios desde tu dashboard</li>
                <li><strong>🌍 Alcance Ilimitado:</strong> Llega a participantes de cualquier ciudad, estado o país</li>
                <li><strong>🔔 Notificaciones:</strong> Recibe alertas en tiempo real sobre tus rifas</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/gestionar" class="cta-button">
                Crear Mi Primera Rifa
              </a>
            </div>
            
            <p><strong>¿Necesitas ayuda?</strong> Nuestro equipo está listo para asistirte en cada paso. ¡Que tengas éxito con tus rifas!</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
            <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
        </div>
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Eres el Ganador!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 2rem; font-weight: 700; }
          .content { padding: 2rem; }
          .winner-card { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 3px solid #10b981; border-radius: 8px; padding: 2rem; margin: 1rem 0; text-align: center; }
          .winner-number { font-size: 3rem; font-weight: 700; color: #059669; margin: 1rem 0; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-row { display: flex; justify-content: space-between; margin: 0.5rem 0; }
          .info-label { font-weight: 600; color: #666; }
          .info-value { font-weight: 700; color: #1e22aa; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡FELICIDADES!</h1>
            <p>¡Eres el ganador!</p>
          </div>
          
          <div class="content">
            <div class="winner-card">
              <h2>${participantData.nombre}</h2>
              <p style="font-size: 1.2rem; margin: 1rem 0;">¡Has ganado la rifa!</p>
              <div class="winner-number">${rifaData.numero_ganador}</div>
              <p style="font-size: 1.1rem; font-weight: 600;">Número Ganador</p>
            </div>
            
            <div class="info-card">
              <h3>📋 Detalles del Premio</h3>
              <div class="info-row">
                <span class="info-label">Rifa:</span>
                <span class="info-value">${rifaData.nombre}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tu número ganador:</span>
                <span class="info-value">${rifaData.numero_ganador}</span>
              </div>
              ${rifaData.premio ? `
              <div class="info-row">
                <span class="info-label">Premio:</span>
                <span class="info-value">${rifaData.premio}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-card">
              <h3>📞 Próximos Pasos</h3>
              <p><strong>1.</strong> El organizador de la rifa se pondrá en contacto contigo pronto</p>
              <p><strong>2.</strong> Asegúrate de tener tu información de contacto actualizada</p>
              <p><strong>3.</strong> Coordina la entrega del premio con el organizador</p>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/${rifaData.id}" class="cta-button">
                Ver Detalles de la Rifa
              </a>
            </div>
            
            <p><strong>¡Felicidades de nuevo!</strong> Esperamos que disfrutes tu premio.</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email de recordatorio de finalización (24h antes)
  endingSoonReminder: (rifaData) => ({
    subject: `⏰ Tu rifa "${rifaData.nombre}" termina en 24 horas`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rifa Terminando Pronto</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
          .content { padding: 2rem; }
          .urgent-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-row { display: flex; justify-content: space-between; margin: 0.5rem 0; }
          .info-label { font-weight: 600; color: #666; }
          .info-value { font-weight: 700; color: #1e22aa; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ ¡Atención!</h1>
            <p>Tu rifa termina en 24 horas</p>
          </div>
          
          <div class="content">
            <h2>¡Últimas horas!</h2>
            <p>Tu rifa <strong>"${rifaData.nombre}"</strong> está por finalizar en <strong>24 horas</strong>.</p>
            
            <div class="urgent-card">
              <h3>📊 Estado Actual</h3>
              <div class="info-row">
                <span class="info-label">Elementos vendidos:</span>
                <span class="info-value">${rifaData.elementos_vendidos || 0} / ${rifaData.cantidad_elementos || 0}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Progreso:</span>
                <span class="info-value">${rifaData.cantidad_elementos ? Math.round(((rifaData.elementos_vendidos || 0) / rifaData.cantidad_elementos) * 100) : 0}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total recaudado:</span>
                <span class="info-value">$${((rifaData.elementos_vendidos || 0) * parseFloat(rifaData.precio || 0)).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="info-card">
              <h3>💡 Última Oportunidad</h3>
              <p>Comparte tu rifa en redes sociales para maximizar las últimas participaciones:</p>
              <ul>
                <li>Comparte el enlace en tus grupos de WhatsApp</li>
                <li>Publica en tus redes sociales</li>
                <li>Envía recordatorios a tus contactos</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/gestionar/${rifaData.id}" class="cta-button">
                Gestionar Rifa
              </a>
            </div>
            
            <p><strong>¡No dejes pasar esta oportunidad!</strong> Aprovecha estas últimas horas.</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
          </div>
        </div>
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Confirmado</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; }
          .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
          .content { padding: 2rem; }
          .success-card { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-card { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .info-row { display: flex; justify-content: space-between; margin: 0.5rem 0; }
          .info-label { font-weight: 600; color: #666; }
          .info-value { font-weight: 700; color: #1e22aa; }
          .numbers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 0.5rem; margin: 1rem 0; }
          .number-item { background: #10b981; color: white; padding: 0.75rem; border-radius: 8px; text-align: center; font-weight: 600; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #1e22aa 0%, #2c3eaa 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pago Confirmado</h1>
            <p>Tu participación ha sido validada</p>
          </div>
          
          <div class="content">
            <h2>¡Hola ${participantData.nombre}!</h2>
            <p>Tu pago para la rifa <strong>"${rifaData.nombre}"</strong> ha sido confirmado exitosamente.</p>
            
            <div class="success-card">
              <h3>✅ Estado: Confirmado</h3>
              <p>Tu participación está oficialmente registrada y confirmada.</p>
            </div>
            
            <div class="info-card">
              <h3>📋 Detalles de tu Participación</h3>
              <div class="info-row">
                <span class="info-label">Rifa:</span>
                <span class="info-value">${rifaData.nombre}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total pagado:</span>
                <span class="info-value">$${participantData.totalPagado}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de confirmación:</span>
                <span class="info-value">${new Date().toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            
            <div class="info-card">
              <h3>🎯 Tus Números Confirmados</h3>
              <div class="numbers-grid">
                ${participantData.numerosSeleccionados.map(numero => 
                  `<div class="number-item">${numero}</div>`
                ).join('')}
              </div>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/${rifaData.id}" class="cta-button">
                Ver Rifa
              </a>
            </div>
            
            <p><strong>¡Buena suerte!</strong> Te notificaremos cuando se realice el sorteo.</p>
          </div>
          
          <div class="footer">
            <p>Este correo fue enviado por SorteoHub - Plataforma profesional para rifas sin fines de lucro</p>
            <p>Pago procesado de forma segura por Stripe</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Emails autorizados para desarrollo (plan gratuito de Resend)
// En desarrollo, Resend solo permite enviar a emails verificados
// Agrega aquí los emails que quieras usar en desarrollo
const AUTHORIZED_EMAILS = ['tiendaap25@gmail.com'];

// Función para agregar email a la lista de autorizados (útil para testing)
const addAuthorizedEmail = (email) => {
  if (!AUTHORIZED_EMAILS.includes(email)) {
    AUTHORIZED_EMAILS.push(email);
    console.log(`✅ Email agregado a lista de autorizados: ${email}`);
  }
};

// Función para validar email en desarrollo
const validateEmailForDevelopment = (email) => {
  if (process.env.NODE_ENV === 'development') {
    return AUTHORIZED_EMAILS.includes(email);
  }
  return true; // En producción, permitir cualquier email
};

// Función para verificar si Resend está configurado
const isResendConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

// Funciones para enviar emails
const emailService = {
  // Enviar confirmación de participación
  async sendParticipationConfirmation(participantData, rifaData) {
    try {
      // Validar email en modo desarrollo
      if (!validateEmailForDevelopment(participantData.email)) {
        console.log(`⚠️  Modo desarrollo: Email ${participantData.email} no autorizado. Enviando a tiendaap25@gmail.com`);
        participantData.email = 'tiendaap25@gmail.com';
      }

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
      console.error('❌ Error enviando email de confirmación:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar notificación de rifa agotada
  async sendRaffleSoldOut(rifaData) {
    try {
      const template = emailTemplates.raffleSoldOut(rifaData);
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [rifaData.creador_email],
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email de rifa agotada enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email de rifa agotada:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar recordatorio de sorteo
  async sendDrawReminder(rifaData) {
    try {
      const template = emailTemplates.drawReminder(rifaData);
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [rifaData.creador_email],
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email de recordatorio enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email de recordatorio:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar email de bienvenida
  async sendWelcomeEmail(userData) {
    try {
      // Verificar si Resend está configurado
      if (!isResendConfigured()) {
        console.warn('⚠️  RESEND_API_KEY no está configurada. No se puede enviar email de bienvenida.');
        return { 
          success: false, 
          error: 'RESEND_API_KEY no configurada',
          message: 'Configura RESEND_API_KEY en tu archivo config.env para habilitar el envío de emails'
        };
      }

      const originalEmail = userData.email;
      
      // Validar email en modo desarrollo
      if (!validateEmailForDevelopment(userData.email)) {
        console.log(`⚠️  Modo desarrollo: Email ${userData.email} no autorizado. Enviando a tiendaap25@gmail.com`);
        userData.email = 'tiendaap25@gmail.com';
      }

      console.log(`📧 Intentando enviar email de bienvenida a: ${userData.email}${originalEmail !== userData.email ? ` (original: ${originalEmail})` : ''}`);

      const template = emailTemplates.welcome(userData);
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [userData.email],
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email de bienvenida enviado:', result.data?.id);
      console.log(`📧 Email enviado a: ${userData.email}`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        stack: error.stack,
        email: userData.email
      });
      return { success: false, error: error.message };
    }
  },

  // Enviar email al ganador
  async sendWinnerNotification(participantData, rifaData) {
    try {
      // Validar email en modo desarrollo
      if (!validateEmailForDevelopment(participantData.email)) {
        console.log(`⚠️  Modo desarrollo: Email ${participantData.email} no autorizado. Enviando a tiendaap25@gmail.com`);
        participantData.email = 'tiendaap25@gmail.com';
      }

      const template = emailTemplates.winnerNotification(participantData, rifaData);
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [participantData.email],
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email al ganador enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email al ganador:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar recordatorio de finalización (24h antes)
  async sendEndingSoonReminder(rifaData) {
    try {
      const template = emailTemplates.endingSoonReminder(rifaData);
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [rifaData.creador_email],
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email de recordatorio de finalización enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email de recordatorio de finalización:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar email de pago validado (Stripe)
  async sendPaymentValidated(participantData, rifaData) {
    try {
      // Validar email en modo desarrollo
      if (!validateEmailForDevelopment(participantData.email)) {
        console.log(`⚠️  Modo desarrollo: Email ${participantData.email} no autorizado. Enviando a tiendaap25@gmail.com`);
        participantData.email = 'tiendaap25@gmail.com';
      }

      const template = emailTemplates.paymentValidated(participantData, rifaData);
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [participantData.email],
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email de pago validado enviado:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Error enviando email de pago validado:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
