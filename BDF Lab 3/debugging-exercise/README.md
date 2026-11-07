# Debugging Exercise: Lab 3 Common Errors

This directory contains the faculty debugging exercise reproducing four common Node.js / Express / SQLite bugs and their step-by-step solutions.

Files:
- `broken-server.js`: The original intentionally broken file handed out by faculty.
- `fixed-server.js`: The fully fixed and robust version.

---

## The 4 Bugs: Symptoms, Root Causes & Fixes

### Bug 1: Wrong Import Path (`MODULE_NOT_FOUND`)
- **Symptom / Error message:**
  ```text
  Error: Cannot find module '../src/databse'
  code: 'MODULE_NOT_FOUND'
  ```
- **Broken Code:**
  ```javascript
  const { openDatabase } = require('../src/databse');
  ```
- **Root Cause:**
  Typo in the filename (`databse` instead of `db`). Node.js cannot locate the file in the `src/` directory.
- **Fix:**
  Update the import to target `../src/db`:
  ```javascript
  const { openDatabase } = require('../src/db');
  ```

---

### Bug 2: Table-Name Typo (`no such table`)
- **Symptom / Error message:**
  ```text
  SqliteError: no such table: book
  ```
- **Broken Code:**
  ```javascript
  const books = db.all('SELECT id, title, author, price FROM book');
  ```
- **Root Cause:**
  The SQLite schema defines the table name as `books` (plural noun), but the SQL query mistakenly specifies `book` (singular).
- **Fix:**
  Change the table name in the query to `books`:
  ```javascript
  const books = await db.all('SELECT id, title, author, price FROM books');
  ```

---

### Bug 3: Missing `await` on Asynchronous Database Call
- **Symptom / Behaviour:**
  The HTTP response returned to the client is:
  ```json
  { "data": {} }
  ```
  Instead of an array of book objects, an empty object is returned. Additionally, any runtime database rejection results in an `UnhandledPromiseRejection`.
- **Broken Code:**
  ```javascript
  const books = db.all('SELECT id, title, author, price FROM books');
  res.json({ data: books });
  ```
- **Root Cause:**
  `db.all()` returns a `Promise`. Without the `await` keyword, `books` is a pending `Promise` object rather than the resolved rows array. When Express executes `JSON.stringify({ data: books })`, an unresolved Promise serializes to `{}`.
- **Fix:**
  Prepend `await` inside the `async` handler:
  ```javascript
  const books = await db.all('SELECT id, title, author, price FROM books');
  res.json({ data: books });
  ```

---

### Bug 4: Port Conflict (`EADDRINUSE`)
- **Symptom / Error message:**
  ```text
  Error: listen EADDRINUSE: address already in use :::3000
  code: 'EADDRINUSE'
  ```
- **Broken Code:**
  ```javascript
  app.listen(3000, () => {
    console.log('Broken exercise server listening on port 3000');
  });
  ```
- **Root Cause:**
  Hardcoding port `3000` causes an immediate crash if another process (such as the main API via `npm start`, a dev server, or another student workspace) is already bound to port 3000.
- **Fix:**
  Allow the port to be configured via environment variables (e.g., `PORT` or `DEBUG_PORT`), default to an alternate port such as `3001`, and attach an `error` event handler:
  ```javascript
  const PORT = Number(process.env.DEBUG_PORT || process.env.PORT || 3001);

  const server = app.listen(PORT, () => {
    console.log(`Exercise server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use. Run with PORT=<other_port> node debugging-exercise/fixed-server.js`);
    }
  });
  ```

---

## How to Run & Verify

1. **Test the broken server** (to see Bug 1):
   ```sh
   node debugging-exercise/broken-server.js
   ```

2. **Run the fixed server**:
   ```sh
   node debugging-exercise/fixed-server.js
   ```

3. **Verify via curl or PowerShell**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/books" -Method GET
   ```
