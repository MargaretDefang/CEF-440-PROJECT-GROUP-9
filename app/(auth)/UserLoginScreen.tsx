import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Dimensions, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import FormField from '@/components/CustomFormField'
import CustomButton from '@/components/CustomButton'
import * as Animatable from 'react-native-animatable'
import { useAuth } from '../contexts/AuthContext'

const { width, height } = Dimensions.get('window');

const UserLoginScreen = () => {
   const router = useRouter();
   const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
   const [form, setform] = useState({ 
    email: '',
    password: '',
   });

  // Redirect if already authenticated
  useEffect(() => {
    console.log('UserLoginScreen - isAuthenticated:', isAuthenticated);
    console.log('UserLoginScreen - user:', user);
    console.log('UserLoginScreen - user_type:', user?.user_type);
    
    if (isAuthenticated && user) {
      if (user.user_type === 'admin') {
        console.log('Redirecting admin to AdminDashboard');
        router.replace('/(admin)/AdminDashboard');
      } else {
        console.log('Redirecting user to HomeScreen');
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
        clearError(); // Clear error after successful login
        // Login successful - user will be redirected by useEffect
        console.log('Login successful, redirecting...');
      } else {
        // Error is handled by the auth context
        console.log('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleRegisterPress = () => {
    router.push('/(auth)/RegisterScreen');
  };

  const handleAdminLogin = () => {
    router.push('/(auth)/AdminLoginScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Background Elements */}
        <Animatable.View 
          animation="slideInLeft" 
          iterationCount="infinite" 
          direction="alternate"
          duration={8000}
          style={[styles.floatingElement, styles.element1]}
        />
        <Animatable.View 
          animation="fadeIn" 
          iterationCount="infinite" 
          duration={5000}
          delay={2000}
          style={[styles.floatingElement, styles.element2]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={6000}
          delay={1000}
          style={[styles.floatingElement, styles.element3]}
        />

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.container}>
            
            {/* Welcome Back Header */}
            <Animatable.View 
              animation="fadeInDown" 
              duration={1000}
              style={styles.headerSection}
            >
              <View style={styles.welcomeGlass}>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSubtitle}>Ready for your next adventure?</Text>
                <View style={styles.welcomeDivider} />
              </View>
            </Animatable.View>

            {/* Brand Section with Enhanced Glassmorphism */}
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
                    <Text style={styles.brandTagline}>Your Road Companion</Text>
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
                
                {/* Enhanced Form Fields */}
                <View style={styles.inputContainer}>
                  <FormField
                    title="Email Address"
                    value={form.email}
                    handleChangeText={handleEmailChange}
                    otherStyles={true}
                    marginTop={0}
                    placeholder="Enter your email"
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
                    placeholder="Enter your password"
                  />
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Enhanced Login Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#cccccc', '#999999'] : ['#ff6b6b', '#feca57', '#48dbfb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
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

            {/* Biometric Section */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={600}
              style={styles.biometricSection}
            >
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity style={styles.biometricButton}>
                <View style={styles.biometricIcon}>
                  <Text style={styles.biometricEmoji}>🔐</Text>
                </View>
                <Text style={styles.biometricText}>Sign in with Biometrics</Text>
              </TouchableOpacity>
            </Animatable.View>

            {/* Register Section */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={800}
              style={styles.registerSection}
            >
              <View style={styles.registerContainer}>
                <View style={styles.registerGlass}>
                  <Text style={styles.registerText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={handleRegisterPress}>
                    <Text style={styles.registerLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animatable.View>

            {/* Admin Login Section */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={1000}
              style={styles.adminSection}
            >
              <TouchableOpacity onPress={handleAdminLogin} style={styles.adminButton}>
                <Text style={styles.adminText}>Admin Login</Text>
              </TouchableOpacity>
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
    backgroundColor: '#667eea',
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
    justifyContent: 'center',
  },

  // Floating Background Elements
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 100,
  },
  element1: {
    width: 180,
    height: 180,
    top: '5%',
    right: '-20%',
  },
  element2: {
    width: 120,
    height: 120,
    bottom: '15%',
    left: '-20%',
  },
  element3: {
    width: 90,
    height: 90,
    top: '35%',
    right: '5%',
  },

  // Header Section
  headerSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  welcomeDivider: {
    width: 80,
    height: 3,
    backgroundColor: '#feca57',
    borderRadius: 2,
  },

  // Brand Section
  brandSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  brandGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  logoGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    backgroundColor: 'rgba(254, 202, 87, 0.3)',
    zIndex: -1,
  },
  brandTextContainer: {
    alignItems: 'flex-start',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: '#feca57',
    borderRadius: 1,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Error Container
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
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
  inputContainer: {
    marginBottom: 20,
  },
  inputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputFocused: {
    borderColor: '#feca57',
  },
  otherStyles: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#feca57',
    fontSize: 14,
    fontWeight: '600',
  },

  // Login Button
  loginButton: {
    height: 56,
    borderRadius: 28,
    shadowColor: '#ff6b6b',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Biometric Section
  biometricSection: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  biometricIcon: {
    marginRight: 12,
  },
  biometricEmoji: {
    fontSize: 24,
  },
  biometricText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Register Section
  registerSection: {
    marginBottom: 20,
  },
  registerContainer: {
    width: '100%',
  },
  registerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  registerLink: {
    color: '#48dbfb',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Admin Section
  adminSection: {
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  adminText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UserLoginScreen;