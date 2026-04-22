const { query } = require('../config/database');

/**
 * Genera un email default para usuarios que no quieren registrarse
 * @param {string} nombre - Nombre del participante
 * @param {string} rifaId - ID de la rifa
 * @returns {string} Email generado
 */
function generarEmailDefault(nombre, rifaId) {
  const timestamp = Date.now();
  const nombreLimpio = nombre.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
  
  return `participante_${nombreLimpio}_${rifaId}_${timestamp}@aurela.local`;
}

/**
 * Verifica si un email es real o es un email default
 * @param {string} email - Email a verificar
 * @returns {boolean} true si es email real, false si es default
 */
function esEmailReal(email) {
  return !email.includes('@aurela.local');
}

/**
 * Obtiene o crea un usuario participante registrado
 * @param {string} email - Email del participante
 * @param {string} nombre - Nombre del participante
 * @param {string} telefono - Teléfono del participante
 * @returns {Object} Usuario participante
 */
async function obtenerOCrearUsuarioParticipante(email, nombre, telefono) {
  try {
    // Buscar usuario existente
    const usuarioExistente = await query(
      'SELECT * FROM usuarios_participantes WHERE email = $1 AND activo = true',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      // Actualizar datos si han cambiado
      const usuario = usuarioExistente.rows[0];
      if (usuario.nombre !== nombre || usuario.telefono !== telefono) {
        await query(
          'UPDATE usuarios_participantes SET nombre = $1, telefono = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [nombre, telefono, usuario.id]
        );
        usuario.nombre = nombre;
        usuario.telefono = telefono;
      }
      return usuario;
    }

    // Crear nuevo usuario
    const nuevoUsuario = await query(`
      INSERT INTO usuarios_participantes (email, nombre, telefono)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [email, nombre, telefono]);

    return nuevoUsuario.rows[0];
  } catch (error) {
    console.error('Error en obtenerOCrearUsuarioParticipante:', error);
    throw error;
  }
}

/**
 * Crea un participante con el sistema híbrido
 * @param {Object} datosParticipante - Datos del participante
 * @param {string} rifaId - ID de la rifa
 * @param {Object} rifa - Datos de la rifa
 * @param {string} estado - Estado del participante
 * @param {string} reservaId - ID de reserva (opcional)
 * @param {Date} reservaExpiracion - Fecha de expiración (opcional)
 * @returns {Object} Participante creado
 */
async function crearParticipanteHibrido(datosParticipante, rifaId, rifa, estado, reservaId = null, reservaExpiracion = null) {
  const { nombre, telefono, email, numerosSeleccionados } = datosParticipante;
  
  // Determinar si es email real o default
  const emailReal = esEmailReal(email);
  let usuarioParticipanteId = null;
  
  // Si es email real, crear/obtener usuario registrado
  if (emailReal) {
    const usuario = await obtenerOCrearUsuarioParticipante(email, nombre, telefono);
    usuarioParticipanteId = usuario.id;
  }

  // Crear participante
  const participanteResult = await query(`
    INSERT INTO participantes (
      rifa_id, nombre, telefono, email, numeros_seleccionados, 
      total_pagado, estado, reserva_id, reserva_expiracion, usuario_participante_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    rifaId, nombre, telefono, email, 
    JSON.stringify(numerosSeleccionados),
    rifa.precio * numerosSeleccionados.length,
    estado, reservaId, reservaExpiracion, usuarioParticipanteId
  ]);

  return participanteResult.rows[0];
}

/**
 * Obtiene el historial de participaciones de un usuario registrado
 * @param {string} email - Email del usuario
 * @returns {Array} Lista de participaciones
 */
async function obtenerHistorialParticipaciones(email) {
  try {
    const result = await query(`
      SELECT 
        p.*,
        r.nombre as rifa_nombre,
        r.descripcion as rifa_descripcion,
        r.precio as rifa_precio,
        r.fecha_fin,
        r.tipo as rifa_tipo,
        r.activa as rifa_activa,
        u.nombre as creador_nombre
      FROM participantes p
      JOIN rifas r ON p.rifa_id = r.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE p.email = $1
      ORDER BY p.fecha_participacion DESC
    `, [email]);

    return result.rows;
  } catch (error) {
    console.error('Error obteniendo historial de participaciones:', error);
    throw error;
  }
}

module.exports = {
  generarEmailDefault,
  esEmailReal,
  obtenerOCrearUsuarioParticipante,
  crearParticipanteHibrido,
  obtenerHistorialParticipaciones
};
