const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, superAdminOnly } = require('./auth');

const MATCH_SELECT = `
  SELECT m.*,
    ht.name as home_team_name, ht.color as home_team_color,
    at.name as away_team_name, at.color as away_team_color,
    wt.name as winner_name
  FROM matches m
  LEFT JOIN teams ht ON m.home_team_id = ht.id
  LEFT JOIN teams at ON m.away_team_id = at.id
  LEFT JOIN teams wt ON m.winner_id = wt.id
`;

function getRoundsWithMatches() {
  const rounds = db.prepare('SELECT * FROM rounds ORDER BY round_number').all();
  return rounds.map(r => ({
    ...r,
    matches: db.prepare(MATCH_SELECT + ' WHERE m.round_id = ? ORDER BY m.is_third_place, m.id').all(r.id)
  }));
}

router.get('/', authMiddleware, (req, res) => {
  res.json(getRoundsWithMatches());
});

router.get('/active', authMiddleware, (req, res) => {
  const round = db.prepare("SELECT * FROM rounds WHERE status = 'aktiv' ORDER BY round_number DESC LIMIT 1").get();
  if (!round) return res.json(null);
  const matches = db.prepare(MATCH_SELECT + ' WHERE m.round_id = ? ORDER BY m.is_third_place, m.id').all(round.id);
  res.json({ ...round, matches });
});

router.put('/:id', authMiddleware, superAdminOnly, (req, res) => {
  const { start_date, end_date } = req.body;
  db.prepare('UPDATE rounds SET start_date = ?, end_date = ? WHERE id = ?').run(start_date || null, end_date || null, req.params.id);
  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(req.params.id);
  res.json(round);
});

router.delete('/:id', authMiddleware, superAdminOnly, (req, res) => {
  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(req.params.id);
  if (!round) return res.status(404).json({ error: 'Raundi nuk u gjet' });
  if (round.status !== 'pending') return res.status(400).json({ error: 'Mund të fshihet vetëm raundi në pritje' });
  db.prepare('DELETE FROM matches WHERE round_id = ?').run(req.params.id);
  db.prepare('DELETE FROM rounds WHERE id = ?').run(req.params.id);
  if (round.round_number > 1) {
    db.prepare("UPDATE rounds SET status = 'aktiv' WHERE round_number = ?").run(round.round_number - 1);
  }
  res.json({ success: true });
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRoundName(teamCount, roundNumber) {
  if (teamCount <= 2) return 'Finalja';
  if (teamCount <= 4) return 'Gjysmëfinale';
  if (teamCount <= 8) return 'Çerekfinale';
  if (teamCount <= 16) return `Raundi i ${roundNumber}-të`;
  return `Raundi i ${roundNumber}-të`;
}

router.post('/draw', authMiddleware, superAdminOnly, (req, res) => {
  const pendingRound = db.prepare("SELECT * FROM rounds WHERE status = 'pending'").get();
  if (pendingRound) return res.status(400).json({ error: 'Ka tashmë një short në pritje. Konfirmoje ose fshije.' });

  const activeRound = db.prepare("SELECT * FROM rounds WHERE status = 'aktiv' ORDER BY round_number DESC LIMIT 1").get();

  if (activeRound) {
    const incomplete = db.prepare("SELECT COUNT(*) as c FROM matches WHERE round_id = ? AND status != 'perfunduar'").get(activeRound.id);
    if (incomplete.c > 0) return res.status(400).json({ error: 'Jo të gjitha ndeshjet e raundeve aktual janë përfunduar' });
    db.prepare("UPDATE rounds SET status = 'perfunduar' WHERE id = ?").run(activeRound.id);
  }

  let activeTeams;
  if (!activeRound) {
    activeTeams = db.prepare("SELECT * FROM teams WHERE status = 'aktiv'").all();
    if (activeTeams.length < 2) return res.status(400).json({ error: 'Nevojiten të paktën 2 ekipe për short' });
  } else {
    const winnerIds = [
      ...db.prepare("SELECT winner_id FROM matches WHERE round_id = ? AND winner_id IS NOT NULL").all(activeRound.id).map(r => r.winner_id)
    ];
    const uniqueWinners = [...new Set(winnerIds)];
    activeTeams = uniqueWinners.map(id => db.prepare('SELECT * FROM teams WHERE id = ?').get(id)).filter(Boolean);
  }

  if (activeTeams.length === 1) {
    db.prepare("UPDATE teams SET status = 'kampion' WHERE id = ?").run(activeTeams[0].id);
    return res.status(400).json({ error: 'Turniri ka përfunduar! Kampioni është zgjedhur.' });
  }

  if (activeTeams.length < 2) return res.status(400).json({ error: 'Nuk ka ekipe të mjaftueshme' });

  const roundNumber = (activeRound?.round_number || 0) + 1;

  if (activeRound?.name === 'Gjysmëfinale') {
    const semiMatches = db.prepare("SELECT * FROM matches WHERE round_id = ? AND is_bye = 0").all(activeRound.id);
    const losers = semiMatches.map(m => m.winner_id === m.home_team_id ? m.away_team_id : m.home_team_id).filter(Boolean);

    const newRound = db.prepare("INSERT INTO rounds (round_number, name, status, draw_done) VALUES (?, 'Finalja', 'pending', 1)").run(roundNumber);

    const shuffledFinals = shuffle(activeTeams);
    const finalMatch = db.prepare("INSERT INTO matches (round_id, home_team_id, away_team_id, status, is_third_place) VALUES (?, ?, ?, 'planifikuar', 0)").run(newRound.lastInsertRowid, shuffledFinals[0].id, shuffledFinals[1].id);

    let thirdMatch = null;
    if (losers.length >= 2) {
      const shuffledLosers = shuffle(losers);
      db.prepare("INSERT INTO matches (round_id, home_team_id, away_team_id, status, is_third_place) VALUES (?, ?, ?, 'planifikuar', 1)").run(newRound.lastInsertRowid, shuffledLosers[0], shuffledLosers[1]);
      losers.forEach(id => db.prepare("UPDATE teams SET status = 'aktiv' WHERE id = ?").run(id));
    }

    const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(newRound.lastInsertRowid);
    const matches = db.prepare(MATCH_SELECT + ' WHERE m.round_id = ? ORDER BY m.is_third_place, m.id').all(newRound.lastInsertRowid);
    return res.json({ round, matches });
  }

  const name = getRoundName(activeTeams.length, roundNumber);
  const shuffled = shuffle(activeTeams);
  const hasBye = shuffled.length % 2 !== 0;
  let byeTeam = hasBye ? shuffled.pop() : null;

  const newRound = db.prepare('INSERT INTO rounds (round_number, name, status, draw_done) VALUES (?, ?, ?, 1)').run(roundNumber, name, 'pending');
  const roundId = newRound.lastInsertRowid;

  for (let i = 0; i < shuffled.length; i += 2) {
    db.prepare("INSERT INTO matches (round_id, home_team_id, away_team_id, status) VALUES (?, ?, ?, 'planifikuar')").run(roundId, shuffled[i].id, shuffled[i + 1].id);
  }

  if (byeTeam) {
    db.prepare("INSERT INTO matches (round_id, home_team_id, winner_id, is_bye, status) VALUES (?, ?, ?, 1, 'perfunduar')").run(roundId, byeTeam.id, byeTeam.id);
  }

  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(roundId);
  const matches = db.prepare(MATCH_SELECT + ' WHERE m.round_id = ? ORDER BY m.is_bye, m.id').all(roundId);
  res.json({ round, matches });
});

router.post('/:id/confirm', authMiddleware, superAdminOnly, (req, res) => {
  const round = db.prepare('SELECT * FROM rounds WHERE id = ?').get(req.params.id);
  if (!round) return res.status(404).json({ error: 'Raundi nuk u gjet' });
  if (round.status !== 'pending') return res.status(400).json({ error: 'Raundi nuk është në pritje' });

  db.prepare("UPDATE rounds SET status = 'aktiv' WHERE id = ?").run(req.params.id);
  if (round.round_number > 1) {
    db.prepare("UPDATE rounds SET status = 'perfunduar' WHERE round_number < ? AND status != 'perfunduar'").run(round.round_number);
  }

  const updated = db.prepare('SELECT * FROM rounds WHERE id = ?').get(req.params.id);
  const matches = db.prepare(MATCH_SELECT + ' WHERE m.round_id = ? ORDER BY m.is_third_place, m.id').all(req.params.id);
  res.json({ ...updated, matches });
});

module.exports = router;
