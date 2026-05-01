const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, superAdminOnly } = require('./auth');

router.get('/', authMiddleware, superAdminOnly, (req, res) => {
  const data = {
    teams: db.prepare('SELECT * FROM teams').all(),
    rounds: db.prepare('SELECT * FROM rounds').all(),
    matches: db.prepare('SELECT * FROM matches').all(),
    users: db.prepare("SELECT id, username, password_hash, role FROM users WHERE role = 'editor'").all(),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  res.setHeader('Content-Disposition', 'attachment; filename="tournament.json"');
  res.json(data);
});

router.post('/import', authMiddleware, superAdminOnly, (req, res) => {
  const { teams, rounds, matches, users } = req.body;
  if (!teams || !rounds || !matches) return res.status(400).json({ error: 'Të dhënat e importit janë të pakompletuara' });

  const importAll = db.transaction(() => {
    db.prepare('DELETE FROM matches').run();
    db.prepare('DELETE FROM rounds').run();
    db.prepare('DELETE FROM teams').run();
    db.prepare("DELETE FROM users WHERE role = 'editor'").run();

    if (teams.length) {
      const ins = db.prepare('INSERT INTO teams (id, name, color, status) VALUES (?, ?, ?, ?)');
      teams.forEach(t => ins.run(t.id, t.name, t.color, t.status));
    }
    if (rounds.length) {
      const ins = db.prepare('INSERT INTO rounds (id, round_number, name, start_date, end_date, status, draw_done) VALUES (?, ?, ?, ?, ?, ?, ?)');
      rounds.forEach(r => ins.run(r.id, r.round_number, r.name, r.start_date, r.end_date, r.status, r.draw_done));
    }
    if (matches.length) {
      const ins = db.prepare('INSERT INTO matches (id, round_id, home_team_id, away_team_id, match_date, match_time, home_score, away_score, home_pen, away_pen, winner_id, is_bye, is_third_place, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      matches.forEach(m => ins.run(m.id, m.round_id, m.home_team_id, m.away_team_id, m.match_date, m.match_time, m.home_score, m.away_score, m.home_pen, m.away_pen, m.winner_id, m.is_bye, m.is_third_place || 0, m.status));
    }
    if (users?.length) {
      const ins = db.prepare("INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, 'editor')");
      users.forEach(u => ins.run(u.id, u.username, u.password_hash));
    }
  });

  importAll();
  res.json({ success: true, message: 'Të dhënat u importuan me sukses' });
});

module.exports = router;
