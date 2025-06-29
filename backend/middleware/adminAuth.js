


const { auth } = require('./auth');

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, (err) => {
      if (err) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (!req.user || !req.user.user || req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { adminAuth };