const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 1. Force absolute path resolution relative to this file's location
// This file is in backend/src/database, so we go up 3 levels to reach HoneySwarm/
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const DB_DIR = path.join(PROJECT_ROOT, 'data');
const DB_FILE = 'honeyswarm.db';
const DB_PATH = path.join(DB_DIR, DB_FILE);

function initDB() {
  try {
    // 2. Ensure the 'data' directory exists at the project root
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
      console.log(`[Database] Created missing directory: ${DB_DIR}`);
    }

    console.log(`[Database] Connecting to absolute path: ${DB_PATH}`);
    const db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'defender',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        visitor_id TEXT,
        session_type TEXT DEFAULT 'normal',
        routing_stage TEXT DEFAULT 'observe',
        threat_score INTEGER DEFAULT 0,
        confidence REAL DEFAULT 0.0,
        status TEXT DEFAULT 'active',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        action TEXT,
        endpoint TEXT,
        description TEXT,
        severity TEXT DEFAULT 'info',
        source TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS simulation_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        state_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS threat_intelligence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        objective_estimate TEXT,
        skill_estimate TEXT,
        threat_summary TEXT,
        confidence REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS decoys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        decoy_type TEXT,
        resource_name TEXT,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        report_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    `);

    console.log('[Database] SQLite initialized successfully.');
    return db;
  } catch (error) {
    console.error('[Database] CRITICAL ERROR initializing SQLite:', error.message);
    console.error('[Database] If this is a native build error, better-sqlite3 may have failed to compile.');
    return null;
  }
}

module.exports = initDB;