# Lab 2: SQLite database and CRUD routes

**Name:** M.K.YOGESH<br>
**Registration number:** 252U1R9085<br>
**Section:** CSE GEN AI 2B

**Live link:** Pending deployment. Railway sign-in succeeded, but the account dashboard reports that its trial has expired and requires an upgrade before new deployments can run. No public URL exists yet; it will be added here after Railway access is reactivated and deployment succeeds.

## How to run

Requirements: Node.js LTS and npm.

```powershell
npm install
Copy-Item .env.example .env
npm run seed
npm start
```

The server listens on the configured port (defaults to `3000`). Optional environment variables are:

| Variable | Description |
|---|---|
| `PORT` | HTTP port |
| `DB_PATH` | SQLite database file path, relative to this project folder |

Do not commit `.env`; `.env.example` contains only non-secret defaults. `npm run dev` starts the server with nodemon during development.

## Railway deployment

The project includes [`railway.json`](railway.json), which seeds the database at startup and checks `/books/` for service health. To deploy after Railway access is available:

1. Create a Railway project from the `M-K-yogesh/BDF-LABS` GitHub repository and select `main`.
2. Set the service root directory to `/BDF LAB 2`.
3. Add a Railway volume mounted at `/data` and set `DB_PATH` to `/data/books.db` in the service variables. This keeps SQLite changes across deployments.
4. Generate a public domain in the service's Networking settings. Once the service is healthy, replace the pending live-link note above with that URL.

Railway project creation and database persistence require an active Railway plan; no billing plan was changed as part of this setup.

## Endpoints

Base URL: `http://localhost:<PORT>`

| Method | Path | Description |
|---|---|---|
| GET | `/books/` | Return all books. |
| GET | `/books/:bookId/` | Return one book by ID. |
| POST | `/books/` | Create a book and return it with its generated ID (`201`). |
| PUT | `/books/:bookId/` | Replace all editable fields of an existing book (`200`). |
| DELETE | `/books/:bookId/` | Delete a book by ID (`200`). |

POST and PUT require a JSON body with `title`, `author`, `price` (non-negative integer), and `pages` (positive integer). Values are bound with SQLite placeholders rather than concatenated into SQL. Invalid input returns `400`; a missing book returns `404`.

Import [`postman/Lab_02_SQLite_CRUD.postman_collection.json`](postman/Lab_02_SQLite_CRUD.postman_collection.json) into Postman and set `baseUrl` to the running server URL.

## Screenshots

These screenshots show successful responses from the running API and the database state after the CRUD sequence. They were captured from a browser-based HTTP check because the Postman desktop app is not installed in this environment. Import the collection above to reproduce the requests in Postman if Postman-UI screenshots are specifically required.

![GET all books](screenshots/get-all-books.png)

![GET book by ID](screenshots/get-one-book.png)

![POST a book](screenshots/post-book.png)

![PUT update a book](screenshots/put-book.png)

![DELETE a book](screenshots/delete-book.png)

![Database state after CRUD](screenshots/database-after-crud.png)

## Notes

- The SQLite database is `database/books.db`. `npm run seed` creates the table and inserts ten sample books only when the table is empty.
- The seed command resolves `DB_PATH` relative to the project root, matching the API server configuration.
- POST creates a new resource; PUT replaces the editable fields of the resource identified by the URL.
- Awaiting database calls ensures each response is sent only after the operation has completed and its result is known.
- SQL injection occurs when untrusted input is interpreted as part of SQL syntax. Placeholders bind values as data, not executable SQL.
