const express = require('express');
const router = express.Router();
const db = require('../db/db');

// 1. Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clientes ORDER BY nombre_completo ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
    }
});

// 2. Obtener un cliente por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el cliente', error: error.message });
    }
});

// 3. Agregar un nuevo cliente
router.post('/agregar', async (req, res) => {
    const { nombre_completo, ci_nit, telefono, numero_cliente } = req.body;

    try {
        const query = `
            INSERT INTO clientes (nombre_completo, ci_nit, telefono, numero_cliente)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [nombre_completo, ci_nit, telefono, numero_cliente];
        const result = await db.query(query, values);

        res.status(201).json({ message: 'Cliente registrado', cliente: result.rows[0] });
    } catch (error) {
        // Error 23505 = Unique Violation en PostgreSQL
        if (error.code === '23505') {
            return res.status(400).json({ 
                message: 'El CI/NIT o el Número de Cliente ya existe en el sistema.' 
            });
        }
        res.status(500).json({ message: error.message });
    }
});

// 4. Modificar un cliente
router.put('/modificar/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, ci_nit, telefono, numero_cliente } = req.body;

    try {
        const query = `
            UPDATE clientes 
            SET nombre_completo = $1, ci_nit = $2, telefono = $3, numero_cliente = $4
            WHERE id_cliente = $5
            RETURNING *;
        `;
        const values = [nombre_completo, ci_nit, telefono, numero_cliente, id];
        const result = await db.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ message: 'No encontrado' });

        res.json({ message: 'Actualizado correctamente', cliente: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Error: El CI o Número de Cliente ya está en uso.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// 5. Eliminar un cliente
router.delete('/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM clientes WHERE id_cliente = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar cliente', error: error.message });
    }
});

module.exports = router;