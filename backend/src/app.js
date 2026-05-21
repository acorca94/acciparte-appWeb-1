require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth.routes');
const partesRoutes   = require('./routes/partes.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// 20 intentos por IP cada 15 min en auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/submissions', partesRoutes);
app.use('/api/usuarios',    usuariosRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
