const express = require('express');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

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

module.exports = router; 