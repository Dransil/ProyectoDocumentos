const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM solicitudes');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});
router.get('/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const result = await db.query('SELECT * FROM solicitudes WHERE id_usuario = $1', [id_usuario]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para obtener solicitudes de usuarios de una dependencia específica
router.get('/dependencia/:id_dependencia', async (req, res) => {
    try {
        const { id_dependencia } = req.params;
        const result = await db.query(`
            SELECT 
                s.*, 
                u.nombre_usuario 
            FROM solicitudes s
            JOIN usuarios u ON s.id_usuario = u.id_usuario
            WHERE u.id_dependencia = $1
            ORDER BY s.fecha_solicitud DESC
        `, [id_dependencia]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});//revisar más rato

// Endpoint para actualizar el estado de una solicitud
router.put('/:id_solicitud', async (req, res) => {
    try {
        const { id_solicitud } = req.params;
        const { estado } = req.body;
        
        // Al actualizar el estado, reiniciamos el campo leido a FALSE
        // para que el usuario reciba la notificación del cambio.
        const result = await db.query(`
            UPDATE solicitudes
            SET estado = $1, leido = FALSE
            WHERE id_solicitud = $2
            RETURNING *
        `, [estado, id_solicitud]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/:id_solicitud/usuario', async (req, res) => {
    try {
        const { id_solicitud } = req.params;
        const result = await db.query(`
            SELECT usuarios.*
            FROM usuarios
            JOIN solicitudes ON usuarios.id_usuario = solicitudes.id_usuario
            WHERE solicitudes.id_solicitud = $1
        `, [id_solicitud]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/agregar', async (req, res) => {
    try {
        const { comentario, id_usuario, estado, id_documento } = req.body;

        const query = `
            INSERT INTO solicitudes (comentario, id_usuario, estado, id_documento, leido)
            VALUES ($1, $2, $3, $4, FALSE)
            RETURNING *;
        `;

        const values = [comentario, id_usuario, estado, id_documento];
        const newSolicitud = await db.query(query, values);

        res.status(201).json(newSolicitud.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la solicitud' });
    }
});
router.put('/marcar-leida/:id_solicitud', async (req, res) => {
    try {
        const { id_solicitud } = req.params;
        const { valor } = req.body; // Recibes true o false
        await db.query(
            'UPDATE solicitudes SET leido = $1 WHERE id_solicitud = $2',
            [valor, id_solicitud]
        );
        res.json({ message: `Notificación marcada como ${valor ? 'leída' : 'no leída'}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;