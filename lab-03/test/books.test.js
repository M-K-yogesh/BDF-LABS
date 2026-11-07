const { afterEach, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { createApp } = require('../src/app');
const { initializeDatabase } = require('../src/db');

let db;
let client;

beforeEach(async () => {
  db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await initializeDatabase(db);
  client = request(createApp(db));
});

afterEach(async () => {
  await db.close();
});

async function addBook(title, author, price) {
  const response = await client.post('/books').send({ title, author, price });
  assert.equal(response.status, 201);
  return response.body.data;
}

test('creates a book and rejects invalid bodies with JSON messages', async () => {
  const invalid = await client.post('/books').send({ title: 'The Hobbit', price: 12 });
  assert.equal(invalid.status, 400);
  assert.deepEqual(invalid.body, { message: 'author is required' });

  const missingTitle = await client.post('/books').send({ author: 'Tolkien', price: 12 });
  assert.equal(missingTitle.status, 400);
  assert.deepEqual(missingTitle.body, { message: 'title is required' });

  const nonNumeric = await client.post('/books')
    .send({ title: 'The Hobbit', author: 'Tolkien', price: 'twelve' });
  assert.equal(nonNumeric.status, 400);
  assert.deepEqual(nonNumeric.body, { message: 'price must be a number' });

  const created = await addBook('The Hobbit', 'Tolkien', 12);
  assert.equal(created.title, 'The Hobbit');
});

test('filters by partial title and price range, sorts, and paginates', async () => {
  await addBook('The Hobbit', 'Tolkien', 12);
  await addBook('The Fellowship of the Ring', 'Tolkien', 18);
  await addBook('A Wizard of Earthsea', 'Le Guin', 15);

  const response = await client.get('/books')
    .query({
      search_q: 'the',
      min_price: 10,
      max_price: 20,
      order_by: 'price',
      order: 'DESC',
      limit: 1,
      offset: 0
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0].title, 'The Fellowship of the Ring');
  assert.deepEqual(response.body.pagination, { limit: 1, offset: 0 });
});

test('retrieves single book by id, returning 404 for missing id', async () => {
  const book = await addBook('1984', 'George Orwell', 14);
  const response = await client.get(`/books/${book.id}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.title, '1984');

  const missing = await client.get('/books/9999');
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, { message: 'Book not found' });

  const invalidId = await client.get('/books/invalid');
  assert.equal(invalidId.status, 400);
  assert.deepEqual(invalidId.body, { message: 'id must be a positive integer' });
});

test('updates and deletes books, returning 404 for missing ids', async () => {
  const book = await addBook('Dune', 'Frank Herbert', 20);
  const update = await client.put(`/books/${book.id}`)
    .send({ title: 'Dune Messiah', author: 'Frank Herbert', price: 22 });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.title, 'Dune Messiah');

  const missingUpdate = await client.put('/books/999')
    .send({ title: 'Missing', author: 'Nobody', price: 0 });
  assert.equal(missingUpdate.status, 404);
  assert.deepEqual(missingUpdate.body, { message: 'Book not found' });

  const deletion = await client.delete(`/books/${book.id}`);
  assert.equal(deletion.status, 200);

  const missingDelete = await client.delete(`/books/${book.id}`);
  assert.equal(missingDelete.status, 404);
  assert.deepEqual(missingDelete.body, { message: 'Book not found' });
});

test('returns JSON 400 for malformed JSON and invalid query parameter shapes', async () => {
  const malformedJson = await client.post('/books')
    .set('Content-Type', 'application/json')
    .send('{"title":');
  assert.equal(malformedJson.status, 400);
  assert.deepEqual(malformedJson.body, { message: 'Invalid JSON request body' });

  const repeatedPrice = await client.get('/books?min_price=1&min_price=2');
  assert.equal(repeatedPrice.status, 400);
  assert.deepEqual(repeatedPrice.body, { message: 'min_price must be a number' });

  const reversedPrice = await client.get('/books?min_price=50&max_price=10');
  assert.equal(reversedPrice.status, 400);
  assert.deepEqual(reversedPrice.body, { message: 'min_price must not exceed max_price' });

  const invalidOrderBy = await client.get('/books?order_by=hacked');
  assert.equal(invalidOrderBy.status, 400);
  assert.match(invalidOrderBy.body.message, /order_by must be one of/);

  const invalidOrder = await client.get('/books?order=SIDEWAYS');
  assert.equal(invalidOrder.status, 400);
  assert.deepEqual(invalidOrder.body, { message: 'order must be ASC or DESC' });

  const invalidRoute = await client.get('/not-a-route');
  assert.equal(invalidRoute.status, 404);
  assert.deepEqual(invalidRoute.body, { message: 'Route not found' });
});
