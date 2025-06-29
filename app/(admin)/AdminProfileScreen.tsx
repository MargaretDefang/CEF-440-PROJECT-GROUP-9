import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Modal,
  TextInput
} from 'react-native';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../services/ApiService';
import { useFocusEffect } from '@react-navigation/native';
import { getAvatarUrl } from '../utils/avatar';

const apiBaseUrl = API_BASE_URL || 'http://192.168.138.138:3000';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, updatePassword, updateAvatar, refreshUser } = useAuth();
  const [username, setUsername] = useState('Esimo Godwill');
  const [email, setEmail] = useState('esimogodwill@gmail.com');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'name' | 'email' | null>(null);
  const [modalValue, setModalValue] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('ImagePicker permissions:', status);
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

  type ActionFunction = () => Promise<void>;
  type ActionName = string;

  const handleAction = async (action: ActionFunction, actionName: ActionName) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      Alert.alert(
        'Oops! Something went wrong',
        `We couldn't ${actionName.toLowerCase()}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    animatePress();
    await handleAction(async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        // Upload to backend
        try {
          const updatedUser = await updateAvatar(result.assets[0].uri);
          Alert.alert('Success', 'Profile picture updated!');
        } catch (e) {
          Alert.alert('Error', 'Failed to upload avatar.');
        }
      }
    }, 'Change profile picture');
  };

  const openEditModal = (type: 'name' | 'email') => {
    setModalType(type);
    if (type === 'name') {
      setModalValue(user ? `${user.first_name} ${user.last_name}` : '');
    } else if (type === 'email') {
      setModalValue(user?.email || '');
    }
    setModalVisible(true);
  };

  const closeEditModal = () => {
    setModalVisible(false);
    setModalType(null);
    setModalValue('');
  };

  const handleSaveModal = async () => {
    if (modalType === 'name') {
      if (modalValue.trim().split(' ').length >= 2) {
        const [first_name, ...rest] = modalValue.trim().split(' ');
        const last_name = rest.join(' ');
        try {
          await updateProfile({ first_name, last_name });
          Alert.alert('Success', 'Name updated successfully!');
          closeEditModal();
        } catch (e) {
          Alert.alert('Error', 'Failed to update name.');
        }
      } else {
        Alert.alert('Invalid Name', 'Please enter both first and last name');
      }
    } else if (modalType === 'email') {
      if (modalValue && modalValue.includes('@') && modalValue.includes('.')) {
        try {
          await updateProfile({ email: modalValue });
          Alert.alert('Success', 'Email updated successfully!');
          closeEditModal();
        } catch (e) {
          Alert.alert('Error', 'Failed to update email.');
        }
      } else {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
      }
    }
  };

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Missing Old Password', 'Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }
    try {
      await updatePassword(oldPassword, newPassword);
      Alert.alert('Success', 'Password updated successfully!');
      closePasswordModal();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update password.');
    }
  };

  const handleSaveChanges = () => {
    Alert.alert(
      'Save Changes',
      'Are you sure you want to save all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: async () => {
            await handleAction(async () => {
              console.log('Saving changes:', { username, email });
              // Simulate save delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Success', 'Your changes have been saved!');
            }, 'Save changes');
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.push('/(auth)/UserLoginScreen');
          },
        },
      ]
    );
  };

  // Refresh user data on screen focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('AdminProfileScreen - Refreshing user data');
      refreshUser();
    }, [refreshUser])
  );

  // Debug avatar URL
  React.useEffect(() => {
    console.log('AdminProfileScreen - User object:', user);
    console.log('AdminProfileScreen - Avatar URL from user:', user?.avatar_url);
    console.log('AdminProfileScreen - Full avatar URL:', getAvatarUrl(user?.avatar_url));
  }, [user]);

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
          style={[styles.floatingElement, styles.element2]}
        />

        {/* Header */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000}
          style={styles.headerSection}
        >
          <View style={styles.headerGlass}>
            <View style={styles.headerTop}>
             
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>Manage your account</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
        </Animatable.View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Picture Section */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={200}
            style={styles.profileSection}
          >
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity 
                style={styles.avatarContainer} 
                onPress={pickImage}
                disabled={loading}
              >
                <View style={styles.avatarGlass}>
                  <Image source={{ uri: getAvatarUrl(user?.avatar_url) }} style={styles.avatar} />
                  <LinearGradient
                    colors={['rgba(254, 202, 87, 0.8)', 'rgba(254, 202, 87, 0.4)']}
                    style={styles.editIconContainer}
                  >
                    <Feather name="edit-2" size={16} color="white" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.usernameSection}>
              <Text style={styles.userName}>{user ? `${user.first_name} ${user.last_name}` : ''}</Text>
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => openEditModal('name')}
              >
                <Text style={styles.changeButtonText}>Change Username</Text>
                <MaterialIcons name="edit" size={16} color="#feca57" />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Account Details */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={400}
            style={styles.detailsSection}
          >
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <View style={styles.detailsGlass}>
              {/* Email */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="email" size={22} color="#48dbfb" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{user?.email}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailAction}
                  onPress={() => openEditModal('email')}
                >
                  <MaterialIcons name="edit" size={18} color="#feca57" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Password */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <FontAwesome name="lock" size={22} color="#ff6b6b" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Password</Text>
                  <Text style={styles.detailValue}>••••••••••••</Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailAction}
                  onPress={openPasswordModal}
                >
                  <MaterialIcons name="edit" size={18} color="#feca57" />
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000}
            delay={600}
            style={styles.actionsSection}
          >
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveChanges}
              disabled={loading}
            >
              <LinearGradient
                colors={['#48dbfb', '#0abde3']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleLogout}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ff5252']}
                style={styles.signOutButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="logout" size={20} color="white" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
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

        {/* Edit Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeEditModal}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                {modalType === 'name' ? 'Edit Name' : 'Edit Email'}
              </Text>
              <TextInput
                value={modalValue}
                onChangeText={setModalValue}
                placeholder={modalType === 'name' ? 'First Last' : 'Email'}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 }}
                autoCapitalize={modalType === 'email' ? 'none' : 'words'}
                keyboardType={modalType === 'email' ? 'email-address' : 'default'}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity onPress={closeEditModal} style={{ padding: 10 }}>
                  <Text style={{ color: '#888', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveModal} style={{ padding: 10 }}>
                  <Text style={{ color: '#667eea', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Password Edit Modal */}
        <Modal
          visible={passwordModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closePasswordModal}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Change Password</Text>
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Current Password"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
                secureTextEntry
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
                secureTextEntry
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 }}
                secureTextEntry
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity onPress={closePasswordModal} style={{ padding: 10 }}>
                  <Text style={{ color: '#888', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePassword} style={{ padding: 10 }}>
                  <Text style={{ color: '#667eea', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    width: 140,
    height: 140,
    top: '10%',
    right: '-10%',
  },
  element2: {
    width: 100,
    height: 100,
    bottom: '20%',
    left: '-15%',
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
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
  headerSpacer: {
    width: 44,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarGlass: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 70,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  usernameSection: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 87, 0.3)',
    gap: 6,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#feca57',
    fontWeight: '600',
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailsGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 12,
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  detailAction: {
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 87, 0.3)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  signOutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  signOutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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