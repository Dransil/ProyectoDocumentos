const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('../db/db');
const path = require('path');

// Configuración de almacenamiento con Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Inicializar Multer
const upload = multer({ storage });

// Ruta para agregar un documento
router.post('/agregar', upload.single('archivo'), async (req, res) => {
    // 1. Extraemos id_cliente del cuerpo de la petición
    const { 
        nombre_documento, 
        id_dependencia, 
        id_carpeta, 
        usuarios_prohibidos, 
        id_usuario, 
        ruta_fisica,
        id_cliente // <-- Nuevo campo
    } = req.body;
    
    const ruta_archivo = req.file?.path;

    try {
        if (!ruta_archivo) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const queryUsuario = 'SELECT rol FROM usuarios WHERE id_usuario = $1';
        const resultUsuario = await db.query(queryUsuario, [id_usuario]);

        if (resultUsuario.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const rol = resultUsuario.rows[0].rol;

        if (rol !== 'Admin' && rol !== 'Super Admin') {
            return res.status(403).json({ message: 'No tienes permisos para agregar documentos' });
        }

        // 2. Actualizamos la consulta para incluir id_cliente
        const queryInsert = `
          INSERT INTO documentos (
            nombre_documento, 
            ruta_archivo, 
            estado, 
            id_dependencia, 
            id_carpeta, 
            usuarios_prohibidos, 
            id_usuario, 
            ruta_fisica,
            id_cliente -- <-- Columna en la BD
          ) VALUES ($1, $2, 'publico', $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;

        // 3. Preparamos los valores, incluyendo el id_cliente (opcional)
        const valuesInsert = [
            nombre_documento,
            ruta_archivo,
            id_dependencia || null,
            id_carpeta || null,
            // Automatización: El creador siempre se incluye en la "Lista Blanca"
            // usuarios_prohibidos ? `{${usuarios_prohibidos},${id_usuario}}` : `{${id_usuario}}`,
            usuarios_prohibidos ? `{${usuarios_prohibidos}}` : '{}',
            id_usuario,
            ruta_fisica || null,
            id_cliente || null // Si no se envía, se guarda como NULL en la BD
        ];

        const resultInsert = await db.query(queryInsert, valuesInsert);

        res.status(201).json({
            message: 'Documento agregado y vinculado exitosamente',
            documento: resultInsert.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el documento', error: error.message });
    }
});
// Ruta para búsqueda avanzada con rango de fechas
router.get('/busqueda/avanzada', async (req, res) => {
    const { nombre, fecha_inicio, fecha_fin, numero_cliente, id_dependencia } = req.query;

    try {
        let query = `
            SELECT d.*, c.nombre_completo as nombre_cliente, c.numero_cliente 
            FROM documentos d
            LEFT JOIN clientes c ON d.id_cliente = c.id_cliente
            WHERE 1=1
        `;
        let values = [];

        if (nombre) {
            values.push(`%${nombre}%`);
            query += ` AND d.nombre_documento ILIKE $${values.length}`;
        }

        // Filtro de Rango de Fechas
        if (fecha_inicio) {
            values.push(fecha_inicio);
            query += ` AND d.createdat::date >= $${values.length}`;
        }

        if (fecha_fin) {
            values.push(fecha_fin);
            query += ` AND d.createdat::date <= $${values.length}`;
        }

        if (numero_cliente) {
            values.push(numero_cliente);
            query += ` AND c.numero_cliente = $${values.length}`;
        }

        if (id_dependencia) {
            values.push(id_dependencia);
            query += ` AND d.id_dependencia = $${values.length}`;
        }

        query += " ORDER BY d.createdat DESC";

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error en búsqueda avanzada', error: error.message });
    }
});
// Obtener documentos de una carpeta y dependencia 
router.get('/', async (req, res) => {
  const { id_carpeta, id_dependencia } = req.query;

  try {
    let query = 'SELECT * FROM documentos WHERE 1=1';
    let values = [];  // Aquí vamos a almacenar los parámetros para la consulta

    // Filtrar por carpeta con id_carpeta si se pasa
    if (id_carpeta) {
      query += ' AND id_carpeta = $1';
      values.push(id_carpeta); // Agregar el valor de id_carpeta
    }

    // Filtrar por dependencia con id_dependencia si se pasa
    if (id_dependencia) {
      query += id_carpeta ? ' AND id_dependencia = $2' : ' AND id_dependencia = $1'; // Si ya hay un parámetro, usar $2, si no, usar $1
      values.push(id_dependencia); // Agregar el valor de id_dependencia
    }

    // Ejecutar la consulta con los parámetros correspondientes
    const result = await db.query(query, values);

    res.status(200).json({
      message: 'Documentos obtenidos correctamente',
      documentos: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los documentos', error: error.message });
  }
});
router.get('/docs/', async (req, res) => {
  const { id_carpeta, id_dependencia, id_usuario } = req.query;

  try {
    let query = 'SELECT * FROM documentos WHERE 1=1';
    let values = [];

    // Filtrar por carpeta con id_carpeta si se pasa
    if (id_carpeta) {
      query += ' AND id_carpeta = $' + (values.length + 1);
      values.push(id_carpeta);
    }

    // Filtrar por dependencia con id_dependencia si se pasa
    if (id_dependencia) {
      query += ' AND id_dependencia = $' + (values.length + 1);
      values.push(id_dependencia);
    }

    // Filtrar por estado 'publico'
    query += ' AND estado = $' + (values.length + 1);
    values.push('publico');

    // Excluir documentos donde id_usuario está en usuarios_prohibidos
    // if (id_usuario) {
    //   query += ' AND NOT ($' + (values.length + 1) + ' = ANY (usuarios_prohibidos))';
    //   values.push(id_usuario);
    // }

    if (id_usuario) {
      // CAMBIO: Ahora solo mostramos el documento SI el usuario ESTÁ en el array
      query += ' AND ($' + (values.length + 1) + ' = ANY (usuarios_prohibidos))';
      values.push(id_usuario);
    }

    // Ejecutar la consulta con los parámetros correspondientes
    const result = await db.query(query, values);

    res.status(200).json({
      message: 'Documentos obtenidos correctamente',
      documentos: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los documentos', error: error.message });
  }
});

router.put('/modificar/:id_documento', upload.single('archivo'), async (req, res) => {
  const { id_documento } = req.params; // ID del documento a modificar
  const { nombre_documento, estado, usuarios_prohibidos, ruta_fisica } = req.body; // Campos del body
  const ruta_archivo = req.file?.path; // Ruta del archivo si se subió uno

  try {
    // Verificar si el documento existe
    const queryCheck = 'SELECT * FROM documentos WHERE id_documento = $1';
    const resultCheck = await db.query(queryCheck, [id_documento]);

    if (resultCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Construir consulta dinámica para actualización
    let queryUpdate = 'UPDATE documentos SET ';
    const updates = [];
    const values = [];
    let index = 1;

    if (nombre_documento) {
      updates.push(`nombre_documento = $${index++}`);
      values.push(nombre_documento);
    }
    if (ruta_archivo) {
      updates.push(`ruta_archivo = $${index++}`);
      values.push(ruta_archivo);
    }
    if (estado) {
      updates.push(`estado = $${index++}`);
      values.push(estado);
    }
    if (usuarios_prohibidos) {
      updates.push(`usuarios_prohibidos = $${index++}`);
      values.push(`{${usuarios_prohibidos}}`); // Convertir el array a formato SQL
    }
    if (ruta_fisica) {
      updates.push(`ruta_fisica = $${index++}`);
      values.push(ruta_fisica);
    }

    // Validar que al menos un campo se está actualizando
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    // Completar la consulta
    queryUpdate += updates.join(', ') + ` WHERE id_documento = $${index}`;
    values.push(id_documento); // Agregar ID del documento al final de los valores

    // Ejecutar la consulta
    await db.query(queryUpdate, values);

    res.status(200).json({
      message: 'Documento modificado exitosamente',
      documento: { id_documento, nombre_documento, ruta_archivo, estado, usuarios_prohibidos, ruta_fisica }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al modificar el documento', error: error.message });
  }
});
// Ruta para servir un documento por ID
router.get('/ver/:id_documento', async (req, res) => {
  const { id_documento } = req.params;

  try {
    // Verificar si el documento existe
    const query = 'SELECT ruta_archivo FROM documentos WHERE id_documento = $1';
    const result = await db.query(query, [id_documento]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    const rutaArchivo = result.rows[0].ruta_archivo;

    // Enviar el archivo al navegador
    const filePath = path.resolve(rutaArchivo); // Resolución de la ruta absoluta
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err.message);
        res.status(500).json({ message: 'Error al cargar el archivo' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el documento', error: error.message });
  }
});
router.put('/uso/:id_documento', async (req, res) => {
  const { id_documento } = req.params;

  try {
    const query = `
      UPDATE documentos
      SET uso = uso + 1
      WHERE id_documento = $1
      RETURNING *;
    `;
    const values = [id_documento];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json({ message: 'Uso actualizado', documento: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar uso', error: error.message });
  }
});
router.get('/mayores', async (req, res) => {
  try {
    const query = `
      SELECT id_documento, uso, nombre_documento FROM documentos
      WHERE uso > 0
      ORDER BY uso DESC;
    `;

    const result = await db.query(query);

    res.status(200).json({
      message: 'Documentos con uso mayor a 0 obtenidos correctamente',
      documentos: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener documentos con uso mayor a 0', error: error.message });
  }
});
// Obtener todos los documentos ordenados del más reciente al más antiguo
router.get('/recientes', async (req, res) => {
  try {
    const query = `
      SELECT * FROM documentos
      ORDER BY createdat DESC;
    `;

    const result = await db.query(query);

    res.status(200).json({
      message: 'Documentos obtenidos del más reciente al más antiguo',
      documentos: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener documentos ordenados', error: error.message });
  }
});
// Obtener todos los documentos de una dependencia
router.get('/dependencia/:id_dependencia', async (req, res) => {
  const { id_dependencia } = req.params;

  try {
    const query = `
      SELECT * FROM documentos
      WHERE id_dependencia = $1
      ORDER BY createdat DESC;
    `;

    const result = await db.query(query, [id_dependencia]);

    // Retornar directamente el array de documentos
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener documentos por dependencia', error: error.message });
  }
});
router.get('/detalle/:id_documento', async (req, res) => {
  const { id_documento } = req.params;

  try {
    const query = `
      SELECT * FROM documentos
      WHERE id_documento = $1;
    `;

    const result = await db.query(query, [id_documento]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los datos del documento', error: error.message });
  }
});
router.put('/autorizar/:id_solicitud', async (req, res) => {
  const { id_solicitud } = req.params;
  const { estado } = req.body;

  try {
    // 1. Obtener id_usuario y id_documento desde la solicitud
    const result = await db.query(
      'SELECT id_usuario, id_documento FROM solicitudes WHERE id_solicitud = $1',
      [id_solicitud]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const { id_usuario, id_documento } = result.rows[0];

    // 2. Actualizar la solicitud con nuevo estado
    await db.query(
      'UPDATE solicitudes SET estado = $1, leido = FALSE WHERE id_solicitud = $2',
      [estado, id_solicitud]
    );

    // 3. Actualizar el array usuarios_prohibidos del documento
    // if (estado === 'Rechazado') {
    //   // Agregar si no está ya
    //   await db.query(`
    //     UPDATE documentos
    //     SET usuarios_prohibidos = array_append(usuarios_prohibidos, $1)
    //     WHERE id_documento = $2 AND NOT ($1 = ANY (usuarios_prohibidos))
    //   `, [id_usuario, id_documento]);
    // } else if (estado === 'Aprobado') {
    //   // Eliminar del array
    //   await db.query(`
    //     UPDATE documentos
    //     SET usuarios_prohibidos = array_remove(usuarios_prohibidos, $1)
    //     WHERE id_documento = $2
    //   `, [id_usuario, id_documento]);
    // }
    // 3. CAMBIO DE LÓGICA EN EL ARRAY
    if (estado === 'Aprobado') {
      // Si se aprueba, lo AGREGAMOS a la lista de "permitidos" (usuarios_prohibidos)
      await db.query(`
        UPDATE documentos
        SET usuarios_prohibidos = array_append(usuarios_prohibidos, $1)
        WHERE id_documento = $2 AND NOT ($1 = ANY (usuarios_prohibidos))
      `, [id_usuario, id_documento]);
    } else if (estado === 'Rechazado') {
      // Si se rechaza, lo ELIMINAMOS de la lista (ya no tiene permiso)
      await db.query(`
        UPDATE documentos
        SET usuarios_prohibidos = array_remove(usuarios_prohibidos, $1)
        WHERE id_documento = $2
      `, [id_usuario, id_documento]);
    }

    res.status(200).json({ message: `Solicitud actualizada y acceso ${estado === 'Aprobado' ? 'autorizado' : 'denegado'}` });
  } catch (error) {
    console.error('Error al autorizar/rechazar acceso:', error);
    res.status(500).json({ message: 'Error en la operación', error: error.message });
  }
});

module.exports = router;
