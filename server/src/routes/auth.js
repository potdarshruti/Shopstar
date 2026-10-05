const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validate } = require('../validate');
const { wrap, authenticate } = require('../middleware');

const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, address: u.address, role: u.role });

// Public signup always creates a normal user
router.post('/signup', wrap(async (req, res) => {
  const errors = validate(req.body, ['name', 'email', 'address', 'password']);
  if (errors) return res.status(400).json({ message: 'Validation failed', errors });
  const { name, email, address, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.query(
    'INSERT INTO users (name, email, password_hash, address, role) VALUES (?,?,?,?,?)',
    [name.trim(), email.toLowerCase(), hash, address.trim(), 'user']);
  const user = { id: r.insertId, name: name.trim(), email: email.toLowerCase(), address: address.trim(), role: 'user' };
  res.status(201).json({ token: sign(user), user });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const e = String(email).toLowerCase();
  // A store owner can log in with their own email OR with the email of the store they own.
  const [candidates] = await db.query(
    `SELECT * FROM users WHERE email = ?
     UNION
     SELECT u.* FROM stores s JOIN users u ON u.id = s.owner_id WHERE s.email = ? AND u.role = 'owner'`, [e, e]);
  let u = null;
  for (const c of candidates) {
    if (await bcrypt.compare(password, c.password_hash)) { u = c; break; }
  }
  if (!u) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(u), user: publicUser(u) });
}));

router.get('/me', authenticate, wrap(async (req, res) => {
  const [[u]] = await db.query('SELECT id,name,email,address,role FROM users WHERE id = ?', [req.user.id]);
  if (!u) return res.status(401).json({ message: 'User no longer exists' });
  res.json(u);
}));

router.put('/password', authenticate, wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const errors = validate({ password: newPassword }, ['password']);
  if (errors) return res.status(400).json({ message: 'Validation failed', errors: { newPassword: errors.password } });
  const [[u]] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!u || !(await bcrypt.compare(currentPassword || '', u.password_hash)))
    return res.status(400).json({ message: 'Validation failed', errors: { currentPassword: 'Current password is incorrect' } });
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(newPassword, 10), req.user.id]);
  res.json({ message: 'Password updated' });
}));

module.exports = router;
