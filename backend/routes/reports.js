const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get NotificationService instance
let notificationService = null;
const setNotificationService = (service) => {
  notificationService = service;
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all reports (with pagination)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT r.*, u.first_name, u.last_name, u.email 
      FROM reports r 
      JOIN users u ON r.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM reports r';
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Add filters
    if (status) {
      paramCount++;
      whereConditions.push(`r.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (user_id) {
      paramCount++;
      whereConditions.push(`r.user_id = $${paramCount}`);
      queryParams.push(user_id);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ' ORDER BY r.created_at DESC LIMIT $' + (paramCount + 1) + ' OFFSET $' + (paramCount + 2);
    queryParams.push(limit, offset);

    const [reports, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    res.json({
      reports: reports.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.rows[0].count / limit),
        total_items: parseInt(countResult.rows[0].count),
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single report
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.email 
       FROM reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1`,
      [id]
    );

    if (report.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report.rows[0]);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new report
router.post('/', [
  auth,
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('latitude').isFloat(),
  body('longitude').isFloat(),
  body('report_type').notEmpty().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      latitude,
      longitude,
      address,
      report_type,
      priority = 'medium',
      images = []
    } = req.body;

    const newReport = await pool.query(
      `INSERT INTO reports 
       (user_id, title, description, latitude, longitude, address, report_type, priority, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [req.user.user.id, title, description, latitude, longitude, address, report_type, priority, images]
    );

    // Create notification for admins
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_report_id) 
       SELECT id, 'New Report', 'A new ${report_type} report has been submitted', 'report', $1 
       FROM users WHERE user_type = 'admin'`,
      [newReport.rows[0].id]
    );

    res.status(201).json(newReport.rows[0]);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report (admin only)
router.put('/:id', [
  adminAuth,
  body('status').optional().isIn(['pending', 'approved', 'rejected']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, priority, description } = req.body;

    const report = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (report.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
    }

    if (priority) {
      paramCount++;
      updateFields.push(`priority = $${paramCount}`);
      updateValues.push(priority);
    }

    if (description) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    updateValues.push(id);

    const updatedReport = await pool.query(
      `UPDATE reports SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    // Create notification for user
    if (status && status !== report.rows[0].status) {
      // Notify the report owner about status change
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_report_id) 
         VALUES ($1, 'Report Update', 'Your report status has been updated to ${status}', 'status_update', $2)`,
        [report.rows[0].user_id, id]
      );

      // If report is approved, notify all other users via NotificationService
      if (status === 'approved' && notificationService) {
        try {
          const reportData = report.rows[0];
          await notificationService.sendApprovedReportNotification(reportData);
          console.log(`Real-time notification sent to all users for approved report ${id}: ${reportData.title}`);
        } catch (error) {
          console.error('Error sending approved report notification:', error);
          // Continue with the response even if notification fails
        }
      }
    }

    res.json(updatedReport.rows[0]);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete report (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
    
    if (report.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reports
router.get('/user/me', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reports = await pool.query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM reports WHERE user_id = $1',
      [req.user.user.id]
    );

    res.json({
      reports: reports.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult.rows[0].count / limit),
        total_items: parseInt(countResult.rows[0].count),
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload report image
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/reports/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload report image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, setNotificationService }; 