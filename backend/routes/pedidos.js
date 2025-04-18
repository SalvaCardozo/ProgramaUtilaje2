const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const pedidosController = require('../controllers/pedidosController');

// Proteger todas las rutas de pedidos con autenticación
router.use(isAuthenticated);

// Obtener todos los pedidos
router.get('/', pedidosController.getPedidos);

// Crear un nuevo pedido
router.post('/', pedidosController.createPedido);

// Actualizar un pedido
router.put('/:id', pedidosController.updatePedido);

// Eliminar un pedido
router.delete('/:id', pedidosController.deletePedido);

module.exports = router;