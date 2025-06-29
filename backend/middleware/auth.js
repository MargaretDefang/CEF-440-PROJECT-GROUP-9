const jwt = require('jsonwebtoken');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'road_app_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'road-app',
    audience: 'road-app-users'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'road-app',
      audience: 'road-app-users'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Main authentication middleware
const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Invalid authorization format. Use Bearer token',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const decoded = verifyToken(token);
    
    // Add user info to request
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  try {
    console.log('Admin auth middleware called');
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ 
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization format');
      return res.status(401).json({ 
        message: 'Invalid authorization format. Use Bearer token',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    console.log('Attempting to verify token...');
    const decoded = verifyToken(token);
    console.log('Token decoded successfully:', decoded);
    
    // Check if user is admin
    if (decoded.user?.user_type !== 'admin' && decoded.user_type !== 'admin') {
      console.log('User is not admin:', decoded.user?.user_type || decoded.user_type);
      return res.status(403).json({ 
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }
    
    console.log('Admin access granted');
    // Add user info to request
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error.message);
    console.error('Error details:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = verifyToken(token);
    
    // Add user info to request
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

module.exports = { 
  auth, 
  adminAuth, 
  optionalAuth, 
  generateToken, 
  verifyToken 
}; 