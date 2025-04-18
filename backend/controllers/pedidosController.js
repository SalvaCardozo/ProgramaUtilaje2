const { query } = require('../db');
const validator = require('validator');
const XLSX = require('xlsx');
const path = require('path');

// Obtener todos los pedidos
const getPedidos = async (req, res) => {
    try {
        const pedidos = await query('SELECT * FROM pedidos ORDER BY created_at DESC');
        res.json(pedidos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

// Crear un nuevo pedido y hacer backup
const createPedido = async (req, res) => {
    const {
        nombre_conjunto, nombre_plano, linea, tipo_pieza, tipo_pedido,
        fecha_pedido, fecha_limite, cantidad, estado, avance, procesos, motivo_reprogramacion
    } = req.body;

    // Validar datos
    if (!nombre_conjunto || !validator.isLength(nombre_conjunto, { min: 1, max: 100 })) {
        return res.status(400).json({ error: 'Nombre del conjunto inválido' });
    }
    if (!nombre_plano || !validator.isLength(nombre_plano, { min: 1, max: 50 })) {
        return res.status(400).json({ error: 'Nombre del plano inválido' });
    }
    if (!tipo_pieza || !validator.isLength(tipo_pieza, { min: 1, max: 50 })) {
        return res.status(400).json({ error: 'Tipo de pieza inválido' });
    }
    if (!validator.isInt(cantidad.toString(), { min: 1 })) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }
    if (!validator.isDate(fecha_pedido) || !validator.isDate(fecha_limite)) {
        return res.status(400).json({ error: 'Fechas inválidas' });
    }

    try {
        const result = await query(
            `INSERT INTO pedidos (
                nombre_conjunto, nombre_plano, linea, tipo_pieza, tipo_pedido,
                fecha_pedido, fecha_limite, cantidad, estado, avance, procesos, motivo_reprogramacion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                nombre_conjunto, nombre_plano, linea, tipo_pieza, tipo_pedido,
                fecha_pedido, fecha_limite, cantidad, estado || 'Pendiente', avance || 0, procesos, motivo_reprogramacion
            ]
        );

        // Hacer backup automático
        await makeBackup();

        res.status(201).json(result[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear pedido' });
    }
};

// Actualizar un pedido y hacer backup
const updatePedido = async (req, res) => {
    const { id } = req.params;
    const {
        nombre_conjunto, nombre_plano, linea, tipo_pieza, tipo_pedido,
        fecha_pedido, fecha_limite, cantidad, estado, avance, procesos, motivo_reprogramacion
    } = req.body;

    try {
        const result = await query(
            `UPDATE pedidos SET
                nombre_conjunto = $1, nombre_plano = $2, linea = $3, tipo_pieza = $4, tipo_pedido = $5,
                fecha_pedido = $6, fecha_limite = $7, cantidad = $8, estado = $9, avance = $10,
                procesos = $11, motivo_reprogramacion = $12
            WHERE id = $13 RETURNING *`,
            [
                nombre_conjunto, nombre_plano, linea, tipo_pieza, tipo_pedido,
                fecha_pedido, fecha_limite, cantidad, estado, avance, procesos, motivo_reprogramacion, id
            ]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Hacer backup automático
        await makeBackup();

        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
};

// Eliminar un pedido y hacer backup
const deletePedido = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [id]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Hacer backup automático
        await makeBackup();

        res.json({ message: 'Pedido eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
};

// Función para hacer backup automático en Excel
const makeBackup = async () => {
    try {
        const pedidos = await query('SELECT * FROM pedidos');
        const worksheet = XLSX.utils.json_to_sheet(pedidos);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        XLSX.writeFile(workbook, path.join(__dirname, `../backups/pedidos_backup_${timestamp}.xlsx`));
    } catch (err) {
        console.error('Error al crear backup:', err);
    }
};

module.exports = { getPedidos, createPedido, updatePedido, deletePedido };