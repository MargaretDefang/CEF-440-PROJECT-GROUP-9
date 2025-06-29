import { StyleSheet, Text, View } from 'react-native'
import { Slot, Stack } from 'expo-router'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'

const RootLayout = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Stack>
          <Stack.Screen 
            name="index" 
            options={{
              headerShown: false,
              title: 'Welcome'
            }}
          />
          <Stack.Screen 
            name="(auth)" 
            options={{
              headerShown: false,
              animation: 'slide_from_right'
            }}
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{
              headerShown: false,
              animation: 'slide_from_right'
            }}
          />
          <Stack.Screen 
            name="(admin)" 
            options={{
              headerShown: false,
              animation: 'slide_from_right'
            }}
          />
        </Stack>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default RootLayout

