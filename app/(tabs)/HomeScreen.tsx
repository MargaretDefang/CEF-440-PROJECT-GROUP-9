import React, { useState, useRef, useEffect } from 'react';
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
  FlatList,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { ApiService, API_BASE_URL } from '../services/ApiService';
import { useNotifications } from '../contexts/NotificationContext';

const apiService = new ApiService();

// Interfaces
interface ActionFunction {
  (): Promise<void>;
}

interface SignCategory {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  created_at: string;
}

interface RoadSign {
  id: number;
  category_id: number;
  name: string;
  description: string;
  image_url?: string;
  meaning: string;
  traffic_impact: 'none' | 'low' | 'medium' | 'high' | 'severe';
  speed_limit_affected: boolean;
  lane_restrictions?: string;
  category_name: string;
}

interface SignCategoryWithUI extends SignCategory {
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient: [string, string];
  signCount: number;
}

const { width, height } = Dimensions.get('window');

export default function UserHomeScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<SignCategoryWithUI | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RoadSign[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [categories, setCategories] = useState<SignCategoryWithUI[]>([]);
  const [categorySigns, setCategorySigns] = useState<RoadSign[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  // Icon mapping for categories
  const getCategoryIcon = (categoryName: string): keyof typeof MaterialIcons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
      'Warning Signs': 'warning',
      'Regulatory Signs': 'gavel',
      'Informational Signs': 'info',
      'Construction Signs': 'construction',
      'Order Signs': 'gavel',
      'Danger Signs': 'warning',
      'Information Signs': 'info',
      'Location Signs': 'location-on',
      'Directional Signs': 'navigation'
    };
    return iconMap[categoryName] || 'traffic';
  };

  // Gradient mapping for categories
  const getCategoryGradient = (categoryName: string): [string, string] => {
    const gradientMap: { [key: string]: [string, string] } = {
      'Warning Signs': ['#ff9500', '#ff5722'],
      'Regulatory Signs': ['#667eea', '#764ba2'],
      'Informational Signs': ['#48dbfb', '#0abde3'],
      'Construction Signs': ['#ff9500', '#ff5722'],
      'Order Signs': ['#667eea', '#764ba2'],
      'Danger Signs': ['#ff6b6b', '#feca57'],
      'Information Signs': ['#48dbfb', '#0abde3'],
      'Location Signs': ['#1dd1a1', '#10ac84'],
      'Directional Signs': ['#feca57', '#ff9ff3']
    };
    return gradientMap[categoryName] || ['#667eea', '#764ba2'];
  };

  // Load sign categories from backend
  const loadSignCategories = async () => {
    try {
      setError(null);
      const categoriesData = await apiService.loadSignCategories();
      
      // Transform categories to include UI properties
      const categoriesWithUI: SignCategoryWithUI[] = await Promise.all(
        categoriesData.map(async (category: SignCategory) => {
          // Get sign count for each category
          const signsData = await apiService.getSignsByCategory(category.id, 1, 1);
          return {
            ...category,
            icon: getCategoryIcon(category.name),
            gradient: getCategoryGradient(category.name),
            signCount: signsData.pagination.total_items
          };
        })
      );
      
      setCategories(categoriesWithUI);
    } catch (error) {
      console.error('Error loading sign categories:', error);
      setError('Failed to load sign categories');
    }
  };

  // Load signs for a specific category
  const loadCategorySigns = async (categoryId: number) => {
    try {
      const signsData = await apiService.getSignsByCategory(categoryId, 1, 100);
      setCategorySigns(signsData.signs);
    } catch (error) {
      console.error('Error loading category signs:', error);
      Alert.alert('Error', 'Failed to load signs for this category');
    }
  };

  // Search signs
  const searchSigns = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await apiService.searchSigns(query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching signs:', error);
      Alert.alert('Error', 'Failed to search signs');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);
        await loadSignCategories();
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load initial data');
      } finally {
        setInitialLoading(false);
      }
    };

    initializeData();
  }, []);

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

  const handleSignPress = async (category: SignCategoryWithUI, index: number) => {
    animatePress(index);
    await handleAction(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        setSelectedCategory(category);
        await loadCategorySigns(category.id);
        setModalVisible(true);
      },
      `Open ${category.name}`
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategory(null);
  };

  const handleSearchPress = () => {
    setSearchModalVisible(true);
  };

  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      searchSigns(searchQuery);
    }
  };

  const renderSignItem = ({ item }: { item: RoadSign }) => (
    <TouchableOpacity style={styles.signItem}>
      <View style={styles.signItemIcon}>
        {item.image_url ? (
          <Image
            source={{ uri: API_BASE_URL + item.image_url }}
            style={styles.signImage}
            resizeMode="contain"
          />
        ) : (
          <MaterialIcons name="traffic" size={20} color="#667eea" />
        )}
      </View>
      <View style={styles.signItemContent}>
        <Text style={styles.signItemText}>{item.name}</Text>
        <Text style={styles.signItemDescription}>{item.description}</Text>
        <Text style={styles.signItemMeaning}>Meaning: {item.meaning}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: RoadSign }) => (
    <TouchableOpacity style={styles.searchResultItem}>
      <View style={styles.searchResultIcon}>
        {item.image_url ? (
          <Image
            source={{ uri: API_BASE_URL + item.image_url }}
            style={styles.signImage}
            resizeMode="contain"
          />
        ) : (
          <MaterialIcons name="traffic" size={20} color="#667eea" />
        )}
      </View>
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultText}>{item.name}</Text>
        <Text style={styles.searchResultCategory}>{item.category_name}</Text>
        <Text style={styles.searchResultDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  // Show loading screen if initial data is loading
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.loadingContainer}>
            <Animatable.View 
              animation="rotate" 
              iterationCount="infinite" 
              duration={1000}
            >
              <MaterialIcons name="refresh" size={48} color="#feca57" />
            </Animatable.View>
            <Text style={styles.loadingText}>Loading Road Signs...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show error screen if there's an error
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                loadSignCategories();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
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
            onPress={handleSearchPress}
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
              {categories.reduce((total, category) => total + category.signCount, 0)} signs across {categories.length} categories
            </Text>
            
            <View style={styles.signsContainer}>
              {categories.map((category, index) => (
                <Animated.View
                  key={category.id}
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
                        <Text style={styles.signTitle}>{category.name}</Text>
                        <Text style={styles.signDescription}>{category.description}</Text>
                        <Text style={styles.signCount}>{category.signCount} signs</Text>
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
                    <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  {categorySigns.length} signs in this category
                </Text>
              </LinearGradient>
              
              <FlatList
                data={categorySigns}
                renderItem={renderSignItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.signsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.signsListContent}
              />
            </View>
          </View>
        </Modal>

        {/* Search Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={searchModalVisible}
          onRequestClose={closeSearchModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modalHeaderContent}>
                  <View style={styles.modalTitleContainer}>
                    <MaterialIcons name="search" size={24} color="white" />
                    <Text style={styles.modalTitle}>Search Signs</Text>
                  </View>
                  <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              
              <View style={styles.searchModalContent}>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter sign name or description..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                  />
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={handleSearchSubmit}
                    disabled={loading}
                  >
                    <MaterialIcons name="search" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                
                {loading && (
                  <View style={styles.searchLoading}>
                    <Animatable.View 
                      animation="rotate" 
                      iterationCount="infinite" 
                      duration={1000}
                    >
                      <MaterialIcons name="refresh" size={24} color="#667eea" />
                    </Animatable.View>
                    <Text style={styles.searchLoadingText}>Searching...</Text>
                  </View>
                )}
                
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsContent}
                  ListEmptyComponent={
                    searchQuery && !loading ? (
                      <View style={styles.noResults}>
                        <MaterialIcons name="search-off" size={48} color="#ccc" />
                        <Text style={styles.noResultsText}>No signs found</Text>
                        <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                      </View>
                    ) : null
                  }
                />
              </View>
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
  signItemContent: {
    flex: 1,
  },
  signItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  signItemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  signItemMeaning: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
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

  // Loading Container for initial loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Search Modal Styles
  searchModalContent: {
    flex: 1,
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  searchLoadingText: {
    fontSize: 16,
    color: '#667eea',
    marginLeft: 12,
    fontWeight: '600',
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultsContent: {
    paddingBottom: 20,
  },
  searchResultItem: {
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
  searchResultIcon: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultDescription: {
    fontSize: 12,
    color: '#666',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  signImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

});