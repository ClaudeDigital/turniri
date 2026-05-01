const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../tournament.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor'
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    status TEXT NOT NULL DEFAULT 'aktiv'
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    draw_done INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id INTEGER NOT NULL,
    home_team_id INTEGER,
    away_team_id INTEGER,
    match_date TEXT,
    match_time TEXT,
    home_score INTEGER,
    away_score INTEGER,
    home_pen INTEGER,
    away_pen INTEGER,
    winner_id INTEGER,
    is_bye INTEGER NOT NULL DEFAULT 0,
    is_third_place INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planifikuar',
    FOREIGN KEY (round_id) REFERENCES rounds(id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id),
    FOREIGN KEY (winner_id) REFERENCES teams(id)
  );
`);

const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES ('admin', ?, 'superadmin')").run(hash);
  console.log('Admin seeded: admin / admin123');
}

module.exports = db;
