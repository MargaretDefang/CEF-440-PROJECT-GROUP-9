import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  ColorValue,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { 
    notifications, 
    unreadCount, 
    isConnected,
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    refreshNotifications 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };

  const handleDeleteNotification = (id: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotification(id)
        }
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will remove all notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            notifications.forEach(notification => {
              deleteNotification(notification.id);
            });
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  type NotificationConfig = {
    icon: string;
    color: string;
    gradient: readonly [ColorValue, ColorValue];
    bgColor: string;
  };

  const getNotificationConfig = (type: string): NotificationConfig => {
    const configs: Record<string, NotificationConfig> = {
      road_sign: {
        icon: 'traffic',
        color: '#3498db',
        gradient: ['#3498db', '#2980b9'] as const,
        bgColor: 'rgba(52, 152, 219, 0.1)'
      },
      construction: {
        icon: 'construction',
        color: '#f39c12',
        gradient: ['#f39c12', '#e67e22'] as const,
        bgColor: 'rgba(243, 156, 18, 0.1)'
      },
      accident: {
        icon: 'car-crash',
        color: '#e74c3c',
        gradient: ['#e74c3c', '#c0392b'] as const,
        bgColor: 'rgba(231, 76, 60, 0.1)'
      },
      hazard: {
        icon: 'warning',
        color: '#f1c40f',
        gradient: ['#f1c40f', '#f39c12'] as const,
        bgColor: 'rgba(241, 196, 15, 0.1)'
      },
      traffic: {
        icon: 'traffic',
        color: '#9b59b6',
        gradient: ['#9b59b6', '#8e44ad'] as const,
        bgColor: 'rgba(155, 89, 182, 0.1)'
      },
      weather: {
        icon: 'wb-sunny',
        color: '#e67e22',
        gradient: ['#e67e22', '#d35400'] as const,
        bgColor: 'rgba(230, 126, 34, 0.1)'
      },
      maintenance: {
        icon: 'build',
        color: '#34495e',
        gradient: ['#34495e', '#2c3e50'] as const,
        bgColor: 'rgba(52, 73, 94, 0.1)'
      },
      event: {
        icon: 'event',
        color: '#1abc9c',
        gradient: ['#1abc9c', '#16a085'] as const,
        bgColor: 'rgba(26, 188, 156, 0.1)'
      },
      sign_issue: {
        icon: 'report-problem',
        color: '#e74c3c',
        gradient: ['#e74c3c', '#c0392b'] as const,
        bgColor: 'rgba(231, 76, 60, 0.1)'
      }
    };
    return configs[type] || configs.road_sign;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#f1c40f';
      case 'low': return '#27ae60';
      default: return '#3498db';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupByDate = () => {
    const grouped: Record<string, typeof notifications> = {};
    notifications.forEach(n => {
      const date = formatDate(n.created_at);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(n);
    });
    return grouped;
  };

  const grouped = groupByDate();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Background Elements */}
        <Animatable.View 
          animation="rotate" 
          iterationCount="infinite" 
          duration={30000}
          style={[styles.floatingElement, styles.element1]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={5000}
          delay={2000}
          style={[styles.floatingElement, styles.element2]}
        />
        <Animatable.View 
          animation="bounce" 
          iterationCount="infinite" 
          duration={4000}
          delay={1000}
          style={[styles.floatingElement, styles.element3]}
        />

        {/* Enhanced Header */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000}
          style={styles.headerSection}
        >
          <View style={styles.headerGlass}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{unreadCount}</Text>
                  </View>
                )}
                {isConnected && (
                  <View style={styles.connectionIndicator}>
                    <MaterialIcons name="wifi" size={12} color="#1dd1a1" />
                  </View>
                )}
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={handleMarkAllAsRead}
                >
                  <MaterialIcons name="done-all" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={handleDeleteAll}
                >
                  <MaterialIcons name="clear-all" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.headerSubtitle}>
              Stay updated with road conditions
            </Text>
          </View>
        </Animatable.View>

        {/* Content */}
        <Animated.View 
          style={[styles.content, { opacity: fadeAnim }]}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#667eea']}
                tintColor="#667eea"
              />
            }
          >
            {Object.entries(grouped).map(([date, items], dateIndex) => (
              <Animatable.View
                key={date}
                animation="fadeInUp"
                duration={1000}
                delay={dateIndex * 200}
                style={styles.dateSection}
              >
                <View style={styles.dateLabelContainer}>
                  <Text style={styles.dateLabel}>{date}</Text>
                  <View style={styles.dateLine} />
                </View>

                {items.map((notification, index) => {
                  const config = getNotificationConfig(notification.type);
                  return (
                    <Animatable.View
                      key={notification.id}
                      animation="fadeInRight"
                      duration={800}
                      delay={(dateIndex * 200) + (index * 100)}
                    >
                      <TouchableOpacity
                        style={[
                          styles.notificationCard,
                          !notification.is_read && styles.unreadCard
                        ]}
                        onPress={() => handleMarkAsRead(notification.id)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={[
                            'rgba(255, 255, 255, 0.15)',
                            'rgba(255, 255, 255, 0.08)'
                          ]}
                          style={styles.cardGradient}
                        >
                          {/* Severity Indicator */}
                          <View 
                            style={[
                              styles.severityIndicator,
                              { backgroundColor: getSeverityColor(notification.severity) }
                            ]} 
                          />

                          <View style={styles.cardContent}>
                            {/* Icon Section */}
                            <View style={[
                              styles.iconContainer,
                              { backgroundColor: config.bgColor }
                            ]}>
                              <LinearGradient
                                colors={config.gradient}
                                style={styles.iconGradient}
                              >
                                <MaterialIcons 
                                  name={config.icon as any} 
                                  size={24} 
                                  color="white" 
                                />
                              </LinearGradient>
                            </View>

                            {/* Text Content */}
                            <View style={styles.textContent}>
                              <Text style={styles.notificationTitle}>
                                {notification.title}
                              </Text>
                              <Text style={styles.notificationDescription}>
                                {notification.description}
                              </Text>
                              <View style={styles.locationRow}>
                                <MaterialIcons 
                                  name="location-on" 
                                  size={14} 
                                  color="rgba(255, 255, 255, 0.7)" 
                                />
                                <Text style={styles.locationText}>
                                  {notification.location}
                                </Text>
                              </View>
                            </View>

                            {/* Right Section */}
                            <View style={styles.rightSection}>
                              <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteNotification(notification.id)}
                              >
                                <MaterialIcons name="delete" size={18} color="rgba(255, 255, 255, 0.6)" />
                              </TouchableOpacity>
                              {!notification.is_read && (
                                <View style={styles.unreadDot} />
                              )}
                            </View>
                          </View>

                          {/* Card Glow Effect */}
                          <View style={styles.cardGlow} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animatable.View>
                  );
                })}
              </Animatable.View>
            ))}

            {/* Empty State */}
            {notifications.length === 0 && (
              <Animatable.View 
                animation="fadeIn" 
                duration={1000}
                style={styles.emptyState}
              >
                <View style={styles.emptyGlass}>
                  <Animatable.View 
                    animation="pulse" 
                    iterationCount="infinite" 
                    duration={2000}
                  >
                    <MaterialIcons name="notifications-off" size={64} color="rgba(255, 255, 255, 0.6)" />
                  </Animatable.View>
                  <Text style={styles.emptyTitle}>All caught up!</Text>
                  <Text style={styles.emptySubtitle}>
                    No notifications at the moment.{'\n'}We'll keep you updated on road conditions.
                  </Text>
                </View>
              </Animatable.View>
            )}
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  gradientContainer: {
    flex: 1,
  },

  // Floating Background Elements
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 100,
  },
  element1: {
    width: 140,
    height: 140,
    top: '8%',
    right: '-12%',
  },
  element2: {
    width: 100,
    height: 100,
    bottom: '30%',
    left: '-15%',
  },
  element3: {
    width: 80,
    height: 80,
    top: '50%',
    right: '10%',
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 8,
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectionIndicator: {
    backgroundColor: 'rgba(29, 209, 161, 0.2)',
    borderRadius: 8,
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Date Section
  dateSection: {
    marginBottom: 20,
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Notification Cards
  notificationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 87, 0.5)',
  },
  cardGradient: {
    position: 'relative',
  },
  severityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 2,
    marginRight: 12,
  },
  iconGradient: {
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 6,
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#feca57',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
