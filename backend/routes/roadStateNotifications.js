const express = require('express');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const pool = require('../config/database');

const router = express.Router();

// Get active road state notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, severity } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM road_state_notifications WHERE status = $1';
    let countQuery = 'SELECT COUNT(*) FROM road_state_notifications WHERE status = $1';
    let queryParams = ['active'];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND notification_type = $${paramCount}`;
      countQuery += ` AND notification_type = $${paramCount}`;
      queryParams.push(type);
    }

    if (severity) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      countQuery += ` AND severity = $${paramCount}`;
      queryParams.push(severity);
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
    console.error('Get road state notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get road state notifications by proximity
router.get('/proximity', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Query for notifications within the specified radius (in kilometers)
    const query = `
      SELECT *, 
        (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
         cos(radians(longitude) - radians($2)) + 
         sin(radians($1)) * sin(radians(latitude)))) AS distance
      FROM road_state_notifications 
      WHERE status = 'active' 
        AND (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
             cos(radians(longitude) - radians($2)) + 
             sin(radians($1)) * sin(radians(latitude)))) <= $3
      ORDER BY distance ASC, created_at DESC
    `;

    const result = await pool.query(query, [latitude, longitude, radius]);

    res.json({
      notifications: result.rows,
      user_location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      search_radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Get proximity notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new road state notification (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      latitude,
      longitude,
      notification_type,
      severity = 'medium',
      affected_area_radius,
      estimated_duration,
      speed_limit_reduction,
      lane_closures,
      detour_info,
      expires_at
    } = req.body;

    // Validate required fields
    if (!title || !location || !notification_type) {
      return res.status(400).json({ message: 'Title, location, and notification type are required' });
    }

    const result = await pool.query(
      `INSERT INTO road_state_notifications 
       (title, description, location, latitude, longitude, notification_type, severity, 
        affected_area_radius, estimated_duration, speed_limit_reduction, lane_closures, 
        detour_info, created_by, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        title, description, location, latitude, longitude, notification_type, severity,
        affected_area_radius, estimated_duration, speed_limit_reduction, lane_closures,
        detour_info, req.user.user.id, expires_at
      ]
    );

    const notification = result.rows[0];

    // Trigger real-time notification to nearby users using global notification service
    if (global.notificationService) {
      await global.notificationService.createRoadStateNotification(notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create road state notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update road state notification (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      latitude,
      longitude,
      notification_type,
      severity,
      affected_area_radius,
      estimated_duration,
      speed_limit_reduction,
      lane_closures,
      detour_info,
      status,
      expires_at
    } = req.body;

    const result = await pool.query(
      `UPDATE road_state_notifications 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           latitude = COALESCE($4, latitude),
           longitude = COALESCE($5, longitude),
           notification_type = COALESCE($6, notification_type),
           severity = COALESCE($7, severity),
           affected_area_radius = COALESCE($8, affected_area_radius),
           estimated_duration = COALESCE($9, estimated_duration),
           speed_limit_reduction = COALESCE($10, speed_limit_reduction),
           lane_closures = COALESCE($11, lane_closures),
           detour_info = COALESCE($12, detour_info),
           status = COALESCE($13, status),
           expires_at = COALESCE($14, expires_at),
           updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        title, description, location, latitude, longitude, notification_type, severity,
        affected_area_radius, estimated_duration, speed_limit_reduction, lane_closures,
        detour_info, status, expires_at, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Road state notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update road state notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete road state notification (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM road_state_notifications WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Road state notification not found' });
    }

    res.json({ message: 'Road state notification deleted successfully' });
  } catch (error) {
    console.error('Delete road state notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get road state notification statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_notifications,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_notifications,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_notifications,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_notifications,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_notifications,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_notifications
      FROM road_state_notifications
    `);

    const typeStats = await pool.query(`
      SELECT 
        notification_type,
        COUNT(*) as count
      FROM road_state_notifications
      GROUP BY notification_type
      ORDER BY count DESC
    `);

    res.json({
      overall_stats: stats.rows[0],
      type_breakdown: typeStats.rows
    });
  } catch (error) {
    console.error('Get road state notification stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 