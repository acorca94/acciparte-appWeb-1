const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { userId: user.id, tenantId: user.tenant_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

// POST /api/auth/register
router.post(
  '/register',
  [
    body('tenantName').trim().notEmpty().withMessage('Tenant name required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tenantName, email, password } = req.body;
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const slug = tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const tenantRes = await client.query(
        'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
        [tenantName, slug]
      );

      const hash = await bcrypt.hash(password, 12);
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin') RETURNING id, tenant_id, role`,
        [tenantRes.rows[0].id, email, hash]
      );

      await client.query('COMMIT');
      res.status(201).json({ token: signToken(userRes.rows[0]) });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') return res.status(409).json({ error: 'Tenant slug or email already exists' });
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    } finally {
      client.release();
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('tenantSlug').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, tenantSlug } = req.body;

    try {
      const result = await db.query(
        `SELECT u.id, u.tenant_id, u.password_hash, u.role
         FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE u.email = $1 AND t.slug = $2`,
        [email, tenantSlug]
      );

      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ token: signToken(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/recuperar-contrasena
router.post(
  '/recuperar-contrasena',
  [
    body('email').isEmail().normalizeEmail(),
    body('tenantSlug').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, tenantSlug } = req.body;

    try {
      const result = await db.query(
        `SELECT u.id FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE u.email = $1 AND t.slug = $2`,
        [email, tenantSlug]
      );

      // Respuesta genérica para no revelar si el email existe
      if (!result.rows.length) return res.json({ ok: true });

      const crypto = require('crypto');
      const token  = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 60 * 60 * 1000);

      await db.query(
        `UPDATE users SET reset_token = $1, reset_token_expira = $2 WHERE id = $3`,
        [token, expira, result.rows[0].id]
      );

      // En producción: enviar por email. En dev: consola.
      console.log(`[DEV] Reset link: http://localhost:5173/reset-contrasena?token=${token}`);

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'No se pudo procesar la solicitud' });
    }
  }
);

// POST /api/auth/reset-contrasena
router.post(
  '/reset-contrasena',
  [
    body('token').trim().notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, password } = req.body;

    try {
      const result = await db.query(
        `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expira > NOW()`,
        [token]
      );

      if (!result.rows.length) {
        return res.status(400).json({ error: 'El enlace no es válido o ha caducado.' });
      }

      const hash = await bcrypt.hash(password, 12);
      await db.query(
        `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expira = NULL WHERE id = $2`,
        [hash, result.rows[0].id]
      );

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'No se pudo restablecer la contraseña' });
    }
  }
);

module.exports = router;
