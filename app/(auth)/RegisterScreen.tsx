import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import FormField from '@/components/CustomFormField'
import CustomButton from '@/components/CustomButton'
import * as Animatable from 'react-native-animatable'
import { useAuth } from '../contexts/AuthContext'

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
   const router = useRouter();
   const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
   const [form, setform] = useState({ 
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
   });

   // Redirect if already authenticated
   useEffect(() => {
     if (isAuthenticated) {
       router.replace('/(tabs)/HomeScreen');
     }
   }, [isAuthenticated, router]);

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

   const handleConfirmPasswordChange = (text: string) => {
     setform({...form, confirmPassword: text})
     if (error) clearError();
   }

   const handleFirstNameChange = (text: string) => {
     setform({...form, first_name: text})
     if (error) clearError();
   }

   const handleLastNameChange = (text: string) => {
     setform({...form, last_name: text})
     if (error) clearError();
   }

   const handlePhoneChange = (text: string) => {
     setform({...form, phone: text})
     if (error) clearError();
   }

   const handleRegister = async () => {
     try {
       // Validation
       if (!form.email || !form.password || !form.confirmPassword || !form.first_name || !form.last_name) {
         alert('Please fill in all required fields');
         return;
       }

       // Email validation
       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if (!emailRegex.test(form.email)) {
         alert('Please enter a valid email address');
         return;
       }

       // Password validation
       if (form.password.length < 6) {
         alert('Password must be at least 6 characters long');
         return;
       }

       if (form.password !== form.confirmPassword) {
         alert('Passwords do not match');
         return;
       }

       // Name validation
       if (form.first_name.trim().length < 2) {
         alert('First name must be at least 2 characters long');
         return;
       }

       if (form.last_name.trim().length < 2) {
         alert('Last name must be at least 2 characters long');
         return;
       }

       // Phone validation (optional)
       if (form.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(form.phone.replace(/\s/g, ''))) {
         alert('Please enter a valid phone number');
         return;
       }

       // Attempt registration
       const userData = {
         email: form.email.trim(),
         password: form.password,
         first_name: form.first_name.trim(),
         last_name: form.last_name.trim(),
         phone: form.phone.trim() || undefined,
       };

       const success = await register(userData);
       if (success) {
         // Registration successful - user will be redirected by useEffect
         console.log('Registration successful, redirecting...');
       } else {
         // Error is handled by the auth context
         console.log('Registration failed');
       }
     } catch (error) {
       console.error('Registration error:', error);
       alert('An unexpected error occurred. Please try again.');
     }
   };

   const handleLoginPress = () => {
     router.push('/(auth)/UserLoginScreen');
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
          animation="rotate" 
          iterationCount="infinite" 
          duration={20000}
          style={[styles.floatingElement, styles.element1]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={4000}
          delay={1000}
          style={[styles.floatingElement, styles.element2]}
        />
        <Animatable.View 
          animation="bounce" 
          iterationCount="infinite" 
          duration={3000}
          delay={500}
          style={[styles.floatingElement, styles.element3]}
        />

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.container}>
            
            {/* Header Section with Glassmorphism */}
            <Animatable.View 
              animation="fadeInDown" 
              duration={1000}
              style={styles.headerSection}
            >
              <View style={styles.brandGlass}>
                <View style={styles.brandContainer}>
                  <Image 
                    source={require('../../assets/images/logo.png')}
                    style={styles.logo}
                  />
                  <View style={styles.brandTextContainer}>
                    <Text style={styles.brandText}>ROADBRO</Text>
                    <View style={styles.brandUnderline} />
                  </View>
                </View>
                <Text style={styles.welcomeText}>Create Your Account</Text>
                <Text style={styles.subtitleText}>Join thousands of road explorers</Text>
              </View>
            </Animatable.View>

            {/* Form Section */}
            <Animatable.View 
              animation="fadeInUp" 
              duration={1000}
              delay={300}
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

                <View style={styles.inputContainer}>
                  <FormField
                    title="Confirm Password"
                    value={form.confirmPassword}
                    handleChangeText={handleConfirmPasswordChange}
                    otherStyles={true}
                    marginTop={0}
                    marginBottom={0}
                    isPassword={true}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <FormField
                    title="First Name"
                    value={form.first_name}
                    handleChangeText={handleFirstNameChange}
                    otherStyles={true}
                    marginTop={0}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <FormField
                    title="Last Name"
                    value={form.last_name}
                    handleChangeText={handleLastNameChange}
                    otherStyles={true}
                    marginTop={0}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <FormField
                    title="Phone"
                    value={form.phone}
                    handleChangeText={handlePhoneChange}
                    otherStyles={true}
                    marginTop={0}
                  />
                </View>

                {/* Password Strength Indicator */}
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBar}>
                    <View style={[styles.strengthSegment, { backgroundColor: form.password.length > 3 ? '#feca57' : '#e0e0e0' }]} />
                    <View style={[styles.strengthSegment, { backgroundColor: form.password.length > 6 ? '#ff9ff3' : '#e0e0e0' }]} />
                    <View style={[styles.strengthSegment, { backgroundColor: form.password.length > 8 ? '#54a0ff' : '#e0e0e0' }]} />
                    <View style={[styles.strengthSegment, { backgroundColor: form.password.length > 10 ? '#5f27cd' : '#e0e0e0' }]} />
                  </View>
                  <Text style={styles.strengthText}>
                    {form.password.length === 0 ? 'Password strength' : 
                     form.password.length <= 3 ? 'Weak' :
                     form.password.length <= 6 ? 'Fair' :
                     form.password.length <= 8 ? 'Good' : 'Strong'}
                  </Text>
                </View>

                {/* Enhanced Register Button */}
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#cccccc', '#999999'] : ['#ff6b6b', '#feca57', '#48dbfb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.registerButtonText}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Text>
                    {!isLoading && <View style={styles.buttonSparkle} />}
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </Animatable.View>

            {/* Login Link Section */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={600}
              style={styles.loginSection}
            >
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity 
                style={styles.loginContainer}
                onPress={handleLoginPress}
                activeOpacity={0.7}
              >
                <View style={styles.loginGlass}>
                  <Text style={styles.loginText}>
                    Already have an account?
                  </Text>
                  <Text style={styles.loginLink}>Sign In</Text>
                </View>
              </TouchableOpacity>
            </Animatable.View>

            {/* Social Login Options */}
            <Animatable.View 
              animation="fadeIn" 
              duration={1000}
              delay={800}
              style={styles.socialSection}
            >
              <Text style={styles.socialText}>Quick sign up with</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>f</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>@</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

export default RegisterScreen

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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 100,
  },
  element1: {
    width: 150,
    height: 150,
    top: '8%',
    right: '-10%',
  },
  element2: {
    width: 100,
    height: 100,
    bottom: '20%',
    left: '-15%',
  },
  element3: {
    width: 80,
    height: 80,
    top: '40%',
    right: '10%',
  },

  // Header Section
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  brandGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  brandTextContainer: {
    alignItems: 'flex-start',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: '#feca57',
    borderRadius: 1,
    marginTop: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Form Section
  formSection: {
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Password Strength
  passwordStrength: {
    marginBottom: 24,
  },
  strengthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  strengthText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Register Button
  registerButton: {
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
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonSparkle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Login Section
  loginSection: {
    marginBottom: 30,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  loginContainer: {
    width: '100%',
  },
  loginGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  loginLink: {
    color: '#feca57',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Social Section
  socialSection: {
    alignItems: 'center',
  },
  socialText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});