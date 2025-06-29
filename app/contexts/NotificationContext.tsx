import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService, API_BASE_URL } from '../services/ApiService';

const apiService = new ApiService();

interface Notification {
  id: number;
  title: string;
  description: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  severity: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  updateLocation: (latitude: number, longitude: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  refreshNotifications: () => void;
  updateNotificationPreferences: (preferences: any) => void;
  testConnection: () => void;
  connectSocket: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Configure push notifications
  useEffect(() => {
    configurePushNotifications();
  }, []);

  const configurePushNotifications = async () => {
    try {
      // Request permissions for local notifications only
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions!');
        return;
      }

      // Configure notification handler for local notifications only
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Handle notification received while app is running
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Local notification received:', notification);
        refreshNotifications();
      });

      // Handle notification tapped
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Local notification tapped:', response);
        // Handle navigation or other actions when notification is tapped
      });

      return () => {
        subscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('Error configuring local notifications:', error);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const checkAndConnect = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && !socketRef.current) {
        console.log('Token found, initializing Socket.IO connection...');
        await initializeSocket();
      } else if (!token && socketRef.current) {
        console.log('No token found, disconnecting Socket.IO...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };

    checkAndConnect();

    // Set up an interval to check for token changes
    const interval = setInterval(checkAndConnect, 5000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = async () => {
    try {
      console.log('Initializing Socket.IO connection...');
      
      // Get auth token - use the same key as ApiService
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token found, skipping socket connection');
        return;
      }

      console.log('Auth token found, length:', token.length);
      tokenRef.current = token;

      // Create socket connection with correct WebSocket URL
      const wsUrl = API_BASE_URL.replace('http://', 'ws://');
      console.log('Connecting to WebSocket:', wsUrl);
      
      const socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected successfully, socket ID:', socket.id);
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          type: error.type,
          description: error.description
        });
        setIsConnected(false);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Notification events
      socket.on('new_notification', (notification: Notification) => {
        console.log('New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show local notification if app is in foreground
        if (Device.isDevice) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.description,
              data: notification,
            },
            trigger: null, // Show immediately
          });
        }
      });

      socket.on('unread_count', (data: { unread_count: number }) => {
        setUnreadCount(data.unread_count);
      });

      // Load initial notifications
      refreshNotifications();
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  const updateLocation = (latitude: number, longitude: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_location', { latitude, longitude });
      console.log('Location update sent:', { latitude, longitude });
    } else {
      console.log('Cannot send location update - socket not connected');
    }
  };

  // Test function to manually trigger connection
  const testConnection = () => {
    console.log('=== Socket.IO Connection Debug ===');
    console.log('Socket ref exists:', !!socketRef.current);
    console.log('Is connected:', isConnected);
    console.log('Token ref exists:', !!tokenRef.current);
    
    if (socketRef.current) {
      console.log('Socket ID:', socketRef.current.id);
      console.log('Socket connected:', socketRef.current.connected);
      console.log('Socket transport:', socketRef.current.io.engine.transport.name);
    } else {
      console.log('No socket reference found');
    }
    
    if (tokenRef.current) {
      console.log('Token length:', tokenRef.current.length);
      console.log('Token preview:', tokenRef.current.substring(0, 20) + '...');
    } else {
      console.log('No token found');
    }
    console.log('================================');
  };

  const markAsRead = async (id: number) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const refreshNotifications = async () => {
    try {
      const response = await apiService.loadNotifications(1, 50);
      setNotifications(response.notifications || []);
      
      const unreadResponse = await apiService.getUnreadNotificationCount();
      setUnreadCount(unreadResponse.unread_count || 0);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const updateNotificationPreferences = async (preferences: any) => {
    try {
      await apiService.updateNotificationPreferences(preferences);
      if (socketRef.current && isConnected) {
        socketRef.current.emit('update_notification_preferences', { preferences });
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const connectSocket = async () => {
    try {
      console.log('Manual Socket.IO connection triggered...');
      
      // Wait a bit to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if token exists - use the same key as ApiService
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token found, cannot connect to Socket.IO');
        return;
      }
      
      console.log('Token found, proceeding with Socket.IO connection...');
      await initializeSocket();
    } catch (error) {
      console.error('Error connecting to Socket.IO:', error);
      Alert.alert('Error', 'Failed to connect to Socket.IO');
    }
  };

  // Make the connection function available globally for AuthContext
  useEffect(() => {
    (global as any).triggerSocketConnection = connectSocket;
    (global as any).triggerSocketDisconnection = () => {
      console.log('Manual Socket.IO disconnection triggered...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
    return () => {
      delete (global as any).triggerSocketConnection;
      delete (global as any).triggerSocketDisconnection;
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    updateLocation,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    updateNotificationPreferences,
    testConnection,
    connectSocket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 