const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const BASE = '/ngucatinderondeshmoret';
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

app.use(`${BASE}/api/auth`, require('./routes/auth'));
app.use(`${BASE}/api/teams`, require('./routes/teams'));
app.use(`${BASE}/api/matches`, require('./routes/matches'));
app.use(`${BASE}/api/rounds`, require('./routes/rounds'));
app.use(`${BASE}/api/users`, require('./routes/users'));
app.use(`${BASE}/api/export`, require('./routes/export'));

const logoSrc = path.join(__dirname, '../client/public/logo.jpg');
app.get(`${BASE}/logo.jpg`, (req, res) => {
  if (fs.existsSync(logoSrc)) return res.sendFile(logoSrc);
  res.status(404).send('Not found');
});

const distPath = path.join(__dirname, '../client/dist');
app.use(BASE, express.static(distPath));

app.get(`${BASE}`, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.get(`${BASE}/*`, (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.get('/', (req, res) => res.redirect(BASE));

app.listen(PORT, () => {
  console.log(`Turniri running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}${BASE}`);
});
