const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, superAdminOnly } = require('./auth');

const MATCH_SELECT = `
  SELECT m.*,
    ht.name as home_team_name, ht.color as home_team_color,
    at.name as away_team_name, at.color as away_team_color,
    wt.name as winner_name,
    r.name as round_name, r.round_number
  FROM matches m
  LEFT JOIN teams ht ON m.home_team_id = ht.id
  LEFT JOIN teams at ON m.away_team_id = at.id
  LEFT JOIN teams wt ON m.winner_id = wt.id
  LEFT JOIN rounds r ON m.round_id = r.id
`;

router.get('/', (req, res) => {
  const { round_id, date, status, limit } = req.query;
  let query = MATCH_SELECT + ' WHERE 1=1';
  const params = [];
  if (round_id) { query += ' AND m.round_id = ?'; params.push(round_id); }
  if (date) { query += ' AND m.match_date = ?'; params.push(date); }
  if (status) { query += ' AND m.status = ?'; params.push(status); }
  query += ' ORDER BY m.match_date ASC, m.match_time ASC, m.id ASC';
  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
  res.json(db.prepare(query).all(...params));
});

router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.json(db.prepare(MATCH_SELECT + " WHERE m.match_date = ? AND m.is_bye = 0 ORDER BY m.match_time").all(today));
});

router.get('/upcoming', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.json(db.prepare(MATCH_SELECT + " WHERE m.match_date > ? AND m.is_bye = 0 ORDER BY m.match_date, m.match_time LIMIT 10").all(today));
});

router.get('/recent', (req, res) => {
  res.json(db.prepare(MATCH_SELECT + " WHERE m.status = 'perfunduar' AND m.is_bye = 0 ORDER BY m.match_date DESC, m.id DESC LIMIT 20").all());
});

router.post('/', authMiddleware, superAdminOnly, (req, res) => {
  const { round_id, home_team_id, away_team_id, match_date, match_time, is_third_place } = req.body;
  if (!round_id || !home_team_id || !away_team_id) return res.status(400).json({ error: 'round_id, home_team_id dhe away_team_id janë të detyrueshëm' });
  if (home_team_id === away_team_id) return res.status(400).json({ error: 'Ekipet duhet të jenë të ndryshme' });
  const result = db.prepare(
    "INSERT INTO matches (round_id, home_team_id, away_team_id, match_date, match_time, is_third_place, status) VALUES (?, ?, ?, ?, ?, ?, 'planifikuar')"
  ).run(round_id, home_team_id, away_team_id, match_date || null, match_time || null, is_third_place ? 1 : 0);
  const match = db.prepare(MATCH_SELECT + ' WHERE m.id = ?').get(result.lastInsertRowid);
  res.json(match);
});

router.put('/:id', authMiddleware, (req, res) => {
  const { home_score, away_score, home_pen, away_pen, match_date, match_time } = req.body;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Ndeshja nuk u gjet' });

  let winner_id = match.winner_id;
  let status = match.status;

  if (home_score !== null && home_score !== undefined && away_score !== null && away_score !== undefined) {
    const hs = parseInt(home_score);
    const as_ = parseInt(away_score);
    status = 'perfunduar';
    if (hs > as_) {
      winner_id = match.home_team_id;
    } else if (as_ > hs) {
      winner_id = match.away_team_id;
    } else {
      const hp = parseInt(home_pen) || 0;
      const ap = parseInt(away_pen) || 0;
      winner_id = hp >= ap ? match.home_team_id : match.away_team_id;
    }
    if (winner_id === match.home_team_id && match.away_team_id) {
      db.prepare("UPDATE teams SET status = 'eliminuar' WHERE id = ?").run(match.away_team_id);
    } else if (winner_id === match.away_team_id && match.home_team_id) {
      db.prepare("UPDATE teams SET status = 'eliminuar' WHERE id = ?").run(match.home_team_id);
    }
  }

  db.prepare(`
    UPDATE matches SET
      home_score = ?, away_score = ?,
      home_pen = ?, away_pen = ?,
      winner_id = ?, status = ?,
      match_date = COALESCE(?, match_date),
      match_time = COALESCE(?, match_time)
    WHERE id = ?
  `).run(
    home_score ?? match.home_score,
    away_score ?? match.away_score,
    home_pen !== undefined ? home_pen : null,
    away_pen !== undefined ? away_pen : null,
    winner_id, status,
    match_date || null, match_time || null,
    req.params.id
  );

  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(match.round_id);
  if (round?.name === 'Finalja' && status === 'perfunduar') {
    const incomplete = db.prepare("SELECT COUNT(*) as c FROM matches WHERE round_id = ? AND status != 'perfunduar'").get(match.round_id);
    if (incomplete.c === 0) {
      const finalMatch = db.prepare("SELECT * FROM matches WHERE round_id = ? AND is_third_place = 0 AND is_bye = 0").get(match.round_id);
      if (finalMatch?.winner_id) {
        db.prepare("UPDATE teams SET status = 'kampion' WHERE id = ?").run(finalMatch.winner_id);
        db.prepare("UPDATE rounds SET status = 'perfunduar' WHERE id = ?").run(match.round_id);
      }
    }
  }

  res.json(db.prepare(MATCH_SELECT + ' WHERE m.id = ?').get(req.params.id));
});

router.delete('/:id', authMiddleware, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Ndeshja nuk u gjet' });
  db.prepare('DELETE FROM matches WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
