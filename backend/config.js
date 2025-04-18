// config.js
require('dotenv').config();

const config = {
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    },
    jwtSecret: process.env.JWT_SECRET,
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
};

module.exports = config;