const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, superAdminOnly } = require('./auth');

router.get('/', (req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY name').all();
  res.json(teams);
});

router.post('/', authMiddleware, superAdminOnly, (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Emri i ekipit është i detyrueshëm' });
  const exists = db.prepare('SELECT id FROM teams WHERE name = ?').get(name.trim());
  if (exists) return res.status(400).json({ error: 'Ekipi ekziston tashmë' });
  const result = db.prepare('INSERT INTO teams (name, color, status) VALUES (?, ?, ?)').run(name.trim(), color || '#3b82f6', 'aktiv');
  res.json(db.prepare('SELECT * FROM teams WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', authMiddleware, superAdminOnly, (req, res) => {
  const { name, color, status } = req.body;
  if (name !== undefined && !name?.trim()) return res.status(400).json({ error: 'Emri nuk mund të jetë bosh' });
  db.prepare('UPDATE teams SET name = COALESCE(?, name), color = COALESCE(?, color), status = COALESCE(?, status) WHERE id = ?')
    .run(name?.trim() || null, color || null, status || null, req.params.id);
  res.json(db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authMiddleware, superAdminOnly, (req, res) => {
  const matchCount = db.prepare('SELECT COUNT(*) as c FROM matches').get();
  if (matchCount.c > 0) return res.status(400).json({ error: 'Nuk mund të fshihet ekipi pasi turniri ka filluar' });
  db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
