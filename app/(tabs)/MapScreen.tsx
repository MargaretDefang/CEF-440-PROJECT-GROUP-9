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
  Animated
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  
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

  useEffect(() => {
    initializeLocation();
    
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
          if (following) {
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

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 500);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 500);
    }
  };

  const handleMapPress = () => {
    setFollowing(false);
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
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Road Map</Text>
              <Text style={styles.headerSubtitle}>Navigate your journey</Text>
            </View>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => Alert.alert('Settings', 'Map settings coming soon!')}
            >
              <MaterialIcons name="settings" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Map Controls */}
        <Animated.View 
          style={[
            styles.mapControls,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.controlsGlass}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handleZoomIn}
            >
              <MaterialIcons name="zoom-in" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.controlDivider} />
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handleZoomOut}
            >
              <MaterialIcons name="zoom-out" size={24} color="white" />
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

        {/* Bottom Info Panel */}
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
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 8,
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -40,
    zIndex: 1000,
  },
  controlsGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  controlButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
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
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    transform: [{ scale: 1.5 }],
  },

  // Bottom Panel
  bottomPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  panelGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
});