import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Alert,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Image,
  Modal,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Interfaces
interface ActionFunction {
  (): Promise<void>;
}

interface SignCategory {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient: [string, string];
  signs: string[];
}

interface RoadSign {
  name: string;
  category: string;
}

const { width, height } = Dimensions.get('window');

export default function UserHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SignCategory | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  // Comprehensive sign categories with all signs
  const signCategories: SignCategory[] = [
    {
      title: 'Order Signs',
      icon: 'gavel' as const,
      gradient: ['#667eea', '#764ba2'] as const,
      description: 'Regulatory & control signs',
      signs: [
        'Stop Sign',
        'Yield Sign',
        'Speed Limit Sign',
        'No Parking Sign',
        'No Entry Sign',
        'One Way Sign',
        'Do Not Enter Sign',
        'No U-Turn Sign',
        'No Left Turn Sign',
        'No Right Turn Sign',
        'Weight Limit Sign',
        'Height Limit Sign',
        'No Trucks Sign',
        'No Bicycles Sign',
        'No Pedestrian Crossing Sign',
        'Lane Use Control Signs',
        'Mandatory Direction Signs',
        'Traffic Signal Signs',
        'Pedestrian Signal Signs'
      ] as const
    },
    {
      title: 'Danger Signs',
      icon: 'warning' as const,
      gradient: ['#ff6b6b', '#feca57'] as const,
      description: 'Warning & hazard signs',
      signs: [
        'Curve Ahead Sign',
        'Sharp Turn Sign',
        'Intersection Ahead Sign',
        'Pedestrian Crossing Sign',
        'School Zone Sign',
        'Children Playing Sign',
        'Deer Crossing Sign',
        'Animal Crossing Sign',
        'Roadwork Ahead Sign',
        'Construction Zone Ahead',
        'Lane Reduction Sign',
        'Merge Sign',
        'Slippery Road Sign',
        'Falling Rocks Sign',
        'Bridge Ahead Sign',
        'Signal Ahead Sign',
        'Uneven Pavement Sign',
        'Steep Grade Sign',
        'Two-Way Traffic Sign',
        'Divided Highway Sign'
      ] as const
    },
    {
      title: 'Information Signs',
      icon: 'info' as const,
      gradient: ['#48dbfb', '#0abde3'] as const,
      description: 'Service & facility signs',
      signs: [
        'Food Service Sign',
        'Fuel/Gas Station Sign',
        'Lodging/Hotel Sign',
        'Rest Stop Sign',
        'Hospital Sign',
        'Emergency Phone Sign',
        'Information Center Sign',
        'Tourist Attraction Sign',
        'Parking Sign',
        'Recreational Area Sign',
        'Scenic Route Sign',
        'Historical Marker Sign',
        'Camping Sign',
        'Picnic Area Sign',
        'Restroom Sign'
      ] as const
    },
    {
      title: 'Location Signs',
      icon: 'location-on' as const,
      gradient: ['#1dd1a1', '#10ac84'] as const,
      description: 'Place identification signs',
      signs: [
        'City/Town Name Sign',
        'Street Name Sign',
        'Highway Marker Sign',
        'Interstate Sign',
        'State Route Sign',
        'County Route Sign',
        'Mile Marker Sign',
        'Kilometer Post Sign',
        'Border Crossing Sign',
        'State Line Sign',
        'County Line Sign',
        'Welcome Sign',
        'Business District Sign'
      ] as const
    },
    {
      title: 'Directional Signs',
      icon: 'navigation' as const,
      gradient: ['#feca57', '#ff9ff3'] as const,
      description: 'Route & navigation signs',
      signs: [
        'Highway Direction Sign',
        'Exit Sign',
        'Next Exit Sign',
        'Detour Sign',
        'Lane Designation Sign',
        'Left Lane Sign',
        'Right Lane Sign',
        'Center Lane Sign',
        'Intersection Sign',
        'Merge Ahead Sign',
        'Guide Sign',
        'Distance Sign',
        'Junction Sign',
        'Route Confirmation Sign',
        'Advance Guide Sign'
      ] as const
    },
    {
      title: 'Construction Signs',
      icon: 'construction' as const,
      gradient: ['#ff9500', '#ff5722'] as const,
      description: 'Work zone & construction signs',
      signs: [
        'Road Work Ahead',
        'Construction Zone',
        'Workers Present',
        'Flagging Operations',
        'Lane Closed Ahead',
        'Detour',
        'End Construction',
        'Reduced Speed Ahead',
        'Fresh Oil',
        'Loose Gravel',
        'Bump',
        'Dip',
        'Road Closed',
        'Local Traffic Only',
        'Pilot Car Follow Me',
        'One Lane Road Ahead',
        'Be Prepared to Stop',
        'Survey Crew',
        'Mowing Operations',
        'Maintenance Operations'
      ] as const
    }
  ] as const;

  // Error handling wrapper
  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      Alert.alert(
        'Oops! Something went wrong',
        `We couldn't ${actionName.toLowerCase()}. Please check your connection and try again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => handleAction(action, actionName) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

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

  const handleSignPress = async (category: SignCategory, index: number) => {
    animatePress(index);
    await handleAction(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        setSelectedCategory(category);
        setModalVisible(true);
      },
      `Open ${category.title}`
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategory(null);
  };

  const renderSignItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.signItem}>
      <View style={styles.signItemIcon}>
        <MaterialIcons name="traffic" size={20} color="#667eea" />
      </View>
      <Text style={styles.signItemText}>{item}</Text>
      <MaterialIcons name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

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
          duration={25000}
          style={[styles.floatingElement, styles.element1]}
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          duration={4500}
          delay={1500}
          style={[styles.floatingElement, styles.element2]}
        />
        <Animatable.View 
          animation="bounce" 
          iterationCount="infinite" 
          duration={3500}
          delay={800}
          style={[styles.floatingElement, styles.element3]}
        />

        {/* Enhanced Header with Glassmorphism */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000}
          style={styles.headerSection}
        >
          <View style={styles.headerGlass}>
            <View style={styles.headerTop}>
              <View style={styles.brandContainer}>
                <View style={styles.logoWrapper}>
                  <View style={styles.logoPlaceholder}>
                    <MaterialIcons name="traffic" size={30} color="#feca57" />
                  </View>
                  <View style={styles.logoGlow} />
                </View>
                <View style={styles.brandTextContainer}>
                  <Text style={styles.brandText}>ROADBRO</Text>
                  <View style={styles.brandUnderline} />
                  <Text style={styles.brandTagline}>Your Road Companion</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => router.push('/(tabs)/NotificationScreen')}
                >
                  <MaterialIcons name="notifications" size={22} color="white" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => router.push('/ProfileScreen')}
                >
                  <MaterialIcons name="person" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.subtitleText}>Ready for your next road adventure?</Text>
          </View>
        </Animatable.View>

        {/* Modern Search Bar with Glass Effect */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000}
          delay={200}
          style={styles.searchSection}
        >
          <TouchableOpacity 
            style={styles.searchGlass}
            onPress={() => handleAction(
              async () => {
                console.log('Opening search...');
              },
              'Open search'
            )}
          >
            <View style={styles.searchContent}>
              <MaterialIcons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.searchPlaceholder}>Search signs...</Text>
              <View style={styles.searchFilter}>
                <MaterialIcons name="tune" size={18} color="#feca57" />
              </View>
            </View>
          </TouchableOpacity>
        </Animatable.View>

        {/* Enhanced Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sign Categories */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={600}
            style={styles.categoriesSection}
          >
            <Text style={styles.sectionTitle}>Sign Categories</Text>
            <Text style={styles.sectionSubtitle}>
              {signCategories.reduce((total, category) => total + category.signs.length, 0)} signs across {signCategories.length} categories
            </Text>
            
            <View style={styles.signsContainer}>
              {signCategories.map((category, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.signCardWrapper,
                    { transform: [{ scale: scaleAnims[index] }] }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.signCard}
                    onPress={() => handleSignPress(category, index)}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[...category.gradient, category.gradient[1] + '99']}
                      style={styles.signGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.signIconContainer}>
                        <View style={styles.iconGlow}>
                          <MaterialIcons 
                            name={category.icon} 
                            size={28} 
                            color="white" 
                          />
                        </View>
                      </View>
                      <View style={styles.signContent}>
                        <Text style={styles.signTitle}>{category.title}</Text>
                        <Text style={styles.signDescription}>{category.description}</Text>
                        <Text style={styles.signCount}>{category.signs.length} signs</Text>
                      </View>
                      <View style={styles.signArrow}>
                        <MaterialIcons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.9)" />
                      </View>
                      <View style={styles.cardGlow} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animatable.View>

          {/* Quick Actions */}
          <Animatable.View 
            animation="fadeIn" 
            duration={1000}
            delay={800}
            style={styles.quickActionsSection}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGlass}>
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickActionItem}
                  onPress={() => router.push('/ReportScreen')}
                >
                  <View style={styles.quickActionIcon}>
                    <MaterialIcons name="report-problem" size={24} color="#ff6b6b" />
                  </View>
                  <Text style={styles.quickActionText}>Report Issue</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionItem}
                  onPress={() => router.push('/MapScreen')}
                >
                  <View style={styles.quickActionIcon}>
                    <MaterialIcons name="map" size={24} color="#48dbfb" />
                  </View>
                  <Text style={styles.quickActionText}>Road Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionItem}>
                  <View style={styles.quickActionIcon}>
                    <MaterialIcons name="support" size={24} color="#feca57" />
                  </View>
                  <Text style={styles.quickActionText}>Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>
        </ScrollView>

        {/* Signs Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={selectedCategory ? selectedCategory.gradient : ['#667eea', '#764ba2']}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modalHeaderContent}>
                  <View style={styles.modalTitleContainer}>
                    <MaterialIcons 
                      name={selectedCategory?.icon || 'traffic'} 
                      size={24} 
                      color="white" 
                    />
                    <Text style={styles.modalTitle}>{selectedCategory?.title}</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  {selectedCategory?.signs.length} signs in this category
                </Text>
              </LinearGradient>
              
              <FlatList
                data={selectedCategory?.signs || []}
                renderItem={renderSignItem}
                keyExtractor={(item, index) => `${item}-${index}`}
                style={styles.signsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.signsListContent}
              />
            </View>
          </View>
        </Modal>

        {/* Loading Overlay with Glass Effect */}
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
              <Text style={styles.loadingText}>Loading...</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 100,
  },
  element1: {
    width: 160,
    height: 160,
    top: '5%',
    right: '-15%',
  },
  element2: {
    width: 120,
    height: 120,
    bottom: '25%',
    left: '-18%',
  },
  element3: {
    width: 90,
    height: 90,
    top: '45%',
    right: '8%',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    backgroundColor: 'rgba(254, 202, 87, 0.3)',
    borderRadius: 25,
    zIndex: -1,
  },
  brandTextContainer: {
    alignItems: 'flex-start',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
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
    marginBottom: 2,
  },
  brandTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    fontWeight: '500',
  },
  searchFilter: {
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    borderRadius: 12,
    padding: 6,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Categories Section
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    fontWeight: '500',
  },
  signsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  signCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  signCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  signGradient: {
    padding: 16,
    minHeight: 160,
    position: 'relative',
  },
  signIconContainer: {
    marginBottom: 12,
  },
  iconGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  signContent: {
    flex: 1,
  },
  signTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  signDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  signCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 12,
  },
  signArrow: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },

  // Quick Actions Section
  quickActionsSection: {
    paddingHorizontal: 20,
  },
  quickActionsGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  signsList: {
    flex: 1,
  },
  signsListContent: {
    padding: 20,
  },
  signItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signItemIcon: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  signItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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