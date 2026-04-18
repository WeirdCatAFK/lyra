require('dotenv').config();

module.exports = {
    app: {
        port: process.env.PORT
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expires: process.env.JWT_EXPIRES_IN
    },
    db: {
        path: process.env.DB_PATH
    },
    security: {
        saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
    }
};