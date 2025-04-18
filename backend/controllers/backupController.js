const { query } = require('../db');
const XLSX = require('xlsx');
const path = require('path');

// Generar un backup manual en Excel
const createManualBackup = async (req, res) => {
    try {
        const pedidos = await query('SELECT * FROM pedidos');
        const worksheet = XLSX.utils.json_to_sheet(pedidos);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(__dirname, `../backups/pedidos_manual_${timestamp}.xlsx`);
        XLSX.writeFile(workbook, filePath);
        res.json({ message: 'Backup manual creado', file: `pedidos_manual_${timestamp}.xlsx` });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear backup manual' });
    }
};

module.exports = { createManualBackup };