const bcrypt = require('bcrypt');

const password = 'admin123';
const hash = '$2b$12$PYyGkbl7w/2eSZR9B3V7h.LcdKOFRk9DBcc8nxg.ot4O2C8aPLk4G';

bcrypt.compare(password, hash, (err, match) => {
    if (err) {
        console.error('Error al comparar:', err);
    } else {
        console.log('¿Coinciden?', match);
    }
});