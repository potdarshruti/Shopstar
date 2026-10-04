const router = require('express').Router();
const db = require('../db');
const { wrap, authenticate, authorize, orderBy } = require('../middleware');
const { SCORE_SQL, GLOBAL_JOIN } = require('../ranking');

router.use(authenticate, authorize('user'));

router.get('/', wrap(async (req, res) => {
  const where = [], params = [req.user.id];
  if (req.query.name) { where.push('s.name LIKE ?'); params.push(`%${req.query.name}%`); }
  if (req.query.address) { where.push('s.address LIKE ?'); params.push(`%${req.query.address}%`); }
  const sort = orderBy(req.query, { name: 's.name', address: 's.address', rating: 'rating', myRating: 'myRating', score: 'score' }, 'name');
  const [rows] = await db.query(
    `SELECT s.id, s.name, s.address, ROUND(AVG(r.rating),1) AS rating, COUNT(r.id) AS ratingCount,
            ${SCORE_SQL} AS score, MAX(m.rating) AS myRating
     FROM stores s ${GLOBAL_JOIN}
     LEFT JOIN ratings r ON r.store_id = s.id
     LEFT JOIN ratings m ON m.store_id = s.id AND m.user_id = ?
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} GROUP BY s.id, g.c ${sort}`, params);
  res.json(rows);
}));

// Submit or modify a rating (one per user per store)
router.put('/:id/rating', wrap(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
  const [[store]] = await db.query('SELECT id FROM stores WHERE id = ?', [req.params.id]);
  if (!store) return res.status(404).json({ message: 'Store not found' });
  await db.query(
    `INSERT INTO ratings (user_id, store_id, rating) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating)`, [req.user.id, store.id, rating]);
  res.json({ message: 'Rating saved', rating });
}));

module.exports = router;
