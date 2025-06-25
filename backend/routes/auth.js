const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer setup for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.user.id}_${Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({ storage: avatarStorage });

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, user_type',
      [email, passwordHash, first_name, last_name, phone]
    );

    // Create JWT token
    const payload = {
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        first_name: newUser.rows[0].first_name,
        last_name: newUser.rows[0].last_name,
        user_type: newUser.rows[0].user_type
      }
    };

    const token = generateToken(payload);

    res.status(201).json({
      token,
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        first_name: newUser.rows[0].first_name,
        last_name: newUser.rows[0].last_name,
        user_type: newUser.rows[0].user_type
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
        user_type: user.rows[0].user_type
      }
    };

    const token = generateToken(payload);

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
        user_type: user.rows[0].user_type
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, user_type, created_at FROM users WHERE id = $1',
      [req.user.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', require('../middleware/auth').auth, async (req, res) => {
  try {
    // Get current user from database to ensure they still exist
    const user = await pool.query(
      'SELECT id, email, first_name, last_name, user_type FROM users WHERE id = $1',
      [req.user.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token
    const payload = {
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
        user_type: user.rows[0].user_type
      }
    };

    const newToken = generateToken(payload);

    res.json({
      token: newToken,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
        user_type: user.rows[0].user_type
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Server-side logout (stateless JWT)
router.post('/logout', require('../middleware/auth').auth, async (req, res) => {
  // If you use refresh tokens, you can invalidate them here
  // For stateless JWT, just return success
  res.status(200).json({ message: 'Logged out successfully' });
});

// Update current user profile
router.put('/me', require('../middleware/auth').auth, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { first_name, last_name, email, phone, avatar_url } = req.body;
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
    if (avatar_url) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      updateValues.push(avatar_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, phone, avatar_url, user_type, created_at`;
    updateValues.push(userId);

    const result = await pool.query(query, updateValues);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: result.rows[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user password (require old password)
router.put('/password', require('../middleware/auth').auth, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password || new_password.length < 6) {
      return res.status(400).json({ message: 'Old password and new password (min 6 chars) are required' });
    }
    // Get current password hash
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(old_password, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, first_name, last_name, phone, avatar_url, user_type, created_at',
      [passwordHash, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: result.rows[0], message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Avatar upload endpoint
router.post('/avatar', require('../middleware/auth').auth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    console.log('Backend - Avatar upload request received');
    console.log('Backend - User ID:', req.user.user.id);
    console.log('Backend - File:', req.file);
    
    if (!req.file) {
      console.log('Backend - No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.user.id;
    // Construct public URL (assuming static serving from /uploads)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('Backend - Avatar URL:', avatarUrl);
    
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, first_name, last_name, phone, avatar_url, user_type, created_at',
      [avatarUrl, userId]
    );
    
    console.log('Backend - Database update result:', result.rows[0]);
    
    if (result.rows.length === 0) {
      console.log('Backend - User not found after update');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Backend - Avatar upload successful, returning user:', result.rows[0]);
    res.json({ user: result.rows[0], avatar_url: avatarUrl, message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 