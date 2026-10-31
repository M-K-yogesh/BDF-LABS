require("dotenv").config();

const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = process.env.DB_PATH || "./database/books.db";



let db;

// Open the database and start the server only after the connection succeeds.
async function initializeDBAndServer() {
  try {
    const databasePath = path.resolve(__dirname, DB_PATH);
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL CHECK(price >= 0),
        pages INTEGER NOT NULL CHECK(pages > 0)
      );
    `);

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`SQLite database connected: ${databasePath}`);
    });
  } catch (error) {
    console.error("Unable to initialize database or start server:", error.message);
    process.exit(1);
  }
}

function isValidBook(book) {
  return book &&
    typeof book.title === "string" && book.title.trim() !== "" &&
    typeof book.author === "string" && book.author.trim() !== "" &&
    Number.isInteger(Number(book.price)) && Number(book.price) >= 0 &&
    Number.isInteger(Number(book.pages)) && Number(book.pages) > 0;
}

// GET /books/ - Retrieve all books.
app.get("/books/", async (request, response) => {
  try {
    const books = await db.all("SELECT * FROM book ORDER BY id;");
    response.status(200).json(books);
  } catch (error) {
    response.status(500).json({ error: "Failed to retrieve books." });
  }
});

// GET /books/:bookId/ - Retrieve one book by ID.
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    if (!Number.isInteger(Number(bookId)) || Number(bookId) <= 0) {
      return response.status(400).json({ error: "bookId must be a positive integer." });
    }

    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) {
      return response.status(404).json({ error: "Book not found." });
    }
    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({ error: "Failed to retrieve the book." });
  }
});

// POST /books/ - Add a new book.
app.post("/books/", async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;
    if (!isValidBook({ title, author, price, pages })) {
      return response.status(400).json({
        error: "Provide a non-empty title and author, a non-negative integer price, and a positive integer pages value."
      });
    }

    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
      [title.trim(), author.trim(), Number(price), Number(pages)]
    );
    const newBook = await db.get("SELECT * FROM book WHERE id = ?;", [result.lastID]);
    response.status(201).json(newBook);
  } catch (error) {
    response.status(500).json({ error: "Failed to add the book." });
  }
});

// PUT /books/:bookId/ - Update all editable fields of a book.
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    if (!Number.isInteger(Number(bookId)) || Number(bookId) <= 0) {
      return response.status(400).json({ error: "bookId must be a positive integer." });
    }
    if (!isValidBook({ title, author, price, pages })) {
      return response.status(400).json({
        error: "Provide a non-empty title and author, a non-negative integer price, and a positive integer pages value."
      });
    }

    const existingBook = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!existingBook) {
      return response.status(404).json({ error: "Book not found." });
    }

    await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
      [title.trim(), author.trim(), Number(price), Number(pages), bookId]
    );
    const updatedBook = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    response.status(200).json(updatedBook);
  } catch (error) {
    response.status(500).json({ error: "Failed to update the book." });
  }
});

// DELETE /books/:bookId/ - Delete a book by ID.
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    if (!Number.isInteger(Number(bookId)) || Number(bookId) <= 0) {
      return response.status(400).json({ error: "bookId must be a positive integer." });
    }

    const existingBook = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!existingBook) {
      return response.status(404).json({ error: "Book not found." });
    }

    await db.run("DELETE FROM book WHERE id = ?;", [bookId]);
    response.status(200).json({ message: "Book deleted successfully." });
  } catch (error) {
    response.status(500).json({ error: "Failed to delete the book." });
  }
});

// Handle invalid JSON and unknown routes.
app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return response.status(400).json({ error: "Invalid JSON body." });
  }
  next(error);
});

app.use((request, response) => {
  response.status(404).json({ error: "Route not found." });
});

initializeDBAndServer();
