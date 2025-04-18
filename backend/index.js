// Importar módulos necesarios
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Importar rutas
const pedidosRoutes = require('./routes/pedidos');
const dependenciasRoutes = require('./routes/dependencias');
const notasRoutes = require('./routes/notas');
const backupsRoutes = require('./routes/backups');
const { router: authRoutes } = require('./routes/auth');

// Configurar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();

// Configurar CORS para permitir solicitudes desde el frontend (React)
app.use(cors({ 
    origin: 'http://localhost:3000', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar sesiones para autenticación
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_super_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Cambiar a true si usas HTTPS
        httpOnly: true,
        sameSite: 'lax' // 'lax' debería funcionar para desarrollo local
    }
}));

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos (PDFs)
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Rutas de la API
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/dependencias', dependenciasRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/auth', authRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});