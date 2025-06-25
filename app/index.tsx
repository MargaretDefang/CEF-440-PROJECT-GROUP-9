import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import CustomButton from "../components/CustomButton";
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get("window");

export default function RootLayout() {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        
        {/* Floating Background Elements */}
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={4000}
          style={[styles.floatingElement, styles.element1]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={6000}
          delay={1000}
          style={[styles.floatingElement, styles.element2]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={5000}
          delay={2000}
          style={[styles.floatingElement, styles.element3]}
        />

        {/* Main Content Container */}
        <View style={styles.contentContainer}>
          
          {/* Logo Section with Glassmorphism Effect */}
          <Animatable.View 
            animation="fadeInDown" 
            duration={1000}
            style={styles.logoSection}
          >
            <View style={styles.logoGlass}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>ROADBRO</Text>
                  <View style={styles.titleUnderline} />
                </View>
              </View>
            </View>
          </Animatable.View>

          {/* Hero Slogan with Gradient Text Effect */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={300}
            style={styles.sloganSection}
          >
            <Text style={styles.heroText}>
              Your <Text style={styles.gradientText}>ultimate</Text>
            </Text>
            <Text style={styles.heroText}>
              <Text style={styles.accentText}>companion</Text> on the road
            </Text>
            <View style={styles.sloganDivider} />
            <Text style={styles.subtitle}>
              Experience the future of road travel with AI-powered navigation
            </Text>
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={600}
            style={styles.buttonSection}
          >
            {/* Primary CTA Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/(auth)/RegisterScreen")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#48dbfb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <View style={styles.buttonGlow} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/(tabs)/HomeScreen")}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonInner}>
                <Text style={styles.secondaryButtonText}>Explore Home</Text>
              </View>
            </TouchableOpacity>

            {/* Admin Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/(admin)/AdminDashboard")}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonInner}>
                <Text style={styles.secondaryButtonText}>Admin</Text>
              </View>
            </TouchableOpacity>
          </Animatable.View>

          {/* Feature Highlights */}
          <Animatable.View 
            animation="fadeIn" 
            duration={1000}
            delay={900}
            style={styles.featuresContainer}
          >
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Smart Navigation</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Real-time Updates</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Community Driven</Text>
            </View>
          </Animatable.View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  
  // Floating Background Elements
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },
  element1: {
    width: 120,
    height: 120,
    top: '10%',
    right: '10%',
  },
  element2: {
    width: 80,
    height: 80,
    bottom: '25%',
    left: '5%',
  },
  element3: {
    width: 60,
    height: 60,
    top: '30%',
    left: '15%',
  },

  // Main Content
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Logo Section with Glassmorphism
  logoSection: {
    marginBottom: 40,
  },
  logoGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: '100%',
    height: 3,
    backgroundColor: '#feca57',
    borderRadius: 2,
    marginTop: 4,
  },

  // Hero Section
  sloganSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  heroText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gradientText: {
    color: '#feca57',
    fontWeight: '900',
  },
  accentText: {
    color: '#48dbfb',
    fontWeight: '900',
  },
  sloganDivider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 20,
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },

  // Buttons Section
  buttonSection: {
    width: '100%',
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
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
  primaryButtonText: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.8,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Features Section
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#feca57',
    marginBottom: 8,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
