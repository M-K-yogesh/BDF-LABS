const path = require('node:path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function initializeDatabase(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);
  return db;
}

async function openDatabase(
  filename = process.env.DB_PATH || path.join(__dirname, '..', 'books.sqlite')
) {
  const db = await open({
    filename,
    driver: sqlite3.Database
  });
  return initializeDatabase(db);
}

module.exports = { initializeDatabase, openDatabase };
