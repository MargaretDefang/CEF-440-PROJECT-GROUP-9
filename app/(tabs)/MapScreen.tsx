import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { GoogleMapsService, RoutePoint, NavigationStep, RouteResult } from '../services/GoogleMapsService';

const { width, height } = Dimensions.get('window');

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Destination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'recent' | 'favorite' | 'search';
  rating?: number;
  placeId?: string;
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<MapRegion>({
    latitude: 3.8480,  // Default to Yaoundé coordinates
    longitude: 11.5021,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [following, setFollowing] = useState(true);

  // Navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RoutePoint[]>([]);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNavigationPanel, setShowNavigationPanel] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  // Google Maps service
  const googleMapsService = new GoogleMapsService();

  // Sample destinations for demo
  const sampleDestinations: Destination[] = [
    {
      id: '1',
      name: 'Yaoundé Central Market',
      address: 'Central Market, Yaoundé, Cameroon',
      latitude: 3.8480,
      longitude: 11.5021,
      type: 'favorite'
    },
    {
      id: '2',
      name: 'University of Yaoundé I',
      address: 'University of Yaoundé I, Yaoundé, Cameroon',
      latitude: 3.8600,
      longitude: 11.5200,
      type: 'favorite'
    },
    {
      id: '3',
      name: 'Yaoundé International Airport',
      address: 'Nsimalen International Airport, Yaoundé, Cameroon',
      latitude: 3.7220,
      longitude: 11.5530,
      type: 'recent'
    }
  ];

  // API configuration state
  const [apiConfig, setApiConfig] = useState<{ places: boolean; directions: boolean } | null>(null);

  useEffect(() => {
    initializeLocation();
    checkApiConfiguration();
    
    // Animate UI elements
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Update current step based on user location during navigation
  useEffect(() => {
    if (isNavigating && location && navigationSteps.length > 0) {
      const userLocation: RoutePoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      const currentStep = googleMapsService.getCurrentStep(userLocation, navigationSteps);
      setCurrentStepIndex(currentStep);
    }
  }, [location, isNavigating, navigationSteps]);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location access is required to show your position on the map');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation);
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);

      // Watch position changes
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
          if (following && !isNavigating) {
            const updatedRegion = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            };
            setRegion(updatedRegion);
            mapRef.current?.animateToRegion(updatedRegion, 1000);
          }
        }
      );

      setLoading(false);
      return () => subscription?.remove();
    } catch (error) {
      console.error('Location error:', error);
      setErrorMsg('Unable to get your location. Please check your GPS settings.');
      setLoading(false);
    }
  };

  const handleRetryLocation = () => {
    setErrorMsg(null);
    initializeLocation();
  };

  const handleRecenterMap = () => {
    if (location && mapRef.current) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
      setFollowing(true);
    }
  };

  const handleMapPress = () => {
    setFollowing(false);
  };

  // Navigation functions
  const startNavigation = async (dest: Destination) => {
    if (!location) {
      Alert.alert('Error', 'Unable to get your current location');
      return;
    }

    try {
      setIsRouting(true);
      setDestination(dest);
      setShowSearchModal(false);

      // Get real directions from Google Maps API
      const route: RouteResult = await googleMapsService.getDirections(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        { latitude: dest.latitude, longitude: dest.longitude }
      );

      setRouteCoordinates(route.coordinates);
      setNavigationSteps(route.steps);
      setEstimatedTime(route.estimatedTime);
      setEstimatedDistance(route.estimatedDistance);
      setCurrentStepIndex(0);

      // Animate to show route
      if (mapRef.current) {
        const routeRegion = getRouteRegion(route.coordinates);
        mapRef.current.animateToRegion(routeRegion, 1000);
      }

      setIsNavigating(true);
      setFollowing(false);
      setShowNavigationPanel(true);
      
      Animated.timing(panelAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Navigation error:', error);
      
      // Fallback to basic route when Google API fails
      try {
        console.log('Using fallback route generation due to API limitations');
        
        // Create a simple direct route
        const fallbackRoute = generateFallbackRoute(
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
          { latitude: dest.latitude, longitude: dest.longitude }
        );
        
        setRouteCoordinates(fallbackRoute.coordinates);
        setNavigationSteps(fallbackRoute.steps);
        setEstimatedTime(fallbackRoute.estimatedTime);
        setEstimatedDistance(fallbackRoute.estimatedDistance);
        setCurrentStepIndex(0);

        // Animate to show route
        if (mapRef.current) {
          const routeRegion = getRouteRegion(fallbackRoute.coordinates);
          mapRef.current.animateToRegion(routeRegion, 1000);
        }

        setIsNavigating(true);
        setFollowing(false);
        setShowNavigationPanel(true);
        
        Animated.timing(panelAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
      } catch (fallbackError) {
        console.error('Fallback route generation failed:', fallbackError);
        Alert.alert(
          'Navigation Error', 
          'Unable to get directions. Please check your internet connection and try again.'
        );
      }
    } finally {
      setIsRouting(false);
    }
  };

  const generateFallbackRoute = (origin: RoutePoint, destination: RoutePoint): RouteResult => {
    // Calculate distance and estimated time
    const distance = googleMapsService.calculateDistance(origin, destination);
    const distanceKm = (distance / 1000).toFixed(1);
    const estimatedMinutes = Math.max(1, Math.round(distance / 1000 * 2)); // Rough estimate: 2 min per km
    
    // Create a simple straight-line route with a few waypoints
    const coordinates = [
      origin,
      {
        latitude: (origin.latitude + destination.latitude) / 2,
        longitude: (origin.longitude + destination.longitude) / 2
      },
      destination
    ];
    
    // Create basic navigation steps
    const steps: NavigationStep[] = [
      {
        instruction: `Head towards ${destination.latitude > origin.latitude ? 'north' : 'south'}`,
        distance: `${distanceKm} km`,
        duration: `${estimatedMinutes} min`,
        maneuver: 'straight',
        coordinates: [origin]
      },
      {
        instruction: `Continue towards destination`,
        distance: `${(distance / 2000).toFixed(1)} km`,
        duration: `${Math.round(estimatedMinutes / 2)} min`,
        maneuver: 'straight',
        coordinates: [coordinates[1]]
      },
      {
        instruction: `Arrive at ${destination.name || 'destination'}`,
        distance: '0 km',
        duration: '0 min',
        maneuver: 'arrive',
        coordinates: [destination]
      }
    ];
    
    return {
      coordinates,
      steps,
      estimatedTime: `${estimatedMinutes} min`,
      estimatedDistance: `${distanceKm} km`,
      totalDistance: distance,
      totalDuration: estimatedMinutes * 60
    };
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRouteCoordinates([]);
    setNavigationSteps([]);
    setCurrentStepIndex(0);
    setShowNavigationPanel(false);
    setFollowing(true);
    
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Return to user location
    if (location && mapRef.current) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const getRouteRegion = (coordinates: RoutePoint[]) => {
    if (coordinates.length === 0) return region;

    const lats = coordinates.map(coord => coord.latitude);
    const lngs = coordinates.map(coord => coord.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLng - minLng) * 1.5,
    };
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 2) {
      try {
        setIsSearching(true);
        
        // Search using Google Places API
        const places = await googleMapsService.searchPlaces(
          query, 
          location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : undefined
        );
        
        // If Google API returns results, use them
        if (places.length > 0) {
          const destinations: Destination[] = places.map(place => ({
            id: place.id,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            type: 'search' as const,
            rating: place.rating,
            placeId: place.id
          }));
          setSearchResults(destinations);
          return;
        }
        
        // Enhanced fallback to sample destinations with better matching
        console.log('Using enhanced fallback search due to API limitations');
        const searchTerm = query.toLowerCase();
        const filtered = sampleDestinations.filter(dest => 
          dest.name.toLowerCase().includes(searchTerm) ||
          dest.address.toLowerCase().includes(searchTerm) ||
          dest.name.toLowerCase().split(' ').some(word => word.startsWith(searchTerm)) ||
          dest.address.toLowerCase().split(' ').some(word => word.startsWith(searchTerm))
        );
        
        // Add some generic results based on search term
        const genericResults: Destination[] = [];
        
        if (searchTerm.includes('restaurant') || searchTerm.includes('food') || searchTerm.includes('eat') || searchTerm.includes('cafe')) {
          genericResults.push(
            {
              id: 'restaurant-1',
              name: 'Local Restaurant',
              address: 'Downtown Area, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'restaurant-2',
              name: 'City Cafe',
              address: 'Central District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        if (searchTerm.includes('hotel') || searchTerm.includes('stay') || searchTerm.includes('accommodation') || searchTerm.includes('lodging')) {
          genericResults.push(
            {
              id: 'hotel-1',
              name: 'City Hotel',
              address: 'Central District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'hotel-2',
              name: 'Business Inn',
              address: 'Commercial Area, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        if (searchTerm.includes('shop') || searchTerm.includes('store') || searchTerm.includes('mall') || searchTerm.includes('market')) {
          genericResults.push(
            {
              id: 'shop-1',
              name: 'Shopping Center',
              address: 'Commercial Area, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'shop-2',
              name: 'Central Market',
              address: 'Market District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        if (searchTerm.includes('bank') || searchTerm.includes('atm') || searchTerm.includes('money') || searchTerm.includes('finance')) {
          genericResults.push(
            {
              id: 'bank-1',
              name: 'Central Bank',
              address: 'Financial District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'bank-2',
              name: 'Commercial Bank',
              address: 'Business District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        if (searchTerm.includes('hospital') || searchTerm.includes('clinic') || searchTerm.includes('medical') || searchTerm.includes('health')) {
          genericResults.push(
            {
              id: 'hospital-1',
              name: 'General Hospital',
              address: 'Medical District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'hospital-2',
              name: 'Medical Center',
              address: 'Health District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        if (searchTerm.includes('school') || searchTerm.includes('university') || searchTerm.includes('college') || searchTerm.includes('education')) {
          genericResults.push(
            {
              id: 'school-1',
              name: 'University of Yaoundé I',
              address: 'University District, Yaoundé',
              latitude: 3.8600,
              longitude: 11.5200,
              type: 'search'
            },
            {
              id: 'school-2',
              name: 'Technical College',
              address: 'Education District, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        if (searchTerm.includes('gas') || searchTerm.includes('fuel') || searchTerm.includes('station') || searchTerm.includes('petrol')) {
          genericResults.push(
            {
              id: 'gas-1',
              name: 'Gas Station',
              address: 'Highway Area, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'gas-2',
              name: 'Fuel Center',
              address: 'Main Road, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        // If no specific category matches, add some general results
        if (genericResults.length === 0) {
          genericResults.push(
            {
              id: 'general-1',
              name: 'City Center',
              address: 'Downtown Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            },
            {
              id: 'general-2',
              name: 'Business District',
              address: 'Commercial Area, Yaoundé',
              latitude: 3.8480 + (Math.random() - 0.5) * 0.01,
              longitude: 11.5021 + (Math.random() - 0.5) * 0.01,
              type: 'search'
            }
          );
        }
        
        // Combine filtered sample destinations with generic results
        const allResults = [...filtered, ...genericResults];
        setSearchResults(allResults);
        
        // Show a subtle notification that we're using fallback data
        if (allResults.length > 0) {
          console.log('Using enhanced fallback search results due to API limitations');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'left': return 'turn-left';
      case 'right': return 'turn-right';
      case 'slight-left': return 'turn-slight-left';
      case 'slight-right': return 'turn-slight-right';
      case 'sharp-left': return 'turn-sharp-left';
      case 'sharp-right': return 'turn-sharp-right';
      case 'uturn': return 'u-turn-left';
      case 'arrive': return 'place';
      case 'straight': return 'straight';
      default: return 'straight';
    }
  };

  const checkApiConfiguration = async () => {
    try {
      const config = await googleMapsService.checkApiConfiguration();
      setApiConfig(config);
      
      const statusMessage = googleMapsService.getApiStatusMessage(config.places, config.directions);
      console.log('API Configuration Status:', statusMessage);
      
      if (!config.places || !config.directions) {
        console.log('Some Google APIs are not available. Using fallback functionality.');
      }
    } catch (error) {
      console.error('Error checking API configuration:', error);
      setApiConfig({ places: false, directions: false });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.loadingContainer}
        >
          <Animatable.View 
            animation="pulse" 
            iterationCount="infinite"
            style={styles.loadingContent}
          >
            <View style={styles.loadingGlass}>
              <Animatable.View 
                animation="rotate" 
                iterationCount="infinite" 
                duration={2000}
                style={styles.loadingIcon}
              >
                <MaterialIcons name="location-searching" size={48} color="#feca57" />
              </Animatable.View>
              <Text style={styles.loadingText}>Finding your location...</Text>
              <Text style={styles.loadingSubtext}>Please wait while we locate you</Text>
            </View>
          </Animatable.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.errorContainer}
        >
          <Animatable.View 
            animation="bounceIn" 
            style={styles.errorContent}
          >
            <View style={styles.errorGlass}>
              <MaterialIcons name="location-off" size={64} color="#ff6b6b" />
              <Text style={styles.errorTitle}>Location Access Needed</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleRetryLocation}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#feca57']}
                  style={styles.retryGradient}
                >
                  <MaterialIcons name="refresh" size={20} color="white" />
                  <Text style={styles.retryText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <View style={styles.container}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          onMapReady={() => setMapReady(true)}
          onPress={handleMapPress}
          onRegionChangeComplete={(newRegion) => {
            setRegion(newRegion);
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here"
              description="Current location"
            >
              <View style={styles.customMarker}>
                <View style={styles.markerPulse} />
                <MaterialIcons name="person-pin-circle" size={40} color="#667eea" />
              </View>
            </Marker>
          )}

          {/* Route polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#667eea"
              lineDashPattern={[1]}
            />
          )}

          {/* Destination marker */}
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title={destination.name}
              description={destination.address}
            >
              <View style={styles.destinationMarker}>
                <MaterialIcons name="place" size={40} color="#ff6b6b" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerGlass}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {isNavigating ? 'Navigation' : 'Road Map'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isNavigating ? destination?.name : 'Navigate your journey'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowSearchModal(true)}
            >
              <MaterialIcons name="search" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Location Button */}
        <Animated.View 
          style={[
            styles.locationButton,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.locationButtonContent,
              following && styles.locationButtonActive
            ]}
            onPress={handleRecenterMap}
          >
            <LinearGradient
              colors={following ? ['#1dd1a1', '#10ac84'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.25)']}
              style={styles.locationGradient}
            >
              <MaterialIcons 
                name={following ? "my-location" : "location-searching"} 
                size={24} 
                color="white" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Navigation Panel */}
        {showNavigationPanel && (
          <Animated.View 
            style={[
              styles.navigationPanel,
              { 
                transform: [{ translateY: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })}]
              }
            ]}
          >
            <View style={styles.navigationGlass}>
              <View style={styles.navigationHeader}>
                <View style={styles.navigationInfo}>
                  <Text style={styles.navigationTitle}>{destination?.name}</Text>
                  <Text style={styles.navigationSubtitle}>{estimatedTime} • {estimatedDistance}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.stopNavigationButton}
                  onPress={stopNavigation}
                >
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
                {navigationSteps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <MaterialIcons 
                        name={getManeuverIcon(step.maneuver)} 
                        size={20} 
                        color={index === currentStepIndex ? "#667eea" : "#999"} 
                      />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepInstruction,
                        index === currentStepIndex && styles.currentStepInstruction
                      ]}>
                        {step.instruction}
                      </Text>
                      <Text style={styles.stepDetails}>
                        {step.distance} • {step.duration}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Bottom Info Panel - Only show when not navigating */}
        {!isNavigating && (
          <Animated.View 
            style={[
              styles.bottomPanel,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.panelGlass}>
              <View style={styles.panelContent}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="speed" size={20} color="#48dbfb" />
                  <Text style={styles.infoLabel}>Speed</Text>
                  <Text style={styles.infoValue}>
                    {location?.coords.speed ? `${Math.round(location.coords.speed * 3.6)} km/h` : '0 km/h'}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <MaterialIcons name="gps-fixed" size={20} color="#1dd1a1" />
                  <Text style={styles.infoLabel}>Accuracy</Text>
                  <Text style={styles.infoValue}>
                    {location?.coords.accuracy ? `±${Math.round(location.coords.accuracy)}m` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <MaterialIcons name="explore" size={20} color="#feca57" />
                  <Text style={styles.infoLabel}>Heading</Text>
                  <Text style={styles.infoValue}>
                    {location?.coords.heading ? `${Math.round(location.coords.heading)}°` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Loading overlay for routing */}
        {isRouting && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingCardText}>Getting directions...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Search Destination</Text>
              <TouchableOpacity 
                onPress={() => setShowSearchModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a place..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#667eea" style={styles.searchSpinner} />
              )}
            </View>

            <ScrollView style={styles.searchResults}>
              {searchResults.length > 0 ? (
                searchResults.map((dest) => (
                  <TouchableOpacity
                    key={dest.id}
                    style={styles.searchResultItem}
                    onPress={() => startNavigation(dest)}
                  >
                    <View style={styles.resultIcon}>
                      <MaterialIcons 
                        name={dest.type === 'favorite' ? 'favorite' : dest.type === 'search' ? 'place' : 'history'} 
                        size={20} 
                        color={dest.type === 'favorite' ? '#ff6b6b' : '#999'} 
                      />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={styles.resultName}>{dest.name}</Text>
                      <Text style={styles.resultAddress}>{dest.address}</Text>
                      {dest.rating && (
                        <View style={styles.ratingContainer}>
                          <MaterialIcons name="star" size={12} color="#feca57" />
                          <Text style={styles.ratingText}>{dest.rating}</Text>
                        </View>
                      )}
                    </View>
                    <MaterialIcons name="directions" size={20} color="#667eea" />
                  </TouchableOpacity>
                ))
              ) : searchQuery.length > 2 ? (
                <View style={styles.noResults}>
                  <MaterialIcons name="search-off" size={48} color="#999" />
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              ) : (
                <View style={styles.recentDestinations}>
                  <Text style={styles.recentTitle}>Recent Destinations</Text>
                  {sampleDestinations.filter(d => d.type === 'recent').map((dest) => (
                    <TouchableOpacity
                      key={dest.id}
                      style={styles.searchResultItem}
                      onPress={() => startNavigation(dest)}
                    >
                      <View style={styles.resultIcon}>
                        <MaterialIcons name="history" size={20} color="#999" />
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultName}>{dest.name}</Text>
                        <Text style={styles.resultAddress}>{dest.address}</Text>
                      </View>
                      <MaterialIcons name="directions" size={20} color="#667eea" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingGlass: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    width: '100%',
    maxWidth: 300,
  },
  errorGlass: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  errorTitle: {
    fontSize: 20,
    color: '#333',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  headerGlass: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
  },

  // Location Button
  locationButton: {
    position: 'absolute',
    right: 20,
    bottom: 180,
    zIndex: 1000,
  },
  locationButtonContent: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  locationButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  locationGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Custom Marker
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    transform: [{ scale: 1.5 }],
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Navigation Panel
  navigationPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navigationGlass: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: 300,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navigationInfo: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
  },
  navigationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stopNavigationButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 8,
  },
  stepsContainer: {
    maxHeight: 200,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  currentStepInstruction: {
    color: '#667eea',
    fontWeight: '700',
  },
  stepDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Bottom Info Panel
  bottomPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  panelGlass: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  panelContent: {
    flexDirection: 'row',
    padding: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },

  // Search Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchSpinner: {
    marginLeft: 12,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  recentDestinations: {
    paddingVertical: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingCardText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    fontWeight: '600',
  },
});