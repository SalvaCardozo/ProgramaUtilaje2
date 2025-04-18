const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const backupController = require('../controllers/backupController');

// Proteger todas las rutas con autenticación
router.use(isAuthenticated);

// Generar un backup manual
router.post('/manual', backupController.createManualBackup);

module.exports = router;