const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, superAdminOnly } = require('./auth');

router.get('/', (req, res) => {
  const { team_id } = req.query;
  let query = 'SELECT * FROM players';
  const params = [];
  if (team_id) { query += ' WHERE team_id = ?'; params.push(team_id); }
  query += ' ORDER BY jersey_number ASC, name ASC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', authMiddleware, superAdminOnly, (req, res) => {
  const { team_id, name, position, jersey_number } = req.body;
  if (!team_id || !name?.trim()) return res.status(400).json({ error: 'team_id dhe emri janë të detyrueshëm' });
  const result = db.prepare('INSERT INTO players (team_id, name, position, jersey_number) VALUES (?, ?, ?, ?)').run(team_id, name.trim(), position || null, jersey_number || null);
  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', authMiddleware, superAdminOnly, (req, res) => {
  const { name, position, jersey_number } = req.body;
  db.prepare('UPDATE players SET name = COALESCE(?, name), position = ?, jersey_number = ? WHERE id = ?').run(name?.trim() || null, position || null, jersey_number || null, req.params.id);
  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authMiddleware, superAdminOnly, (req, res) => {
  db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
