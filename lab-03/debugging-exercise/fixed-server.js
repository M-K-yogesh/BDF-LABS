const express = require('express');
// Fix 1: Correct import path from '../src/databse' to '../src/db'
const { openDatabase } = require('../src/db');

async function start() {
  const db = await openDatabase();
  const app = express();
  app.use(express.json());

  // Fix 2: Table name corrected from 'book' to 'books'
  // Fix 3: Added 'await' before db.all(...) so the Promise resolves to the actual rows array
  app.get('/books', async (req, res, next) => {
    try {
      const books = await db.all('SELECT id, title, author, price FROM books');
      res.status(200).json({ message: 'Books retrieved', data: books });
    } catch (error) {
      next(error);
    }
  });

  // Fix 4: Port conflict fix (EADDRINUSE) - reads PORT from environment variable or defaults to 3001
  // to avoid colliding with the main server running on port 3000. Includes error listener.
  const PORT = Number(process.env.DEBUG_PORT || process.env.PORT || 3001);

  const server = app.listen(PORT, () => {
    console.log(`Fixed exercise server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use (EADDRINUSE). Pass a different port: PORT=3002 node debugging-exercise/fixed-server.js`);
    } else {
      console.error(`Server error: ${err.message}`);
    }
    process.exitCode = 1;
  });

  return { app, server, db };
}

if (require.main === module) {
  start().catch((err) => {
    console.error(`Failed to start fixed server: ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = { start };

