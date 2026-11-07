const express = require('express');

const sortableColumns = new Set(['id', 'title', 'author', 'price']);

function parseOptionalPrice(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    (typeof value === 'string' && value.trim() === '') ||
    !Number.isFinite(num)
  ) {
    return { error: `${fieldName} must be a number` };
  }
  return num;
}

function validateBookBody(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const author = typeof body.author === 'string' ? body.author.trim() : '';

  if (!title) {
    return { error: 'title is required' };
  }
  if (!author) {
    return { error: 'author is required' };
  }
  if (typeof body.price !== 'number' || !Number.isFinite(body.price)) {
    return { error: 'price must be a number' };
  }

  return { value: { title, author, price: body.price } };
}

function createApp(db) {
  const app = express();
  app.use(express.json());

  // Task 1, 2, 3: GET /books - search, sort, filter by price range, paginate
  app.get('/books', async (req, res, next) => {
    try {
      const {
        search_q = '',
        order_by = 'id',
        order = 'ASC',
        limit: rawLimit = '10',
        offset: rawOffset = '0'
      } = req.query;

      if (typeof search_q !== 'string') {
        return res.status(400).json({ message: 'search_q must be a string' });
      }
      if (!sortableColumns.has(order_by)) {
        return res.status(400).json({
          message: `order_by must be one of: ${[...sortableColumns].join(', ')}`
        });
      }
      if (typeof order !== 'string' || !['ASC', 'DESC'].includes(order.toUpperCase())) {
        return res.status(400).json({ message: 'order must be ASC or DESC' });
      }

      const limit = Number(rawLimit);
      const offset = Number(rawOffset);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: 'limit must be an integer from 1 to 100' });
      }
      if (!Number.isInteger(offset) || offset < 0) {
        return res.status(400).json({ message: 'offset must be a non-negative integer' });
      }

      const minPrice = parseOptionalPrice(req.query.min_price, 'min_price');
      const maxPrice = parseOptionalPrice(req.query.max_price, 'max_price');
      if (typeof minPrice === 'object') {
        return res.status(400).json({ message: minPrice.error });
      }
      if (typeof maxPrice === 'object') {
        return res.status(400).json({ message: maxPrice.error });
      }
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        return res.status(400).json({ message: 'min_price must not exceed max_price' });
      }

      const conditions = [];
      const params = [];
      if (search_q) {
        conditions.push('title LIKE ?');
        params.push(`%${search_q}%`);
      }

      // Task 3: Price-range filter using BETWEEN or two conditions
      if (minPrice !== undefined && maxPrice !== undefined) {
        conditions.push('price BETWEEN ? AND ?');
        params.push(minPrice, maxPrice);
      } else if (minPrice !== undefined) {
        conditions.push('price >= ?');
        params.push(minPrice);
      } else if (maxPrice !== undefined) {
        conditions.push('price <= ?');
        params.push(maxPrice);
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `
        SELECT id, title, author, price
        FROM books
        ${whereClause}
        ORDER BY ${order_by} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      const books = await db.all(sql, [...params, limit, offset]);
      return res.status(200).json({
        message: 'Books retrieved',
        data: books,
        pagination: { limit, offset }
      });
    } catch (error) {
      return next(error);
    }
  });

  // Task 1, 5: GET /books/:id - retrieve one book by ID
  app.get('/books/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: 'id must be a positive integer' });
      }
      const book = await db.get(
        'SELECT id, title, author, price FROM books WHERE id = ?',
        [id]
      );
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      return res.status(200).json({
        message: 'Book retrieved',
        data: book
      });
    } catch (error) {
      return next(error);
    }
  });

  // Task 1, 4, 5: POST /books - create a new book with validation
  app.post('/books', async (req, res, next) => {
    try {
      const result = validateBookBody(req.body ?? {});
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      const { title, author, price } = result.value;
      const inserted = await db.run(
        'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
        [title, author, price]
      );
      return res.status(201).json({
        message: 'Book created',
        data: { id: inserted.lastID, title, author, price }
      });
    } catch (error) {
      return next(error);
    }
  });

  // Task 1, 5: PUT /books/:id - update existing book
  app.put('/books/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: 'id must be a positive integer' });
      }
      const result = validateBookBody(req.body ?? {});
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      const existing = await db.get('SELECT id FROM books WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const { title, author, price } = result.value;
      await db.run(
        'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
        [title, author, price, id]
      );
      return res.status(200).json({
        message: 'Book updated',
        data: { id, title, author, price }
      });
    } catch (error) {
      return next(error);
    }
  });

  // Task 1, 5: DELETE /books/:id - delete existing book
  app.delete('/books/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: 'id must be a positive integer' });
      }
      const result = await db.run('DELETE FROM books WHERE id = ?', [id]);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      return res.status(200).json({ message: 'Book deleted', data: { id } });
    } catch (error) {
      return next(error);
    }
  });

  // Task 6: Consistent 404 for unknown routes
  app.use((req, res) => {
    return res.status(404).json({ message: 'Route not found' });
  });

  // Task 6: Consistent error handling middleware
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    if (error.status >= 400 && error.status < 500) {
      const message = error.type === 'entity.parse.failed'
        ? 'Invalid JSON request body'
        : error.message;
      return res.status(error.status).json({ message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
