import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const AuthLayout = () => {

  return (
    <Stack>
      <Stack.Screen 
        name="RegisterScreen" 
        options={{
          headerShown: false,
          title: 'Register'
        }}
      />
      <Stack.Screen 
        name="UserLoginScreen" 
        options={{
          headerShown: false,
          title: 'Login'
        }}
      />


      <Stack.Screen 
        name="AdminLoginScreen" 
        options={{
          headerShown: false,
          title: 'Admin Login'
        }}
      />
    </Stack>
  )
}

export default AuthLayout

const styles = StyleSheet.create({})