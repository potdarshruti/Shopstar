const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { validate } = require('../validate');
const { wrap, authenticate, authorize, orderBy } = require('../middleware');
const { SCORE_SQL, GLOBAL_JOIN } = require('../ranking');

router.use(authenticate, authorize('admin'));

router.get('/stats', wrap(async (req, res) => {
  const [[row]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM stores) AS stores,
            (SELECT COUNT(*) FROM ratings) AS ratings`);
  res.json(row);
}));

router.post('/users', wrap(async (req, res) => {
  const errors = validate(req.body, ['name', 'email', 'address', 'password']) || {};
  if (!['admin', 'user', 'owner'].includes(req.body.role)) errors.role = 'Choose a role';
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });
  const { name, email, address, password, role } = req.body;
  const [r] = await db.query(
    'INSERT INTO users (name, email, password_hash, address, role) VALUES (?,?,?,?,?)',
    [name.trim(), email.toLowerCase(), await bcrypt.hash(password, 10), address.trim(), role]);
  res.status(201).json({ id: r.insertId });
}));

const likeFilters = (q, map) => {
  const where = [], params = [];
  for (const [key, col] of Object.entries(map)) {
    if (q[key]) { where.push(`${col} LIKE ?`); params.push(`%${q[key]}%`); }
  }
  return { where, params };
};

const OWNER_RATING = `(SELECT ROUND(AVG(r.rating),1) FROM ratings r JOIN stores s ON s.id = r.store_id WHERE s.owner_id = u.id)`;

router.get('/users', wrap(async (req, res) => {
  const { where, params } = likeFilters(req.query, { name: 'u.name', email: 'u.email', address: 'u.address' });
  if (['admin', 'user', 'owner'].includes(req.query.role)) { where.push('u.role = ?'); params.push(req.query.role); }
  const sort = orderBy(req.query, { name: 'u.name', email: 'u.email', address: 'u.address', role: 'u.role' }, 'name');
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.address, u.role, ${OWNER_RATING} AS rating
     FROM users u ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${sort}`, params);
  res.json(rows);
}));

router.get('/users/:id', wrap(async (req, res) => {
  const [[u]] = await db.query(
    `SELECT u.id, u.name, u.email, u.address, u.role,
            IF(u.role = 'owner', ${OWNER_RATING}, NULL) AS rating
     FROM users u WHERE u.id = ?`, [req.params.id]);
  if (!u) return res.status(404).json({ message: 'User not found' });
  res.json(u);
}));

router.post('/stores', wrap(async (req, res) => {
  const errors = validate(req.body, ['name', 'email', 'address']) || {};
  const { name, email, address, ownerId } = req.body;
  if (ownerId) {
    const [[o]] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'owner'", [ownerId]);
    if (!o) errors.ownerId = 'Select a valid store owner';
  }
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });
  try {
    const [r] = await db.query('INSERT INTO stores (name, email, address, owner_id) VALUES (?,?,?,?)',
      [name.trim(), email.toLowerCase(), address.trim(), ownerId || null]);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY' && /owner_id/.test(e.message))
      return res.status(409).json({ message: 'Validation failed', errors: { ownerId: 'This owner already has a store' } });
    throw e;
  }
}));

router.get('/stores', wrap(async (req, res) => {
  const { where, params } = likeFilters(req.query, { name: 's.name', email: 's.email', address: 's.address' });
  const sort = orderBy(req.query, { name: 's.name', email: 's.email', address: 's.address', rating: 'rating', score: 'score' }, 'name');
  const [rows] = await db.query(
    `SELECT s.id, s.name, s.email, s.address, ROUND(AVG(r.rating),1) AS rating, ${SCORE_SQL} AS score
     FROM stores s ${GLOBAL_JOIN} LEFT JOIN ratings r ON r.store_id = s.id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} GROUP BY s.id, g.c ${sort}`, params);
  res.json(rows);
}));

// Owners without a store, used by the "add store" form
router.get('/available-owners', wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email FROM users u LEFT JOIN stores s ON s.owner_id = u.id
     WHERE u.role = 'owner' AND s.id IS NULL ORDER BY u.name`);
  res.json(rows);
}));

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Analytics: top stores (weighted), most active users, ratings per day, rating distribution
router.get('/analytics', wrap(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);

  const [topStores] = await db.query(
    `SELECT s.id, s.name, s.address, ROUND(AVG(r.rating),1) AS rating, COUNT(r.id) AS ratingCount, ${SCORE_SQL} AS score
     FROM stores s ${GLOBAL_JOIN} LEFT JOIN ratings r ON r.store_id = s.id
     GROUP BY s.id, g.c ORDER BY score DESC, ratingCount DESC, s.name LIMIT 5`);

  const [activeUsers] = await db.query(
    `SELECT u.id, u.name, u.email, COUNT(r.id) AS ratingCount, ROUND(AVG(r.rating),1) AS avgGiven
     FROM users u JOIN ratings r ON r.user_id = u.id
     GROUP BY u.id ORDER BY ratingCount DESC, u.name LIMIT 5`);

  const [dayRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS c FROM ratings
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY d`, [days - 1]);
  const counts = new Map(dayRows.map((r) => [r.d, Number(r.c)]));
  const perDay = [];
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0); cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = ymd(cursor);
    perDay.push({ day: key, count: counts.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const [distRows] = await db.query('SELECT rating, COUNT(*) AS c FROM ratings GROUP BY rating');
  const distribution = [1, 2, 3, 4, 5].map((n) => ({ rating: n, count: Number((distRows.find((r) => r.rating === n) || {}).c || 0) }));

  res.json({ topStores, activeUsers, perDay, distribution });
}));

module.exports = router;
