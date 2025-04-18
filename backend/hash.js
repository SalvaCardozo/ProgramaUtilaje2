const bcrypt = require('bcrypt');

const password = 'admin123';
bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
        console.error('Error al hashear:', err);
    } else {
        console.log('Hash generado:', hash);
    }
});