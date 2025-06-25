import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  Platform,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';

interface SettingOption {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  type: 'toggle' | 'navigation' | 'selector';
  value?: boolean | string;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('English');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [loading, setLoading] = useState(false);

  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  const animatePress = (index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLanguageSelect = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => setLanguage('English') },
        { text: 'French', onPress: () => setLanguage('French') },
        { text: 'Spanish', onPress: () => setLanguage('Spanish') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Preferences',
      options: [
        {
          id: 'language',
          title: 'Language',
          icon: 'language' as const,
          type: 'selector' as const,
          value: language,
          onPress: handleLanguageSelect
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: 'notifications' as const,
          type: 'toggle' as const,
          value: notificationsEnabled
        },
        {
          id: 'voice',
          title: 'Voice Guidance',
          icon: 'record-voice-over' as const,
          type: 'toggle' as const,
          value: voiceEnabled
        },
      ]
    },
    {
      title: 'Support & Legal',
      options: [
        {
          id: 'help',
          title: 'Help & Support',
          icon: 'help' as const,
          type: 'navigation' as const,
          onPress: () => console.log('Help pressed')
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'policy' as const,
          type: 'navigation' as const,
          onPress: () => console.log('Privacy pressed')
        },
        {
          id: 'about',
          title: 'About ROADBRO',
          icon: 'info' as const,
          type: 'navigation' as const,
          onPress: () => console.log('About pressed')
        }
      ]
    }
  ];

  const handleToggle = (optionId: string, value: boolean) => {
    switch (optionId) {
      case 'notifications':
        setNotificationsEnabled(value);
        break;
      case 'voice':
        setVoiceEnabled(value);
        break;

    }
  };

  const renderSettingOption = (option: any, index: number, sectionIndex: number) => {
    const animIndex = sectionIndex * 10 + index; // Unique index for each item
    const actualAnimIndex = animIndex < scaleAnims.length ? animIndex : 0;

    return (
      <Animated.View
        key={option.id}
        style={[
          styles.optionWrapper,
          { transform: [{ scale: scaleAnims[actualAnimIndex] }] }
        ]}
      >
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => {
            animatePress(actualAnimIndex);
            if (option.onPress) {
              option.onPress();
            }
          }}
          activeOpacity={option.type === 'toggle' ? 1 : 0.8}
          disabled={option.type === 'toggle'}
        >
          <View style={styles.optionGlass}>
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <MaterialIcons name={option.icon} size={22} color="#feca57" />
              </View>
              <Text style={styles.optionText}>{option.title}</Text>
            </View>
            
            <View style={styles.optionRight}>
              {option.type === 'toggle' && (
                <Switch
                  value={option.value as boolean}
                  onValueChange={(value) => handleToggle(option.id, value)}
                  trackColor={{ false: "rgba(255, 255, 255, 0.2)", true: "rgba(254, 202, 87, 0.3)" }}
                  thumbColor={option.value ? "#feca57" : "rgba(255, 255, 255, 0.8)"}
                  ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                />
              )}
              
              {option.type === 'selector' && (
                <>
                  <Text style={styles.optionValue}>{option.value as string}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.7)" />
                </>
              )}
              
              {option.type === 'navigation' && (
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.7)" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>Customize your experience</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerButton}>
                  <MaterialIcons name="more-vert" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Settings Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {settingsSections.map((section, sectionIndex) => (
            <Animatable.View 
              key={section.title}
              animation="fadeInUp" 
              duration={1000}
              delay={300 + (sectionIndex * 200)}
              style={styles.sectionContainer}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionGlass}>
                {section.options.map((option, optionIndex) => 
                  renderSettingOption(option, optionIndex, sectionIndex)
                )}
              </View>
            </Animatable.View>
          ))}

          {/* App Info Section */}
          <Animatable.View 
            animation="fadeIn" 
            duration={1000}
            delay={800}
            style={styles.appInfoSection}
          >
            <View style={styles.appInfoGlass}>
              <View style={styles.appInfoContent}>
                <View style={styles.appLogoContainer}>
                  <MaterialIcons name="directions-car" size={32} color="#feca57" />
                </View>
                <Text style={styles.appName}>ROADBRO</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
                <Text style={styles.appDescription}>Your trusted road companion for safe travels</Text>
              </View>
            </View>
          </Animatable.View>
        </ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <Animatable.View 
              animation="fadeIn" 
              style={styles.loadingGlass}
            >
              <Animatable.View 
                animation="rotate" 
                iterationCount="infinite" 
                duration={1000}
              >
                <MaterialIcons name="refresh" size={32} color="#feca57" />
              </Animatable.View>
              <Text style={styles.loadingText}>Updating...</Text>
            </Animatable.View>
          </View>
        )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    width: 44, // Same width as back button for balance
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },

  // Option Styles
  optionWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCard: {
    paddingHorizontal: 0,
  },
  optionGlass: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: 'rgba(254, 202, 87, 0.15)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
    fontWeight: '500',
  },

  // App Info Section
  appInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appInfoGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 24,
  },
  appInfoContent: {
    alignItems: 'center',
  },
  appLogoContainer: {
    backgroundColor: 'rgba(254, 202, 87, 0.15)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 12,
    fontWeight: '600',
  },
});