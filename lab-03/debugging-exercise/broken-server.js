const express = require('express');
const { openDatabase } = require('../src/databse');

async function start() {
  const db = await openDatabase();
  const app = express();

  app.get('/books', async (req, res) => {
    const books = db.all('SELECT id, title, author, price FROM book');
    res.json({ data: books });
  });

  app.listen(3000, () => {
    console.log('Broken exercise server listening on port 3000');
  });
}

start();
