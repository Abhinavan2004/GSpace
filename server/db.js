const path = require('path');
const fs = require('fs');

// Path to SQLite database
const rootDbPath = path.resolve(__dirname, '../mydrive.db');
const springBootDbPath = path.resolve(__dirname, '../abhinav/mydrive.db');

// Ensure database file exists from Spring Boot if available
if (!fs.existsSync(rootDbPath) && fs.existsSync(springBootDbPath)) {
  fs.copyFileSync(springBootDbPath, rootDbPath);
  console.log('✅ Copied existing SQLite database from abhinav/mydrive.db to mydrive.db');
}

const targetDbPath = fs.existsSync(rootDbPath) ? rootDbPath : (fs.existsSync(springBootDbPath) ? springBootDbPath : rootDbPath);

let db;
let isBetterSqlite = false;

try {
  const Database = require('better-sqlite3');
  db = new Database(targetDbPath, { verbose: null });
  isBetterSqlite = true;
  console.log(`✅ Connected to SQLite database (better-sqlite3) at ${targetDbPath}`);
} catch (err) {
  console.log('Falling back to sqlite3 standard package...');
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(targetDbPath);
}

// Unified db helper interface
const query = {
  get: (sql, params = []) => {
    if (isBetterSqlite) {
      return db.prepare(sql).get(...params);
    }
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
  },

  all: (sql, params = []) => {
    if (isBetterSqlite) {
      return db.prepare(sql).all(...params);
    }
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  },

  run: (sql, params = []) => {
    if (isBetterSqlite) {
      const info = db.prepare(sql).run(...params);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    }
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
      });
    });
  },

  exec: (sql) => {
    if (isBetterSqlite) {
      return db.exec(sql);
    }
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
  }
};

// Initialize tables if they don't exist
function initDb() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createFilesTable = `
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mimetype TEXT,
      size INTEGER,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
  `;

  query.exec(createUsersTable);
  query.exec(createFilesTable);
}

initDb();

module.exports = query;
