const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Ruta: /usuarios/resumen_admin/:id_dependencia
router.get('/resumen_admin/:id_dependencia', async (req, res) => {
  try {
    const { id_dependencia } = req.params;

    // 1. Obtener el nombre de la dependencia
    const depQuery = await db.query(
      'SELECT nombre_dependencia FROM dependencias WHERE id_dependencia = $1',
      [id_dependencia]
    );

    // 2. Contar documentos de esa dependencia
    const docsQuery = await db.query(
      'SELECT COUNT(*) FROM documentos WHERE id_dependencia = $1',
      [id_dependencia]
    );

    if (depQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Dependencia no encontrada' });
    }

    res.json({
      nombre_dependencia: depQuery.rows[0].nombre_dependencia,
      documentos: docsQuery.rows[0].count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener estadísticas del área' });
  }
});
router.get('/resumen', async (req, res) => {
  try {
    const usuarios = await db.query('SELECT COUNT(*) FROM usuarios');
    const documentos = await db.query('SELECT COUNT(*) FROM documentos');
    const dependencias = await db.query('SELECT COUNT(*) FROM dependencias');

    res.json({
      usuarios: usuarios.rows[0].count,
      documentos: documentos.rows[0].count,
      dependencias: dependencias.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Crear un nuevo usuario
router.post('/registrar', async (req, res) => {
  const { nombre_usuario, contraseña, id_dependencia } = req.body;

  try {
    const checkUsersQuery = 'SELECT COUNT(*) FROM usuarios';
    const checkResult = await db.query(checkUsersQuery);
    const count = parseInt(checkResult.rows[0].count);

    const isFirstUser = count === 0;
    const rolFinal = isFirstUser ? 'Super Admin' : 'Usuario';
    
    // Si es el primer usuario, permitimos que la dependencia sea null
    const dependenciaFinal = isFirstUser ? (id_dependencia || null) : id_dependencia;

    // Validación extra: si NO es el primero y no envió dependencia, lanzamos error
    if (!isFirstUser && !dependenciaFinal) {
      return res.status(400).json({ message: "La dependencia es obligatoria para usuarios regulares." });
    }

    const query = `
      INSERT INTO usuarios (nombre_usuario, contraseña, rol, id_dependencia)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const values = [nombre_usuario, contraseña, rolFinal, dependenciaFinal];
    const result = await db.query(query, values);

    const userCreated = result.rows[0];
    delete userCreated.contraseña;

    res.status(201).json(userCreated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Modificar un usuario
router.put('/modificar/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, contraseña, rol, id_dependencia } = req.body;

  try {
    const query = `
      UPDATE usuarios
      SET 
        nombre_usuario = $1,
        contraseña = $2,
        rol = $3,
        id_dependencia = $4
      WHERE id_usuario = $5
      RETURNING *;
    `;
    const values = [nombre_usuario, contraseña, rol, id_dependencia, id];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario modificado exitosamente', usuario: result.rows[0] });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para login
router.post('/login', async (req, res) => {
  const { nombre_usuario, contraseña } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE nombre_usuario = $1';
    const values = [nombre_usuario];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    if (usuario.contraseña === contraseña) {
      return res.status(200).json({ message: 'Login exitoso', usuario });
    } else {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

module.exports = router;
