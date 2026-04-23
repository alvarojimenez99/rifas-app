// utils/socketNotifications.js
const log = { info: console.log, error: console.error };

function emitNotification(io, userId, notification) {
  try {
    if (!io) {
      log.warn('⚠️ Socket.io no está disponible');
      return;
    }
    
    const room = `user:${userId}`;
    io.to(room).emit('notification', notification);
    log.info(`Notificación emitida a sala ${room}`, { notificationId: notification.id });
  } catch (error) {
    log.error('Error emitiendo notificación', error);
  }
}

function emitUnreadCount(io, userId, count) {
  try {
    if (!io) return;
    io.to(`user:${userId}`).emit('unread-count', { count });
  } catch (error) {
    log.error('Error emitiendo contador', error);
  }
}

module.exports = { emitNotification, emitUnreadCount };