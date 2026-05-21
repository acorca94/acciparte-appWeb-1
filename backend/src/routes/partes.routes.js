const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const HORAS_VALIDAS = [
  '00:00 - 02:00', '02:00 - 04:00', '04:00 - 06:00', '06:00 - 08:00',
  '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00',
  '16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00', '22:00 - 00:00',
];

// GET /api/submissions
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.nombre, s.apellidos, s.lugar, s.hora_accidente, s.created_at,
              u.email AS created_by
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.tenantId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch submissions' });
  }
});

// GET /api/submissions/meta/horas
router.get('/meta/horas', (_req, res) => {
  res.json(HORAS_VALIDAS);
});

// GET /api/submissions/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM submissions WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch submission' });
  }
});

// POST /api/submissions
router.post(
  '/',
  [
    body('nombre').trim().notEmpty().isLength({ max: 150 }),
    body('apellidos').trim().notEmpty().isLength({ max: 150 }),
    body('lugar').trim().notEmpty().isLength({ max: 200 }),
    body('hora_accidente').trim().isIn(HORAS_VALIDAS).withMessage('Franja horaria no válida'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, apellidos, lugar, hora_accidente } = req.body;
    const { userId, tenantId } = req.user;

    try {
      const { rows } = await db.query(
        `INSERT INTO submissions (tenant_id, user_id, nombre, apellidos, lugar, hora_accidente)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [tenantId, userId, nombre, apellidos, lugar, hora_accidente]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not save submission' });
    }
  }
);

// DELETE /api/submissions/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM submissions WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Could not delete submission' });
  }
});

module.exports = router;
