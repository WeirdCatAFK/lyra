const express = require('express');
const cors = require('cors');
const config = require('./config'); // loads dotenv

const app = express();

app.set('port', config.app.port);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'lyra-backend' }));

// Rutas
app.use('/api/users', require('./routes/users'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/history', require('./routes/history'));
app.use('/api/cnn', require('./routes/cnn'));
app.use('/api/auth', require('./routes/auth'));
module.exports = app;