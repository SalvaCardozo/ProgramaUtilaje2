const { query } = require('../db');
const validator = require('validator');

// Obtener todas las dependencias
const getDependencias = async (req, res) => {
    try {
        const dependencias = await query('SELECT * FROM dependencias ORDER BY tipo, valor');
        res.json(dependencias);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener dependencias' });
    }
};

// Crear una nueva dependencia
const createDependencia = async (req, res) => {
    const { tipo, valor } = req.body;

    // Validar datos
    if (!tipo || !validator.isLength(tipo, { min: 1, max: 50 })) {
        return res.status(400).json({ error: 'Tipo inválido' });
    }
    if (!valor || !validator.isLength(valor, { min: 1, max: 100 })) {
        return res.status(400).json({ error: 'Valor inválido' });
    }

    try {
        const result = await query(
            'INSERT INTO dependencias (tipo, valor) VALUES ($1, $2) RETURNING *',
            [tipo, valor]
        );
        res.status(201).json(result[0]);
    } catch (err) {
        if (err.code === '23505') { // Error de clave única
            res.status(400).json({ error: 'Ya existe una entrada con ese tipo y valor' });
        } else {
            res.status(500).json({ error: 'Error al crear dependencia' });
        }
    }
};

// Eliminar una dependencia
const deleteDependencia = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('DELETE FROM dependencias WHERE id = $1 RETURNING *', [id]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Dependencia no encontrada' });
        }
        res.json({ message: 'Dependencia eliminada' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar dependencia' });
    }
};

module.exports = { getDependencias, createDependencia, deleteDependencia };