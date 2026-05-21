const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, email, role, created_at
       FROM users WHERE tenant_id = $1
       ORDER BY created_at ASC`,
      [req.user.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
  }
});

// POST /api/usuarios
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email no válido'),
    body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
    body('role').isIn(['user', 'admin']).withMessage('Rol no válido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, role } = req.body;

    try {
      const hash = await bcrypt.hash(password, 12);
      const { rows } = await db.query(
        `INSERT INTO users (tenant_id, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role, created_at`,
        [req.user.tenantId, email, hash, role]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Ese email ya existe en esta organización' });
      console.error(err);
      res.status(500).json({ error: 'No se pudo crear el usuario' });
    }
  }
);

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.userId) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }
  try {
    const { rowCount } = await db.query(
      `DELETE FROM users WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar el usuario' });
  }
});

module.exports = router;
