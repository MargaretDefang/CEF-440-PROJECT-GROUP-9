import { StyleSheet, Text, View, Platform } from 'react-native'
import React from 'react'
import { Tabs, Redirect } from 'expo-router'
import { icons } from '../../assets/constants/icons'
import { TabIcon } from './components/TabIcon'
import { BlurView } from 'expo-blur'
import { useAuth } from '../contexts/AuthContext'

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#feca57', // Your brand yellow
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(102, 126, 234, 0.85)', // Semi-transparent gradient color
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)', // For web
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          paddingHorizontal: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          marginHorizontal: 2,
          borderRadius: 12,
          backgroundColor: 'transparent',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        // Remove header for all tab screens to match your HomeScreen
        headerShown: false,
      }}
    >
      <Tabs.Screen 
        name="HomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon 
              icon={icons.home} 
              focused={focused} 
              color={color}
            />
          ),
          tabBarItemStyle: {
            ...styles.tabBarItem,
            backgroundColor: 'transparent'
          }
        }}
      />
      
      <Tabs.Screen 
        name="MapScreen"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon 
              icon={icons.map} 
              focused={focused} 
              color={color}
            />
          ),
          tabBarItemStyle: {
            ...styles.tabBarItem,
            backgroundColor: 'transparent'
          }
        }}
      />
      
      <Tabs.Screen 
        name="ReportScreen"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon 
              icon={icons.report} 
              focused={focused} 
              color={color}
            />
          ),
          tabBarItemStyle: {
            ...styles.tabBarItem,
            backgroundColor: 'transparent'
          }
        }}
      />
      
      <Tabs.Screen 
        name="SettingScreen"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon 
              icon={icons.settings} 
              focused={focused} 
              color={color}
            />
          ),
          tabBarItemStyle: {
            ...styles.tabBarItem,
            backgroundColor: 'transparent'
          }
        }}
      />

      {/* Hidden screens - not part of tab bar */}
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          href: null, // This disables it from being part of the tab bar
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="NotificationScreen"
        options={{
          href: null, // This disables it from being part of the tab bar
          headerShown: false,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedIcon: {
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 87, 0.3)',
    shadowColor: '#feca57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.1 }],
  },
  unfocusedIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});