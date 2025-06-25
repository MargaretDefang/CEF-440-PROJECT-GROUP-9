import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Dimensions, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import FormField from '@/components/CustomFormField'
import * as Animatable from 'react-native-animatable'
import { useAuth } from '../contexts/AuthContext'

const { width, height } = Dimensions.get('window');

const AdminLoginScreen = () => {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
  const [form, setform] = useState({ 
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    console.log('AdminLoginScreen - isAuthenticated:', isAuthenticated);
    console.log('AdminLoginScreen - user:', user);
    console.log('AdminLoginScreen - user_type:', user?.user_type);
    
    if (isAuthenticated) {
      if (user?.user_type === 'admin') {
        console.log('Redirecting admin to AdminDashboard');
        router.replace('/(admin)/AdminDashboard');
      } else {
        console.log('Redirecting non-admin to HomeScreen');
        router.replace('/(tabs)/HomeScreen');
      }
    }
  }, [isAuthenticated, user, router]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const handleEmailChange = (text: string) => {
    setform({...form, email: text})
    if (error) clearError();
  }

  const handlePasswordChange = (text: string) => {
    setform({...form, password: text})
    if (error) clearError();
  }

  const handleLogin = async () => {
    try {
      // Validation
      if (!form.email || !form.password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      // Attempt login
      const success = await login(form.email, form.password);
      
      if (success) {
        // Check if user is admin
        if (user?.user_type === 'admin') {
          clearError(); // Clear error after successful admin login
          console.log('Admin login successful, redirecting...');
          router.replace('/(admin)/AdminDashboard');
        } else {
          Alert.alert('Access Denied', 'You do not have admin privileges. Please use the regular login.');
          // Clear the login and redirect to user login
          router.replace('/(auth)/UserLoginScreen');
        }
      } else {
        // Error is handled by the auth context
        console.log('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleUserLogin = () => {
    router.push('/(auth)/UserLoginScreen');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#2c3e50', '#34495e', '#8e44ad']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Background Elements */}
        <Animatable.View 
          animation="slideInRight" 
          iterationCount="infinite" 
          direction="alternate"
          duration={10000}
          style={[styles.floatingElement, styles.element1]}
        />
        <Animatable.View 
          animation="fadeIn" 
          iterationCount="infinite" 
          duration={6000}
          delay={2000}
          style={[styles.floatingElement, styles.element2]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={8000}
          delay={1000}
          style={[styles.floatingElement, styles.element3]}
        />

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.container}>
            
            {/* Back Button */}
            <Animatable.View 
              animation="fadeInDown" 
              duration={1000}
              style={styles.backButtonContainer}
            >
              <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </Animatable.View>

            {/* Admin Header */}
            <Animatable.View 
              animation="fadeInDown" 
              duration={1000}
              style={styles.headerSection}
            >
              <View style={styles.adminGlass}>
                <View style={styles.adminIconContainer}>
                  <Text style={styles.adminIcon}>👨‍💼</Text>
                  <View style={styles.adminIconGlow} />
                </View>
                <Text style={styles.adminTitle}>Admin Portal</Text>
                <Text style={styles.adminSubtitle}>System Administration Access</Text>
                <View style={styles.adminDivider} />
              </View>
            </Animatable.View>

            {/* Brand Section */}
            <Animatable.View 
              animation="zoomIn" 
              duration={1000}
              delay={200}
              style={styles.brandSection}
            >
              <View style={styles.brandGlass}>
                <View style={styles.brandContainer}>
                  <View style={styles.logoWrapper}>
                    <Image 
                      source={require('../../assets/images/logo.png')}
                      style={styles.logo}
                    />
                    <View style={styles.logoGlow} />
                  </View>
                  <View style={styles.brandTextContainer}>
                    <Text style={styles.brandText}>ROADBRO</Text>
                    <View style={styles.brandUnderline} />
                    <Text style={styles.brandTagline}>Administration Panel</Text>
                  </View>
                </View>
              </View>
            </Animatable.View>

            {/* Error Message */}
            {error && (!user || user.user_type !== 'admin') && (
              <Animatable.View 
                animation="shake" 
                duration={500}
                style={styles.errorContainer}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            )}

            {/* Login Form Section */}
            <Animatable.View 
              animation="fadeInUp" 
              duration={1000}
              delay={400}
              style={styles.formSection}
            >
              <View style={styles.formContainer}>
                
                {/* Admin Credentials Notice */}
                <View style={styles.noticeContainer}>
                  <Text style={styles.noticeIcon}>⚠️</Text>
                  <Text style={styles.noticeText}>
                    This portal is restricted to authorized administrators only.
                  </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.inputContainer}>
                  <FormField
                    title="Email Address"
                    value={form.email}
                    handleChangeText={handleEmailChange}
                    otherStyles={true}
                    marginTop={0}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <FormField
                    title="Password"
                    value={form.password}
                    handleChangeText={handlePasswordChange}
                    otherStyles={true}
                    marginTop={0}
                    marginBottom={0}
                    isPassword={true}
                  />
                </View>

                {/* Enhanced Login Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#cccccc', '#999999'] : ['#e74c3c', '#c0392b', '#8e44ad']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Authenticating...' : 'Admin Login'}
                    </Text>
                    {!isLoading && (
                      <>
                        <View style={styles.buttonGlow} />
                        <Animatable.View 
                          animation="pulse" 
                          iterationCount="infinite" 
                          duration={2000}
                          style={styles.buttonPulse}
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </Animatable.View>

            {/* User Login Section */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={600}
              style={styles.userLoginSection}
            >
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity onPress={handleUserLogin} style={styles.userLoginButton}>
                <View style={styles.userLoginIcon}>
                  <Text style={styles.userLoginEmoji}>👤</Text>
                </View>
                <Text style={styles.userLoginText}>Regular User Login</Text>
              </TouchableOpacity>
            </Animatable.View>

            {/* Security Notice */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={800}
              style={styles.securitySection}
            >
              <View style={styles.securityGlass}>
                <Text style={styles.securityTitle}>🔒 Security Notice</Text>
                <Text style={styles.securityText}>
                  All admin activities are logged and monitored for security purposes.
                </Text>
              </View>
            </Animatable.View>

          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: height,
  },

  // Back Button
  backButtonContainer: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Floating Background Elements
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 100,
  },
  element1: {
    width: 200,
    height: 200,
    top: '10%',
    right: '-25%',
  },
  element2: {
    width: 150,
    height: 150,
    bottom: '20%',
    left: '-25%',
  },
  element3: {
    width: 100,
    height: 100,
    top: '50%',
    right: '10%',
  },

  // Header Section
  headerSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  adminGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  adminIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  adminIcon: {
    fontSize: 48,
  },
  adminIconGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: 'rgba(142, 68, 173, 0.3)',
    zIndex: -1,
  },
  adminTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  adminSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  adminDivider: {
    width: 100,
    height: 3,
    backgroundColor: '#8e44ad',
    borderRadius: 2,
  },

  // Brand Section
  brandSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  brandGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    backgroundColor: 'rgba(142, 68, 173, 0.3)',
    zIndex: -1,
  },
  brandTextContainer: {
    alignItems: 'flex-start',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 2,
  },
  brandUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: '#8e44ad',
    borderRadius: 1,
  },
  brandTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontWeight: '500',
  },

  // Error Container
  errorContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Form Section
  formSection: {
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  noticeContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  noticeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputFocused: {
    borderColor: '#8e44ad',
  },
  otherStyles: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleIcon: {
    width: 24,
    height: 24,
  },

  // Login Button
  loginButton: {
    height: 56,
    borderRadius: 28,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    position: 'relative',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // User Login Section
  userLoginSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  userLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  userLoginIcon: {
    marginRight: 12,
  },
  userLoginEmoji: {
    fontSize: 24,
  },
  userLoginText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Security Section
  securitySection: {
    alignItems: 'center',
  },
  securityGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  securityTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AdminLoginScreen; 