require("dotenv").config();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function seedDatabase() {
  const dbPath = path.resolve(__dirname, "..", process.env.DB_PATH || "./database/books.db");
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL CHECK(price >= 0),
        pages INTEGER NOT NULL CHECK(pages > 0)
      );
    `);

    const count = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (count.count === 0) {
      const sampleBooks = [
        ["The Alchemist", "Paulo Coelho", 250, 208],
        ["Wings of Fire", "A. P. J. Abdul Kalam", 180, 180],
        ["Atomic Habits", "James Clear", 450, 320],
        ["The Hobbit", "J. R. R. Tolkien", 399, 310],
        ["Clean Code", "Robert C. Martin", 650, 464],
        ["Deep Work", "Cal Newport", 350, 296],
        ["Ikigai", "Hector Garcia and Francesc Miralles", 299, 194],
        ["Rich Dad Poor Dad", "Robert Kiyosaki", 275, 336],
        ["Think and Grow Rich", "Napoleon Hill", 220, 238],
        ["The Pragmatic Programmer", "Andrew Hunt and David Thomas", 720, 352]
      ];

      const insert = await db.prepare(
        "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);"
      );
      try {
        for (const book of sampleBooks) await insert.run(book);
      } finally {
        await insert.finalize();
      }
      console.log("Inserted 10 sample books.");
    } else {
      console.log(`Database already contains ${count.count} books; seed skipped.`);
    }
  } finally {
    await db.close();
  }

  console.log(`Database ready: ${dbPath}`);
}

seedDatabase().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
