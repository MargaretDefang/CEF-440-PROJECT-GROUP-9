import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Animated,
  Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function ReportScreen() {
  const [report, setReport] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('Fetching location...');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Keyboard listeners
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, []);

  // Fetch location on load
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation('Location permission denied');
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        let address = await Location.reverseGeocodeAsync(loc.coords);
        if (address.length > 0) {
          const addr = address[0];
          setLocation(
            `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim().replace(/^,\s*/, '')
          );
        } else {
          setLocation('Location unavailable');
        }
      } catch (error) {
        setLocation('Location unavailable');
      }
    })();
  }, []);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Pick image with enhanced UX
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to attach photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSubmit = async () => {
    if (report.trim() === '') {
      Alert.alert('Missing Information', 'Please describe the issue you want to report.');
      return;
    }

    animatePress();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Report Submitted!',
        'Thank you for helping improve road safety. Your report has been submitted successfully.',
        [
          {
            text: 'Submit Another',
            onPress: () => {
              setReport('');
              setImage(null);
            }
          },
          { text: 'Done', style: 'default' }
        ]
      );
      
      console.log({ report, image, location });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {/* Header */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000}
          style={styles.headerSection}
        >
          <View style={styles.headerGlass}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="report-problem" size={32} color="#feca57" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Road Report</Text>
                <Text style={styles.subtitle}>Help improve road safety by reporting issues</Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && { paddingBottom: 100 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Section */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={200}
            style={styles.locationSection}
          >
            <View style={styles.locationGlass}>
              <View style={styles.locationHeader}>
                <MaterialIcons name="location-pin" size={24} color="#feca57" />
                <Text style={styles.locationTitle}>Current Location</Text>
              </View>
              <Text style={styles.locationText}>{location}</Text>
              <View style={styles.locationAccuracy}>
                <MaterialIcons name="gps-fixed" size={16} color="#48dbfb" />
                <Text style={styles.accuracyText}>Auto-detected location</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Description Section */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={400}
            style={styles.descriptionSection}
          >
            <Text style={styles.sectionTitle}>Issue Description</Text>
            <View style={styles.inputGlass}>
              <View style={styles.inputHeader}>
                <MaterialIcons name="edit" size={20} color="#feca57" />
                <Text style={styles.inputLabel}>Describe the problem</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Large pothole on Main Street near the traffic light causing vehicle damage..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                multiline
                value={report}
                onChangeText={setReport}
                maxLength={500}
              />
              <Text style={styles.characterCount}>{report.length}/500</Text>
            </View>
          </Animatable.View>

          {/* Photo Section */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={600}
            style={styles.photoSection}
          >
            <Text style={styles.sectionTitle}>Photo Evidence</Text>
            
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.preview} />
                <View style={styles.imageOverlay}>
                  <TouchableOpacity 
                    style={styles.changeImageButton}
                    onPress={showImageOptions}
                  >
                    <MaterialIcons name="edit" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setImage(null)}
                  >
                    <MaterialIcons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.photoGlass} 
                onPress={showImageOptions}
                activeOpacity={0.8}
              >
                <View style={styles.photoContent}>
                  <View style={styles.photoIcon}>
                    <MaterialIcons name="add-a-photo" size={32} color="#feca57" />
                  </View>
                  <Text style={styles.photoText}>Add Photo</Text>
                  <Text style={styles.photoSubtext}>Tap to take photo or choose from gallery</Text>
                </View>
              </TouchableOpacity>
            )}
          </Animatable.View>

          {/* Submit Button */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={800}
            style={styles.submitSection}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#feca57', '#ff9ff3']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <Animatable.View 
                      animation="rotate" 
                      iterationCount="infinite" 
                      duration={1000}
                      style={styles.submitContent}
                    >
                      <MaterialIcons name="refresh" size={24} color="white" />
                      <Text style={styles.submitText}>Submitting...</Text>
                    </Animatable.View>
                  ) : (
                    <View style={styles.submitContent}>
                      <MaterialIcons name="send" size={24} color="white" />
                      <Text style={styles.submitText}>Submit Report</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animatable.View>

          {/* Tips Section */}
          <Animatable.View 
            animation="fadeIn" 
            duration={1000}
            delay={1000}
            style={styles.tipsSection}
          >
            <View style={styles.tipsGlass}>
              <View style={styles.tipsHeader}>
                <MaterialIcons name="lightbulb" size={20} color="#feca57" />
                <Text style={styles.tipsTitle}>Helpful Tips</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#48dbfb" />
                  <Text style={styles.tipText}>Include specific landmarks or street names</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#48dbfb" />
                  <Text style={styles.tipText}>Take clear photos showing the issue</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcons name="check-circle" size={16} color="#48dbfb" />
                  <Text style={styles.tipText}>Describe the severity and impact</Text>
                </View>
              </View>
            </View>
          </Animatable.View>
        </ScrollView>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    borderRadius: 20,
    padding: 12,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Location Section
  locationSection: {
    marginBottom: 24,
  },
  locationGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    lineHeight: 20,
  },
  locationAccuracy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },

  // Description Section
  descriptionSection: {
    marginBottom: 24,
  },
  inputGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    marginTop: 8,
  },

  // Photo Section
  photoSection: {
    marginBottom: 24,
  },
  photoGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  photoContent: {
    alignItems: 'center',
  },
  photoIcon: {
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  photoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  photoSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  changeImageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 8,
  },
  removeImageButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    borderRadius: 16,
    padding: 8,
  },

  // Submit Section
  submitSection: {
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    padding: 16,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },

  // Tips Section
  tipsSection: {
    marginBottom: 24,
  },
  tipsGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
  },
});