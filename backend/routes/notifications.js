const express = require('express');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    let queryParams = [req.user.user.id];
    let paramCount = 1;

    if (unread_only === 'true') {
      paramCount++;
      query += ` AND is_read = false`;
      countQuery += ` AND is_read = false`;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
    queryParams.push(limit, offset);

    const [notifications, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    res.json({
      notifications: notifications.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.rows[0].count / limit),
        total_items: parseInt(countResult.rows[0].count),
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.user.id]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification.rows[0]);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING COUNT(*)',
      [req.user.user.id]
    );

    res.json({ 
      message: 'All notifications marked as read',
      updated_count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.user.id]
    );

    res.json({ 
      unread_count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.user.id]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 