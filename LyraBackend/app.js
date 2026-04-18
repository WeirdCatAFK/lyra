const express = require('express');
const config = require('./config');

const app = express();

app.set('port', config.app.port);


app.use(express.json());

// Rutas
app.use('/api/users', require('./routes/users'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/history', require('./routes/history'));
app.use('/api/cnn', require('./routes/cnn'));
app.use('/api/auth', require('./routes/auth'));
module.exports = app;