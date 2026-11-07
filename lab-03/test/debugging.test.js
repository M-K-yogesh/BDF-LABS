const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { start } = require('../debugging-exercise/fixed-server');

test('fixed exercise server starts and serves GET /books correctly', async () => {
  process.env.DEBUG_PORT = '3099';
  const { app, server, db } = await start();

  try {
    const response = await request(app).get('/books');
    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Books retrieved');
    assert.equal(Array.isArray(response.body.data), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
});

