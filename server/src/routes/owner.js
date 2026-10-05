const router = require('express').Router();
const db = require('../db');
const { wrap, authenticate, authorize, orderBy } = require('../middleware');

router.use(authenticate, authorize('owner'));

router.get('/dashboard', wrap(async (req, res) => {
  const [[store]] = await db.query(
    `SELECT s.id, s.name, s.address, ROUND(AVG(r.rating),1) AS averageRating, COUNT(r.id) AS ratingCount
     FROM stores s LEFT JOIN ratings r ON r.store_id = s.id WHERE s.owner_id = ? GROUP BY s.id`, [req.user.id]);
  if (!store) return res.json({ store: null, raters: [] });
  const sort = orderBy(req.query, { name: 'u.name', email: 'u.email', rating: 'r.rating', date: 'r.updated_at' }, 'date');
  const [raters] = await db.query(
    `SELECT u.id, u.name, u.email, r.rating, r.updated_at AS date
     FROM ratings r JOIN users u ON u.id = r.user_id WHERE r.store_id = ? ${sort}`, [store.id]);
  res.json({ store, raters });
}));

module.exports = router;
