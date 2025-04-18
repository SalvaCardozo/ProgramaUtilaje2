const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
const cookieParser = require('cookie-parser'); // Nueva importación
require('dotenv').config();

const app = express();

// Configurar logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Middleware básico
app.use(express.json());
app.use(cookieParser()); // Agregado aquí
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Configurar rate limiting para el login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
});
app.use('/api/login', loginLimiter);

// Conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

pool.connect((err) => {
    if (err) {
        logger.error('Error conectando a PostgreSQL:', err);
        process.exit(1);
    }
    logger.info('Conectado a PostgreSQL');
});

// Middleware para sanitizar entradas
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].replace(/[<>]/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
};
app.use(sanitizeInput);

// Middleware global para manejar errores
app.use((err, req, res, next) => {
    logger.error(`Error inesperado: ${err.message}, IP: ${req.ip}`);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta de login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    logger.info(`Intento de login con username: ${username}`);

    if (!username || !password) {
        logger.warn(`Intento de login sin credenciales completas desde IP: ${req.ip}`);
        return res.status(400).json({ error: 'Faltan credenciales' });
    }

    try {
        const query = 'SELECT * FROM users WHERE LOWER(username) = LOWER($1)';
        const result = await pool.query(query, [username]);
        logger.info(`Consulta ejecutada: ${query}, username: ${username}, resultados: ${result.rows.length}`);

        if (result.rows.length === 0) {
            logger.warn(`Usuario no encontrado: ${username}, IP: ${req.ip}`);
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        logger.info(`Usuario encontrado: ${user.username}, hash almacenado: ${user.password}`);

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn(`Contraseña incorrecta para usuario: ${username}, IP: ${req.ip}`);
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000,
        });

        logger.info(`Login exitoso para usuario: ${username}, IP: ${req.ip}`);
        res.json({ message: 'Login exitoso' });
    } catch (err) {
        logger.error(`Error en login: ${err.message}, IP: ${req.ip}`);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Middleware para verificar el JWT
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        logger.error(`Token inválido: ${err.message}, IP: ${req.ip}`);
        res.status(403).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar roles (RBAC)
const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        logger.warn(`Permiso denegado para usuario: ${req.user.username}, IP: ${req.ip}`);
        return res.status(403).json({ error: 'Permiso denegado' });
    }
    next();
};

// Ruta protegida de ejemplo (solo para admins)
app.get('/api/admin', authenticateToken, checkRole(['admin']), (req, res) => {
    res.json({ message: 'Acceso autorizado para admins', user: req.user });
});

// Ruta para cerrar sesión
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    logger.info(`Sesión cerrada, IP: ${req.ip}`);
    res.json({ message: 'Sesión cerrada' });
});



// Datos ficticios para pruebas
const pedidosFicticios = [
    { id: 1, descripcion: 'Crear matriz para prensa', avance: 75, estado: 'En progreso', vencimiento: '2025-04-20' },
    { id: 2, descripcion: 'Modificar herramienta de corte', avance: 20, estado: 'Pendiente', vencimiento: '2025-04-25' },
];

const dependenciasFicticias = [
    { id: 1, nombre: 'Taller de Mecanizado', responsable: 'Juan Pérez' },
    { id: 2, nombre: 'Depósito de Materiales', responsable: 'María Gómez' },
];

const notasFicticias = [
    { id: 1, contenido: 'Revisar pedido #1 antes del viernes', fecha: '2025-04-16' },
    { id: 2, contenido: 'Llamar a proveedor de acero', fecha: '2025-04-17' },
];

// Ruta para obtener pedidos
app.get('/api/pedidos', authenticateToken, checkRole(['admin']), (req, res) => {
    logger.info(`Obteniendo pedidos, usuario: ${req.user.username}, IP: ${req.ip}`);
    res.json(pedidosFicticios);
});

// Ruta para obtener dependencias
app.get('/api/dependencias', authenticateToken, checkRole(['admin']), (req, res) => {
    logger.info(`Obteniendo dependencias, usuario: ${req.user.username}, IP: ${req.ip}`);
    res.json(dependenciasFicticias);
});

// Ruta para obtener notas
app.get('/api/notas', authenticateToken, checkRole(['admin']), (req, res) => {
    logger.info(`Obteniendo notas, usuario: ${req.user.username}, IP: ${req.ip}`);
    res.json(notasFicticias);
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
});