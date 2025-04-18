const { query } = require('../db');
const validator = require('validator');

// Obtener todas las notas del usuario autenticado
const getNotas = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const notas = await query('SELECT * FROM notas WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(notas);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener notas' });
    }
};

// Crear una nueva nota
const createNota = async (req, res) => {
    const { contenido, color } = req.body;
    const userId = req.session.user.id;

    // Validar datos
    if (!contenido || !validator.isLength(contenido, { min: 1, max: 1000 })) {
        return res.status(400).json({ error: 'Contenido inválido' });
    }
    if (!color || !validator.isHexColor(color)) {
        return res.status(400).json({ error: 'Color inválido' });
    }

    try {
        const result = await query(
            'INSERT INTO notas (user_id, contenido, color) VALUES ($1, $2, $3) RETURNING *',
            [userId, contenido, color]
        );
        res.status(201).json(result[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear nota' });
    }
};

// Actualizar una nota
const updateNota = async (req, res) => {
    const { id } = req.params;
    const { contenido, color } = req.body;
    const userId = req.session.user.id;

    try {
        const result = await query(
            'UPDATE notas SET contenido = $1, color = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [contenido, color, id, userId]
        );
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nota no encontrada o no pertenece al usuario' });
        }
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar nota' });
    }
};

// Eliminar una nota
const deleteNota = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;

    try {
        const result = await query('DELETE FROM notas WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nota no encontrada o no pertenece al usuario' });
        }
        res.json({ message: 'Nota eliminada' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar nota' });
    }
};

module.exports = { getNotas, createNota, updateNota, deleteNota };