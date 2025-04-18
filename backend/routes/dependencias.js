const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const dependenciasController = require('../controllers/dependenciasController');

// Proteger todas las rutas con autenticación
router.use(isAuthenticated);

// Obtener todas las dependencias
router.get('/', dependenciasController.getDependencias);

// Crear una nueva dependencia
router.post('/', dependenciasController.createDependencia);

// Eliminar una dependencia
router.delete('/:id', dependenciasController.deleteDependencia);

module.exports = router;