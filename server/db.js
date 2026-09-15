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
try {
  const Database = require('better-sqlite3');
  db = new Database(targetDbPath, { verbose: null });
  console.log(`✅ Connected to SQLite database (better-sqlite3) at ${targetDbPath}`);
} catch (err) {
  console.log('Falling back to sqlite3 standard package...');
  const sqlite3 = require('sqlite3').verbose();
  const rawDb = new sqlite3.Database(targetDbPath);
  
  db = {
    prepare: (sql) => {
      return {
        run: (...params) => new Promise((resolve, reject) => {
          rawDb.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          });
        }),
        get: (...params) => new Promise((resolve, reject) => {
          rawDb.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        all: (...params) => new Promise((resolve, reject) => {
          rawDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        })
      };
    },
    exec: (sql) => new Promise((resolve, reject) => {
      rawDb.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    })
  };
}

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

  if (typeof db.exec === 'function') {
    db.exec(createUsersTable);
    db.exec(createFilesTable);
  } else {
    db.prepare(createUsersTable).run();
    db.prepare(createFilesTable).run();
  }
}

initDb();

module.exports = db;
