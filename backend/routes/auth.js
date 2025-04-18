const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { query } = require('../db');

// Ruta para login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Datos recibidos en el backend:', { username, password });
    try {
        // Buscar usuario en la base de datos
        const users = await query('SELECT * FROM users WHERE username = $1', [username]);
        console.log('Usuario encontrado:', users);
        if (users.length === 0) {
            console.log('Enviando respuesta: Usuario no encontrado');
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = users[0];
        // Comparar contraseña
        const match = await bcrypt.compare(password, user.password);
        console.log('¿Coinciden?', match);
        if (!match) {
            console.log('Enviando respuesta: Contraseña incorrecta');
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear sesión
        req.session.user = { id: user.id, username: user.username };
        console.log('Sesión creada:', req.session.user);
        // Asegurarse de que la sesión se guarde antes de enviar la respuesta
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
                return res.status(500).json({ error: 'Error al guardar la sesión' });
            }
            console.log('Enviando respuesta: Inicio de sesión exitoso');
            res.status(200).json({ message: 'Inicio de sesión exitoso' });
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ message: 'Sesión cerrada' });
    });
});

// Ruta para verificar si el usuario está autenticado
router.get('/me', (req, res) => {
    console.log('Solicitud a /api/auth/me, sesión actual:', req.session.user);
    if (req.session.user) {
        res.status(200).json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
});

// Middleware para proteger rutas
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
};

module.exports = { router, isAuthenticated };