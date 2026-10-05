const jwt = require('jsonwebtoken');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Access denied' });

// Only whitelisted columns can reach ORDER BY (prevents SQL injection).
function orderBy(query, allowed, fallback) {
  const col = allowed[query.sortBy] || allowed[fallback];
  const dir = String(query.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${col} ${dir}`;
}

function errorHandler(err, req, res, next) {
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = { wrap, authenticate, authorize, orderBy, errorHandler };
