require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

// API data changes often (stores, ratings), so never let the browser reuse an old response
app.set('etag', false);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/owner', require('./routes/owner'));
app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

module.exports = app;
