const pool = require('../config/database');
const cron = require('node-cron');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.userLocations = new Map(); // Map of userId -> {latitude, longitude}
    
    // Initialize PostgreSQL notification listener
    this.initializePostgresNotifications();
    
    // Initialize cron jobs for periodic notifications
    this.initializeCronJobs();
  }

  // Initialize PostgreSQL LISTEN/NOTIFY for real-time notifications
  async initializePostgresNotifications() {
    try {
      // Create a dedicated client for listening to notifications
      this.notificationClient = await pool.connect();
      
      // Listen for notification events
      await this.notificationClient.query('LISTEN notification_events');
      
      this.notificationClient.on('notification', (msg) => {
        try {
          const notification = JSON.parse(msg.payload);
          console.log('PostgreSQL notification received:', notification);
          
          // Send to connected user via Socket.IO
          this.sendRealTimeNotification(notification.user_id, notification);
          
          // Show local notification if user is connected
          if (this.connectedUsers.has(notification.user_id)) {
            this.showLocalNotification(notification);
          }
        } catch (error) {
          console.error('Error processing PostgreSQL notification:', error);
        }
      });

      this.notificationClient.on('error', (error) => {
        console.error('PostgreSQL notification client error:', error);
        // Reconnect after a delay
        setTimeout(() => this.initializePostgresNotifications(), 5000);
      });

      console.log('PostgreSQL notification listener initialized');
    } catch (error) {
      console.error('Error initializing PostgreSQL notifications:', error);
    }
  }

  // Send notification to PostgreSQL to trigger LISTEN/NOTIFY
  async sendPostgresNotification(userId, notification) {
    try {
      await pool.query(
        'SELECT pg_notify($1, $2)',
        ['notification_events', JSON.stringify({
          user_id: userId,
          ...notification
        })]
      );
      console.log(`PostgreSQL notification sent for user ${userId}`);
    } catch (error) {
      console.error('Error sending PostgreSQL notification:', error);
    }
  }

  // Show local notification using expo-notifications
  showLocalNotification(notification) {
    // This will be handled by the frontend when it receives the Socket.IO event
    console.log('Local notification should be shown for:', notification);
  }

  // Send real-time notification via Socket.IO
  sendRealTimeNotification(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
      console.log(`Real-time notification sent to user ${userId}`);
    } else {
      console.log(`User ${userId} not connected, notification queued`);
    }
  }

  // Handle user connection
  handleUserConnection(socket, userId) {
    console.log('=== NotificationService.handleUserConnection ===');
    console.log('User ID:', userId);
    console.log('Socket ID:', socket.id);
    console.log('Connected users before adding:', this.connectedUsers.size);
    console.log('Current connected users:', Array.from(this.connectedUsers.entries()));
    
    this.connectedUsers.set(userId, socket.id);
    
    console.log('Connected users after adding:', this.connectedUsers.size);
    console.log('Updated connected users:', Array.from(this.connectedUsers.entries()));
    console.log(`✅ User ${userId} connected with socket ${socket.id}`);
    console.log('=== End NotificationService.handleUserConnection ===');
    
    // Send unread notifications count
    this.sendUnreadCount(userId);
  }

  // Handle user disconnection
  handleUserDisconnection(userId) {
    console.log('=== NotificationService.handleUserDisconnection ===');
    console.log('User ID:', userId);
    console.log('Connected users before removing:', this.connectedUsers.size);
    console.log('Current connected users:', Array.from(this.connectedUsers.entries()));
    
    this.connectedUsers.delete(userId);
    this.userLocations.delete(userId);
    
    console.log('Connected users after removing:', this.connectedUsers.size);
    console.log('Updated connected users:', Array.from(this.connectedUsers.entries()));
    console.log(`✅ User ${userId} disconnected`);
    console.log('=== End NotificationService.handleUserDisconnection ===');
  }

  // Update user location for proximity-based notifications
  updateUserLocation(userId, latitude, longitude) {
    this.userLocations.set(userId, { latitude, longitude });
  }

  // Note: Push notifications are now handled via PostgreSQL LISTEN/NOTIFY
  // This provides real-time notifications without external dependencies

  // Create and send road sign notification
  async createRoadSignNotification(signData, affectedUsers = null) {
    try {
      const notification = {
        title: `New Road Sign: ${signData.name}`,
        description: signData.description,
        type: 'road_sign',
        location: signData.location_name || 'Unknown location',
        latitude: signData.latitude,
        longitude: signData.longitude,
        severity: 'medium',
        data: {
          sign_id: signData.id,
          category_id: signData.category_id,
          image_url: signData.image_url
        }
      };

      // If specific users are provided, send to them
      if (affectedUsers && Array.isArray(affectedUsers)) {
        for (const userId of affectedUsers) {
          await this.createNotificationForUser(userId, notification);
        }
      } else {
        // Send to all users in proximity
        await this.sendProximityNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating road sign notification:', error);
    }
  }

  // Create and send road state notification
  async createRoadStateNotification(roadStateData) {
    try {
      const notification = {
        title: roadStateData.title,
        description: roadStateData.description,
        type: roadStateData.notification_type,
        location: roadStateData.location,
        latitude: roadStateData.latitude,
        longitude: roadStateData.longitude,
        severity: roadStateData.severity,
        data: {
          road_state_id: roadStateData.id,
          estimated_duration: roadStateData.estimated_duration,
          speed_limit_reduction: roadStateData.speed_limit_reduction,
          lane_closures: roadStateData.lane_closures,
          detour_info: roadStateData.detour_info
        }
      };

      // Send to users in proximity
      await this.sendProximityNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating road state notification:', error);
    }
  }

  // Send notification to users in proximity
  async sendProximityNotification(notification) {
    try {
      const proximityRadius = 10; // 10km radius
      const affectedUsers = [];

      for (const [userId, location] of this.userLocations) {
        const distance = this.calculateDistance(
          notification.latitude,
          notification.longitude,
          location.latitude,
          location.longitude
        );

        if (distance <= proximityRadius) {
          affectedUsers.push(userId);
        }
      }

      // Create notifications for affected users
      for (const userId of affectedUsers) {
        await this.createNotificationForUser(userId, notification);
      }

      console.log(`Proximity notification sent to ${affectedUsers.length} users`);
    } catch (error) {
      console.error('Error sending proximity notification:', error);
    }
  }

  // Create notification for a specific user
  async createNotificationForUser(userId, notificationData) {
    try {
      const notification = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, data) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          userId,
          notificationData.title,
          notificationData.description || notificationData.message,
          notificationData.type,
          JSON.stringify(notificationData.data || {})
        ]
      );

      // Send real-time notification via Socket.IO
      this.sendRealTimeNotification(userId, notification.rows[0]);

      // Send PostgreSQL notification for LISTEN/NOTIFY
      await this.sendPostgresNotification(userId, notification.rows[0]);

      console.log(`Notification created for user ${userId}: ${notificationData.title}`);
      return notification.rows[0];
    } catch (error) {
      console.error('Error creating notification for user:', error);
      throw error;
    }
  }

  // Send notification to all users when a report is approved
  async sendApprovedReportNotification(reportData) {
    try {
      const notificationTitle = 'Road Issue Resolved';
      const notificationMessage = `A ${reportData.report_type} issue has been resolved: ${reportData.title}`;
      
      // Get all users except the report owner and admins
      const users = await pool.query(
        `SELECT id FROM users WHERE id != $1 AND user_type != 'admin'`,
        [reportData.user_id]
      );

      const notificationData = {
        title: notificationTitle,
        description: notificationMessage,
        type: 'road_issue_resolved',
        data: {
          report_id: reportData.id,
          report_type: reportData.report_type,
          location: reportData.address || `${reportData.latitude}, ${reportData.longitude}`,
          latitude: reportData.latitude,
          longitude: reportData.longitude
        }
      };

      // Send notification to each user
      for (const user of users.rows) {
        await this.createNotificationForUser(user.id, notificationData);
      }

      console.log(`Approved report notification sent to ${users.rows.length} users for report ${reportData.id}`);
      return users.rows.length;
    } catch (error) {
      console.error('Error sending approved report notification:', error);
      throw error;
    }
  }

  // Send unread notifications count
  async sendUnreadCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      const unreadCount = parseInt(result.rows[0].count);
      const socketId = this.connectedUsers.get(userId);
      
      if (socketId) {
        this.io.to(socketId).emit('unread_count', { unread_count: unreadCount });
      }
    } catch (error) {
      console.error('Error sending unread count:', error);
    }
  }

  // Initialize cron jobs for periodic notifications
  initializeCronJobs() {
    // Check for new road state notifications every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkForNewRoadStateNotifications();
    });

    // Clean up expired notifications every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupExpiredNotifications();
    });
  }

  // Check for new road state notifications based on user locations
  async checkForNewRoadStateNotifications() {
    try {
      // Get all active road state notifications
      const roadStateNotifications = await pool.query(`
        SELECT * FROM road_state_notifications 
        WHERE status = 'active' AND expires_at > NOW()
      `);

      // Check each connected user's location against road state notifications
      for (const [userId, location] of this.userLocations) {
        for (const notification of roadStateNotifications.rows) {
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            notification.latitude,
            notification.longitude
          );

          // If user is within notification radius, send notification
          if (distance <= notification.radius_km) {
            await this.createNotificationForUser(userId, {
              title: `Road State Alert: ${notification.title}`,
              description: notification.description,
              type: 'road_state',
              location: notification.location,
              latitude: notification.latitude,
              longitude: notification.longitude,
              severity: notification.severity,
              data: {
                road_state_id: notification.id,
                notification_type: notification.notification_type
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking road state notifications:', error);
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      await pool.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      console.log('Expired notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    console.log('=== NotificationService.getConnectedUsersCount ===');
    console.log('Connected users map size:', this.connectedUsers.size);
    console.log('Connected users entries:', Array.from(this.connectedUsers.entries()));
    console.log('=== End NotificationService.getConnectedUsersCount ===');
    return this.connectedUsers.size;
  }
}

module.exports = NotificationService; 