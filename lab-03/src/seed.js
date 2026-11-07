const { openDatabase } = require('./db');

async function seed() {
  const db = await openDatabase();
  const countRow = await db.get('SELECT COUNT(*) as count FROM books');
  if (countRow.count === 0) {
    const initialBooks = [
      ['The Hobbit', 'J.R.R. Tolkien', 14.99],
      ['The Fellowship of the Ring', 'J.R.R. Tolkien', 19.99],
      ['The Two Towers', 'J.R.R. Tolkien', 18.50],
      ['The Return of the King', 'J.R.R. Tolkien', 21.00],
      ['A Wizard of Earthsea', 'Ursula K. Le Guin', 9.50],
      ['The Tombs of Atuan', 'Ursula K. Le Guin', 11.20],
      ['Dune', 'Frank Herbert', 22.00],
      ['Dune Messiah', 'Frank Herbert', 16.00],
      ['1984', 'George Orwell', 12.99],
      ['Animal Farm', 'George Orwell', 8.99]
    ];

    for (const [title, author, price] of initialBooks) {
      await db.run(
        'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
        [title, author, price]
      );
    }
    console.log(`Seeded database with ${initialBooks.length} sample books.`);
  } else {
    console.log(`Database already contains ${countRow.count} books. Skipping seed.`);
  }
  await db.close();
}

if (require.main === module) {
  seed().catch((error) => {
    console.error('Seeding error:', error.message);
    process.exit(1);
  });
}

module.exports = { seed };
