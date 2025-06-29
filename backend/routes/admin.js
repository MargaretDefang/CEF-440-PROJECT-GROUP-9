const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Test admin endpoint
router.get('/test', adminAuth, (req, res) => {
  res.json({ 
    message: 'Admin route is working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test database connection
router.get('/db-test', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 as test, NOW() as timestamp');
    res.json({ 
      message: 'Database connection successful',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test environment variables
router.get('/env-test', adminAuth, (req, res) => {
  res.json({ 
    message: 'Environment test',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? '***' : 'not set'
    },
    timestamp: new Date().toISOString()
  });
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.phone, 
        u.user_type, 
        u.status, 
        u.avatar_url, 
        u.created_at,
        u.updated_at,
        COUNT(r.id) as reports_count
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
    `;
    
    let countQuery = 'SELECT COUNT(*) FROM users u';
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Add filters
    if (search) {
      paramCount++;
      whereConditions.push(`(u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (role && role !== 'all') {
      paramCount++;
      whereConditions.push(`u.user_type = $${paramCount}`);
      queryParams.push(role);
    }

    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`u.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
    queryParams.push(limit, offset);

    const [users, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    res.json({
      users: users.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.rows[0].count / limit),
        total_items: parseInt(countResult.rows[0].count),
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.phone, 
        u.user_type, 
        u.status, 
        u.avatar_url, 
        u.created_at,
        u.updated_at,
        COUNT(r.id) as reports_count
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', adminAuth, [
  body('first_name').optional().trim().isLength({ min: 1 }),
  body('last_name').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('user_type').optional().isIn(['user', 'admin', 'moderator']),
  body('status').optional().isIn(['active', 'suspended', 'pending'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { first_name, last_name, email, phone, user_type, status } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (first_name) {
      updateFields.push(`first_name = $${paramCount++}`);
      updateValues.push(first_name);
    }
    if (last_name) {
      updateFields.push(`last_name = $${paramCount++}`);
      updateValues.push(last_name);
    }
    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push(`phone = $${paramCount++}`);
      updateValues.push(phone);
    }
    if (user_type) {
      updateFields.push(`user_type = $${paramCount++}`);
      updateValues.push(user_type);
    }
    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    updateValues.push(id);

    const result = await pool.query(query, updateValues);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0], message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update users (admin only)
router.put('/users/bulk', adminAuth, [
  body('user_ids').isArray({ min: 1 }),
  body('action').isIn(['activate', 'suspend', 'promote', 'demote'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_ids, action } = req.body;
    
    // Prevent admin from modifying themselves
    if (user_ids.includes(req.user.user.id)) {
      return res.status(400).json({ message: 'Cannot modify your own account' });
    }

    let updateField, updateValue;
    
    switch (action) {
      case 'activate':
        updateField = 'status';
        updateValue = 'active';
        break;
      case 'suspend':
        updateField = 'status';
        updateValue = 'suspended';
        break;
      case 'promote':
        updateField = 'user_type';
        updateValue = 'moderator';
        break;
      case 'demote':
        updateField = 'user_type';
        updateValue = 'user';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await pool.query(
      `UPDATE users SET ${updateField} = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ANY($2) RETURNING id, ${updateField}`,
      [updateValue, user_ids]
    );

    res.json({ 
      message: `${result.rows.length} users ${action}d successfully`,
      updated_users: result.rows
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics (admin only)
router.get('/users/stats', adminAuth, async (req, res) => {
  try {
    console.log('Admin stats endpoint called - executing query...');
    console.log('User making request:', req.user);
    
    // Simple query to test database connection
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
        COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN user_type = 'moderator' THEN 1 END) as moderator_users,
        COUNT(CASE WHEN user_type = 'user' THEN 1 END) as regular_users
      FROM users
    `);

    console.log('Query executed successfully, result:', stats.rows[0]);
    
    // Return the stats with proper error handling
    if (stats.rows && stats.rows.length > 0) {
      res.json(stats.rows[0]);
    } else {
      res.json({
        total_users: 0,
        active_users: 0,
        suspended_users: 0,
        pending_users: 0,
        admin_users: 0,
        moderator_users: 0,
        regular_users: 0
      });
    }
  } catch (error) {
    console.error('Get user stats error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    
    // Return a more detailed error response
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      code: error.code,
      details: error.detail
    });
  }
});

module.exports = router; 