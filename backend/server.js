const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const { router: reportsRoutes, setNotificationService } = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const signsRoutes = require('./routes/signs');
const adminRoutes = require('./routes/admin');
const roadStateNotificationsRoutes = require('./routes/roadStateNotifications');

// Import services
const NotificationService = require('./services/NotificationService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'exp://localhost:19000',
      'http://192.168.138.138:3000',
      'http://192.168.138.138:8081',
      'http://192.168.138.138:19006',
      'exp://192.168.138.138:19000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Initialize notification service
const notificationService = new NotificationService(io);

// Set notification service in reports route
setNotificationService(notificationService);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081', // Expo development server
      'http://localhost:19006', // Expo web
      'exp://localhost:19000', // Expo Go
      'http://192.168.138.138:3000', // New local IP
      'http://192.168.138.138:8081', // Expo development server on new IP
      'http://192.168.138.138:19006', // Expo web on new IP
      'exp://192.168.138.138:19000', // Expo Go on new IP
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Auth-Token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Logging
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    connected_users: notificationService.getConnectedUsersCount()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/signs', signsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/road-state-notifications', roadStateNotificationsRoutes);

// Socket.IO connection handling
io.use(async (socket, next) => {
  try {
    console.log('=== Socket.IO Authentication ===');
    console.log('Socket ID:', socket.id);
    const token = socket.handshake.auth.token;
    console.log('Token provided:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    if (!token) {
      console.log('❌ No token provided for Socket.IO connection');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'road_app_jwt_secret_key_2024');
    console.log('✅ Token decoded successfully');
    console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    
    // Handle different JWT token structures
    if (decoded.user && decoded.user.id) {
      socket.userId = decoded.user.id;
      console.log('✅ User ID set from decoded.user.id:', socket.userId);
    } else if (decoded.id) {
      socket.userId = decoded.id;
      console.log('✅ User ID set from decoded.id:', socket.userId);
    } else {
      console.log('❌ No user ID found in token');
      return next(new Error('Authentication error: No user ID in token'));
    }
    
    console.log(`✅ Socket.IO authentication successful for user ${socket.userId}`);
    console.log('=== End Socket.IO Authentication ===');
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('=== Socket.IO Connection ===');
  console.log(`✅ User ${socket.userId} connected with socket ${socket.id}`);
  console.log('Current connected users before:', global.notificationService.connectedUsers.size);
  
  // Handle user connection
  global.notificationService.handleUserConnection(socket, socket.userId);
  
  console.log('Current connected users after:', global.notificationService.connectedUsers.size);
  console.log('Connected users map:', Array.from(global.notificationService.connectedUsers.entries()));
  console.log('=== End Socket.IO Connection ===');

  // Handle location updates
  socket.on('update_location', (data) => {
    const { latitude, longitude } = data;
    global.notificationService.updateUserLocation(socket.userId, latitude, longitude);
    console.log(`Location updated for user ${socket.userId}: ${latitude}, ${longitude}`);
  });

  // Handle notification preferences
  socket.on('update_notification_preferences', async (data) => {
    try {
      const { preferences } = data;
      const pool = require('./config/database');
      
      await pool.query(
        'UPDATE users SET notification_preferences = $1 WHERE id = $2',
        [JSON.stringify(preferences), socket.userId]
      );
      
      console.log(`Notification preferences updated for user ${socket.userId}`);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('=== Socket.IO Disconnection ===');
    console.log(`User ${socket.userId} disconnected`);
    console.log('Current connected users before disconnect:', global.notificationService.connectedUsers.size);
    global.notificationService.handleUserDisconnection(socket.userId);
    console.log('Current connected users after disconnect:', global.notificationService.connectedUsers.size);
    console.log('=== End Socket.IO Disconnection ===');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Network access: http://192.168.138.138:${PORT}/health`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using default'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🔌 Socket.IO: WebSocket server ready`);
});

// Make notification service available globally
global.notificationService = notificationService;

module.exports = { app, server, io, notificationService };