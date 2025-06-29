const express = require('express');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all sign categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await pool.query(
      'SELECT * FROM sign_categories ORDER BY name'
    );

    res.json(categories.rows);
  } catch (error) {
    console.error('Get sign categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get signs by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const signs = await pool.query(
      `SELECT rs.*, sc.name as category_name 
       FROM road_signs rs 
       JOIN sign_categories sc ON rs.category_id = sc.id 
       WHERE rs.category_id = $1 
       ORDER BY rs.name 
       LIMIT $2 OFFSET $3`,
      [categoryId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM road_signs WHERE category_id = $1',
      [categoryId]
    );

    res.json({
      signs: signs.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.rows[0].count / limit),
        total_items: parseInt(countResult.rows[0].count),
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get signs by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all signs (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rs.*, sc.name as category_name 
      FROM road_signs rs 
      JOIN sign_categories sc ON rs.category_id = sc.id
    `;
    let countQuery = `
      SELECT COUNT(*) 
      FROM road_signs rs 
      JOIN sign_categories sc ON rs.category_id = sc.id
    `;
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      const searchCondition = `WHERE rs.name ILIKE $${paramCount} OR rs.description ILIKE $${paramCount} OR sc.name ILIKE $${paramCount}`;
      query += ' ' + searchCondition;
      countQuery += ' ' + searchCondition;
      queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY rs.name LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
    queryParams.push(limit, offset);

    const [signs, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    res.json({
      signs: signs.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.rows[0].count / limit),
        total_items: parseInt(countResult.rows[0].count),
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search signs
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const signs = await pool.query(
      `SELECT rs.*, sc.name as category_name 
       FROM road_signs rs 
       JOIN sign_categories sc ON rs.category_id = sc.id 
       WHERE rs.name ILIKE $1 OR rs.description ILIKE $1 OR rs.meaning ILIKE $1 
       ORDER BY rs.name 
       LIMIT $2`,
      [`%${query}%`, limit]
    );

    res.json(signs.rows);
  } catch (error) {
    console.error('Search signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular signs (most searched/viewed - placeholder for future implementation)
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const signs = await pool.query(
      `SELECT rs.*, sc.name as category_name 
       FROM road_signs rs 
       JOIN sign_categories sc ON rs.category_id = sc.id 
       ORDER BY rs.id 
       LIMIT $1`,
      [limit]
    );

    res.json(signs.rows);
  } catch (error) {
    console.error('Get popular signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single sign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sign = await pool.query(
      `SELECT rs.*, sc.name as category_name 
       FROM road_signs rs 
       JOIN sign_categories sc ON rs.category_id = sc.id 
       WHERE rs.id = $1`,
      [id]
    );

    if (sign.rows.length === 0) {
      return res.status(404).json({ message: 'Sign not found' });
    }

    res.json(sign.rows[0]);
  } catch (error) {
    console.error('Get sign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new sign category
router.post('/categories', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO sign_categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create sign category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a sign category
router.put('/categories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await pool.query(
      'UPDATE sign_categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update sign category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a sign category
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM sign_categories WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete sign category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a sign
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, meaning, image_url, category_id } = req.body;
    const result = await pool.query(
      'UPDATE road_signs SET name = $1, description = $2, meaning = $3, image_url = $4, category_id = $5 WHERE id = $6 RETURNING *',
      [name, description, meaning, image_url, category_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sign not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update sign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a sign
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM road_signs WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sign not found' });
    }
    res.json({ message: 'Sign deleted' });
  } catch (error) {
    console.error('Delete sign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new sign
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, meaning, image_url, category_id } = req.body;
    const result = await pool.query(
      'INSERT INTO road_signs (name, description, meaning, image_url, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, meaning, image_url, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create sign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Image upload endpoint
router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the relative path or URL to the uploaded image
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router; 