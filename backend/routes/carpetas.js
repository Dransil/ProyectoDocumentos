const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Ruta para crear una carpeta
router.post('/crear', async (req, res) => {
  const { nombre, id_usuario, id_padre } = req.body;

  try {
    // Buscar el rol del usuario
    const query = 'SELECT rol FROM usuarios WHERE id_usuario = $1';
    const values = [id_usuario];
    const result = await db.query(query, values);

    // Verificar si el usuario existe
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const rol = result.rows[0].rol;

    // Verificar que el usuario tenga rol Admin o Super Admin
    if (rol !== 'Admin' && rol !== 'Super Admin') {
      return res.status(403).json({ message: 'No tienes permisos para crear carpetas' });
    }

    // Verificar si id_padre es válido (si se proporciona, debe existir una carpeta con ese id)
    if (id_padre) {
      const checkPadreQuery = 'SELECT * FROM carpetas WHERE id_carpeta = $1';
      const checkPadreValues = [id_padre];
      const checkPadreResult = await db.query(checkPadreQuery, checkPadreValues);

      if (checkPadreResult.rows.length === 0) {
        return res.status(400).json({ message: 'El id_padre proporcionado no existe' });
      }
    }

    // Crear la carpeta
    const insertQuery = `
      INSERT INTO carpetas (nombre, id_usuario, id_padre)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    // Si no hay id_padre, se usa null
    const insertValues = [nombre, id_usuario, id_padre || null];
    const insertResult = await db.query(insertQuery, insertValues);

    res.status(201).json({
      message: 'Carpeta creada exitosamente',
      carpeta: insertResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});
// Ruta para obtener todas las carpetas
router.get('/', async (req, res) => {
  try {
    const query = `
        SELECT c.id_carpeta, c.nombre, c.id_usuario, c.id_padre, u.nombre_usuario AS usuario_nombre, c.fecha_creacion
        FROM carpetas c
        LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      `;
    const result = await db.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron carpetas' });
    }

    res.status(200).json({ carpetas: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});
// Buscar carpeta por nombre exacto (para el año extraído por OCR)
router.get('/buscar-por-nombre/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    const query = `
        SELECT id_carpeta, nombre 
        FROM carpetas 
        WHERE nombre = $1 
        LIMIT 1
      `;
    const result = await db.query(query, [nombre]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});
// Ruta para incrementar el uso de una carpeta
router.put('/uso/:id_carpeta', async (req, res) => {
  const { id_carpeta } = req.params;

  try {
    // Actualizar la columna "uso" incrementando en 1
    const query = `
      UPDATE carpetas
      SET uso = uso + 1
      WHERE id_carpeta = $1
      RETURNING *;
    `;
    const values = [id_carpeta];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }

    res.status(200).json({
      message: 'Uso incrementado exitosamente',
      carpeta: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});
// Obtener carpetas con uso mayor a 0
router.get('/mayores', async (req, res) => {
  try {
    const query = `
      SELECT * FROM carpetas
      WHERE uso > 0
      ORDER BY uso DESC;
    `;
    const result = await db.query(query);

    res.status(200).json({
      message: 'Carpetas con uso mayor a 0 obtenidas correctamente',
      carpetas: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener carpetas con uso > 0', error: error.message });
  }
});
// Obtener todas las carpetas ordenadas del más reciente al más antiguo
router.get('/recientes', async (req, res) => {
  try {
    const query = `
      SELECT * FROM carpetas
      ORDER BY fecha_creacion DESC;
    `;
    const result = await db.query(query);

    res.status(200).json({
      message: 'Carpetas ordenadas del más reciente al más antiguo',
      carpetas: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener carpetas ordenadas', error: error.message });
  }
});


module.exports = router;
