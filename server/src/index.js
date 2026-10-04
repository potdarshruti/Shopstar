require('dotenv').config();
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is not set'); process.exit(1); }
const app = require('./app');
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
