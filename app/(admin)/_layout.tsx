import { StyleSheet, Text, View, Platform } from 'react-native'
import React from 'react'
import { Tabs, Redirect } from 'expo-router'
import { icons } from '../../assets/constants/icons'
import { TabIcon } from '../(tabs)/components/TabIcon'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useAuth } from '../contexts/AuthContext'

const AdminLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#667eea' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/UserLoginScreen" />;
  }

  // Redirect to home if not admin
  if (user?.user_type !== 'admin') {
    return <Redirect href="/(tabs)/HomeScreen" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: 16,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.95)', 'rgba(118, 75, 162, 0.95)', 'rgba(240, 147, 251, 0.85)']}
              style={styles.tabBarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Glassmorphism effect */}
            <View style={styles.tabBarGlass} />
            
            {/* Floating elements for visual interest */}
            <View style={[styles.floatingDot, styles.dot1]} />
            <View style={[styles.floatingDot, styles.dot2]} />
            <View style={[styles.floatingDot, styles.dot3]} />
          </View>
        ),
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 12,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen 
        name="AdminDashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabIcon icon="dashboard" focused={focused} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }}
      />
      <Tabs.Screen 
        name="AdminReportScreen"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabIcon icon="report" focused={focused} color={color} />
              {focused && <View style={styles.activeIndicator} />}
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </View>
          )
        }}
      />
      <Tabs.Screen 
        name="ManageUserScreen"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabIcon icon="people" focused={focused} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }}
      />
      <Tabs.Screen 
        name="AdminProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabIcon icon="person" focused={focused} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          )
        }}
      />
    </Tabs>
  )
}

export default AdminLayout

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  tabBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Floating decorative elements
  floatingDot: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  dot1: {
    width: 8,
    height: 8,
    top: 12,
    right: 30,
  },
  dot2: {
    width: 12,
    height: 12,
    top: 8,
    left: 40,
  },
  dot3: {
    width: 6,
    height: 6,
    top: 18,
    right: 80,
  },
  
  // Icon container styles
  iconContainer: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 1.05 }],
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 2,
    backgroundColor: '#feca57',
    borderRadius: 1,
  },
  
  // Notification badge
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
})