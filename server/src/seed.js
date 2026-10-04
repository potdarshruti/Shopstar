// Creates the first system administrator (run once after importing schema.sql)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

(async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@storerating.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const [[exists]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) console.log('Admin already exists:', email);
  else {
    await db.query('INSERT INTO users (name, email, password_hash, address, role) VALUES (?,?,?,?,?)',
      ['System Administrator Account', email, await bcrypt.hash(password, 10), 'Head Office', 'admin']);
    console.log(`Admin created -> ${email} / ${password}`);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
