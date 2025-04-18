const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const notasController = require('../controllers/notasController');

// Proteger todas las rutas con autenticación
router.use(isAuthenticated);

// Obtener todas las notas del usuario
router.get('/', notasController.getNotas);

// Crear una nueva nota
router.post('/', notasController.createNota);

// Actualizar una nota (por ejemplo, cambiar el color)
router.put('/:id', notasController.updateNota);

// Eliminar una nota
router.delete('/:id', notasController.deleteNota);

module.exports = router;