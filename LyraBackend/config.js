require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const PLACEHOLDER_SECRETS = new Set(['', 'change-me', 'change-me-in-production']);

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || PLACEHOLDER_SECRETS.has(jwtSecret)) {
    const msg = "JWT_SECRET is missing or set to a placeholder. Generate one with `openssl rand -hex 32` and put it in .env";
    if (isProd) {
        console.error(msg);
        process.exit(1);
    } else {
        console.warn(msg, "(continuing in dev)");
    }
}

module.exports = {
    app: {
        port: process.env.PORT
    },
    jwt: {
        secret: jwtSecret || 'dev-only-do-not-use-in-prod',
        expires: process.env.JWT_EXPIRES_IN || '30d'
    },
    db: {
        path: process.env.DB_PATH
    },
    security: {
        saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
    }
};
