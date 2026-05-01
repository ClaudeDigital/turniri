const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authMiddleware, superAdminOnly } = require('./auth');

router.get('/', authMiddleware, superAdminOnly, (req, res) => {
  const users = db.prepare("SELECT id, username, role FROM users WHERE role = 'editor' ORDER BY username").all();
  res.json(users);
});

router.post('/', authMiddleware, superAdminOnly, (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ error: 'Emri dhe fjalëkalimi janë të detyrueshëm' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (exists) return res.status(400).json({ error: 'Ky emër përdoruesi ekziston tashmë' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'editor')").run(username.trim(), hash);
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json(user);
});

router.delete('/:id', authMiddleware, superAdminOnly, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Përdoruesi nuk u gjet' });
  if (user.role === 'superadmin') return res.status(400).json({ error: 'Nuk mund të fshihet super admini' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
