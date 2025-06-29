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
  Modal,
  FlatList,
  TextInput,
  RefreshControl,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { ApiService, API_BASE_URL } from '../services/ApiService';
import * as ImagePicker from 'expo-image-picker';

const apiService = new ApiService();

// Database interfaces
interface SignCategory {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  created_at: string;
}

interface Sign {
  id: number;
  name: string;
  description: string;
  meaning: string;
  image_url?: string;
  category_id: number;
  category_name: string;
}

interface SignCategoryWithUI extends SignCategory {
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient: [string, string];
  signCount: number;
}

interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  latitude: number;
  longitude: number;
  address?: string;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  pending_reports: number;
  total_reports: number;
}

const { width, height } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signs' | 'reports'>('signs');
  const [selectedCategory, setSelectedCategory] = useState<SignCategoryWithUI | null>(null);
  const [addSignModalVisible, setAddSignModalVisible] = useState(false);
  const [reportsModalVisible, setReportsModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newSignName, setNewSignName] = useState('');
  const [newSignDescription, setNewSignDescription] = useState('');
  const [newSignMeaning, setNewSignMeaning] = useState('');
  const [newSignImage, setNewSignImage] = useState<string | null>(null);
  const [editSignModalVisible, setEditSignModalVisible] = useState(false);
  const [editingSign, setEditingSign] = useState<Sign | null>(null);
  const [editSignName, setEditSignName] = useState('');
  const [editSignDescription, setEditSignDescription] = useState('');
  const [editSignMeaning, setEditSignMeaning] = useState('');
  const [editSignImage, setEditSignImage] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Database state
  const [signCategories, setSignCategories] = useState<SignCategoryWithUI[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [categorySigns, setCategorySigns] = useState<Sign[]>([]);
  
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
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
      
      setSignCategories(categoriesWithUI);
    } catch (error) {
      console.error('Error loading sign categories:', error);
      setError('Failed to load sign categories');
    }
  };

  // Load reports from backend
  const loadReports = async () => {
    try {
      const reportsData = await apiService.getReports(1, 50);
      setReports(reportsData.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load reports');
    }
  };

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setError('Failed to load user statistics');
    }
  };

  // Load signs for a specific category
  const loadCategorySigns = async (categoryId: number) => {
    try {
      const signsData = await apiService.getSignsByCategory(categoryId, 1, 100);
      setCategorySigns(signsData.signs || []);
    } catch (error) {
      console.error('Error loading category signs:', error);
      Alert.alert('Error', 'Failed to load signs for this category');
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([
          loadSignCategories(),
          loadReports(),
          loadUserStats()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load initial data');
      } finally {
        setInitialLoading(false);
      }
    };

    initializeData();
  }, []);

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        loadSignCategories(),
        loadReports(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleCategoryPress = async (category: SignCategoryWithUI, index: number) => {
    animatePress(index);
    await handleAction(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        setSelectedCategory(category);
        await loadCategorySigns(category.id);
        setCategoryModalVisible(true);
      },
      `Open ${category.name}`
    );
  };

  const closeCategoryModal = () => {
    setCategoryModalVisible(false);
    setSelectedCategory(null);
  };

  const pickImage = async () => {
    animatePress(0);
    await handleAction(async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setNewSignImage(result.assets[0].uri);
      }
    }, 'select sign image');
  };

  const pickEditImage = async () => {
    animatePress(0);
    await handleAction(async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setEditSignImage(result.assets[0].uri);
      }
    }, 'select sign image');
  };

  const handleAddSign = async () => {
    if (!newSignName.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please enter a sign name and select a category');
      return;
    }

    await handleAction(async () => {
      let imageUrl = null;
      
      // Upload image if selected
      if (newSignImage) {
        try {
          const uploadResult = await apiService.uploadSignImage(newSignImage);
          imageUrl = uploadResult.imageUrl;
        } catch (error) {
          console.error('Image upload failed:', error);
          Alert.alert('Warning', 'Sign created but image upload failed. You can add the image later.');
        }
      }

      const newSign = await apiService.createSign({
        name: newSignName.trim(),
        description: newSignDescription.trim() || newSignName.trim(),
        meaning: newSignMeaning.trim() || newSignName.trim(),
        image_url: imageUrl,
        category_id: selectedCategory.id
      });

      // Reload category signs and categories
      await Promise.all([
        loadCategorySigns(selectedCategory.id),
        loadSignCategories()
      ]);
      
      setNewSignName('');
      setNewSignDescription('');
      setNewSignMeaning('');
      setNewSignImage(null);
      setAddSignModalVisible(false);
      setSelectedCategory(null);
      
      Alert.alert('Success', 'Sign added successfully!');
    }, 'add sign');
  };

  const handleUpdateSign = async () => {
    if (!editSignName.trim() || !editingSign) {
      Alert.alert('Error', 'Please enter a sign name');
      return;
    }

    await handleAction(async () => {
      let imageUrl = editingSign.image_url; // Keep existing image URL
      
      // Upload new image if selected
      if (editSignImage) {
        try {
          const uploadResult = await apiService.uploadSignImage(editSignImage);
          imageUrl = uploadResult.imageUrl;
        } catch (error) {
          console.error('Image upload failed:', error);
          Alert.alert('Warning', 'Sign updated but image upload failed. The old image will be kept.');
        }
      }

      const updatedSign = await apiService.updateSign(editingSign.id, {
        name: editSignName.trim(),
        description: editSignDescription.trim() || editSignName.trim(),
        meaning: editSignMeaning.trim() || editSignName.trim(),
        image_url: imageUrl,
        category_id: editingSign.category_id,
      });

      // Reload category signs and categories
      if (selectedCategory) {
        await Promise.all([
          loadCategorySigns(selectedCategory.id),
          loadSignCategories()
        ]);
      }
      
      setEditSignName('');
      setEditSignDescription('');
      setEditSignMeaning('');
      setEditSignImage(null);
      setEditingSign(null);
      setEditSignModalVisible(false);
      
      Alert.alert('Success', 'Sign updated successfully!');
    }, 'update sign');
  };

  const handleDeleteSign = async (signId: number, signName: string) => {
    Alert.alert(
      'Delete Sign',
      `Are you sure you want to delete "${signName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await handleAction(async () => {
              await apiService.deleteSign(signId);
              
              // Reload category signs and categories
              if (selectedCategory) {
                await Promise.all([
                  loadCategorySigns(selectedCategory.id),
                  loadSignCategories()
                ]);
              }
              
              Alert.alert('Success', 'Sign deleted successfully!');
            }, 'delete sign');
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#1dd1a1';
      case 'medium': return '#feca57';
      case 'high': return '#ff9ff3';
      case 'urgent': return '#ff6b6b';
      default: return '#999';
    }
  };

  const handleEditSign = (sign: Sign) => {
    setEditingSign(sign);
    setEditSignName(sign.name);
    setEditSignDescription(sign.description);
    setEditSignMeaning(sign.meaning);
    setEditSignImage(null); // Reset image selection
    setEditSignModalVisible(true);
  };

  const renderSignItem = ({ item }: { item: Sign }) => (
    <View style={styles.signItem}>
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
      <View style={styles.signItemActions}>
        <TouchableOpacity 
          onPress={() => handleEditSign(item)}
          style={styles.editButton}
        >
          <MaterialIcons name="edit" size={20} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDeleteSign(item.id, item.name)}
          style={styles.deleteButton}
        >
          <MaterialIcons name="delete" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleReportAction = async (reportId: number, action: 'approve' | 'reject') => {
    await handleAction(async () => {
      await apiService.updateReport(reportId, { status: action === 'approve' ? 'approved' : 'rejected' });
      
      // Reload reports
      await loadReports();
      
      Alert.alert(
        'Success', 
        `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      );
    }, `${action} report`);
  };

  const getFilteredReports = () => {
    if (reportFilter === 'all') return reports;
    return reports.filter(report => report.status === reportFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#feca57';
      case 'approved': return '#1dd1a1';
      case 'rejected': return '#ff6b6b';
      default: return '#999';
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <Text style={styles.reportType}>{item.report_type}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.reportTitle}>{item.title}</Text>
      <Text style={styles.reportDescription}>{item.description}</Text>
      
      <View style={styles.reportDetails}>
        <View style={styles.reportDetailItem}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{item.address || `${item.latitude}, ${item.longitude}`}</Text>
        </View>
        <View style={styles.reportDetailItem}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{`${item.first_name} ${item.last_name}`}</Text>
        </View>
        <View style={styles.reportDetailItem}>
          <MaterialIcons name="date-range" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.reportActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleReportAction(item.id, 'approve')}
          >
            <MaterialIcons name="check" size={18} color="white" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReportAction(item.id, 'reject')}
          >
            <MaterialIcons name="close" size={18} color="white" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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

        {/* Header */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000}
          style={styles.headerSection}
        >
          <View style={styles.headerGlass}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <Text style={styles.headerSubtitle}>Manage signs & reports</Text>
              </View>
              <View style={styles.adminBadge}>
                <MaterialIcons name="admin-panel-settings" size={20} color="#feca57" />
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Tab Navigation */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000}
          delay={200}
          style={styles.tabSection}
        >
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signs' && styles.activeTab]}
              onPress={() => setActiveTab('signs')}
            >
              <MaterialIcons 
                name="traffic" 
                size={20} 
                color={activeTab === 'signs' ? 'white' : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Text style={[styles.tabText, activeTab === 'signs' && styles.activeTabText]}>
                Manage Signs
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
              onPress={() => router.push("/AdminReportScreen")}
            >
              <MaterialIcons 
                name="report" 
                size={20} 
                color={activeTab === 'reports' ? 'white' : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
                Reports
              </Text>
              <View style={styles.reportsBadge}>
                <Text style={styles.reportsBadgeText}>
                  {reports.filter(r => r.status === 'pending').length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {activeTab === 'signs' ? (
            // Signs Management
            <Animatable.View 
              animation="fadeInUp" 
              duration={1000}
              delay={400}
              style={styles.signsSection}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sign Categories</Text>
                <Text style={styles.sectionSubtitle}>
                  {signCategories.reduce((total, category) => total + category.signCount, 0)} total signs
                </Text>
              </View>
              
              <View style={styles.signsContainer}>
                {signCategories.map((category, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.signCardWrapper,
                      { transform: [{ scale: scaleAnims[Math.min(index, scaleAnims.length - 1)] }] }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.signCard}
                      onPress={() => handleCategoryPress(category, Math.min(index, scaleAnims.length - 1))}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[...category.gradient, category.gradient[1] + '99']}
                        style={styles.signGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.signIconContainer}>
                            <MaterialIcons 
                              name={category.icon} 
                              size={28} 
                              color="white" 
                            />
                        </View>
                        <View style={styles.signContent}>
                          <Text style={styles.signTitle}>{category.name}</Text>
                          <Text style={styles.signDescription}>{category.description}</Text>
                          <Text style={styles.signCount}>{category.signCount} signs</Text>
                        </View>
                        <View style={styles.signArrow}>
                          <MaterialIcons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.9)" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animatable.View>
          ) : (
            <View style={styles.emptySection} />
          )}
        </ScrollView>

        {/* Reports Filter Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={reportsModalVisible}
          onRequestClose={() => setReportsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalContainer}>
              <Text style={styles.filterModalTitle}>Filter Reports</Text>
              
              {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterOption, reportFilter === filter && styles.activeFilterOption]}
                  onPress={() => {
                    setReportFilter(filter as any);
                    setReportsModalVisible(false);
                  }}
                >
                  <Text style={[styles.filterOptionText, reportFilter === filter && styles.activeFilterOptionText]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)} Reports
                  </Text>
                  {reportFilter === filter && (
                    <MaterialIcons name="check" size={20} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Category Signs Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={categoryModalVisible}
          onRequestClose={closeCategoryModal}
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
                    <MaterialIcons name={selectedCategory?.icon || 'traffic'} size={24} color="white" />
                    <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
                  </View>
                  <TouchableOpacity onPress={closeCategoryModal} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>{selectedCategory?.description}</Text>
              </LinearGradient>
              
              <View style={styles.modalContent}>
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.addSignButton}
                    onPress={() => {
                      setAddSignModalVisible(true);
                    }}
                  >
                    <MaterialIcons name="add" size={16} color="white" />
                    <Text style={styles.addSignButtonText}>Add New Sign</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.currentSignsTitle}>Signs in {selectedCategory?.name}</Text>
                <FlatList
                  data={categorySigns}
                  renderItem={renderSignItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.currentSignsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptySignsList}>
                      <MaterialIcons name="traffic" size={48} color="#ccc" />
                      <Text style={styles.emptySignsText}>No signs in this category</Text>
                      <Text style={styles.emptySignsSubtext}>Add the first sign to get started</Text>
                    </View>
                  }
                />

                {/* Add Sign Modal - Now inside category modal */}
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={addSignModalVisible}
                  onRequestClose={() => setAddSignModalVisible(false)}
                >
                  <View style={styles.popupOverlay}>
                    <View style={styles.popupContainer}>
                      <LinearGradient
                        colors={selectedCategory ? selectedCategory.gradient : ['#667eea', '#764ba2']}
                        style={styles.popupHeader}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.modalHeaderContent}>
                          <Text style={styles.modalTitle}>Add Sign to {selectedCategory?.name}</Text>
                          <TouchableOpacity 
                            onPress={() => setAddSignModalVisible(false)}
                            style={styles.closeButton}
                          >
                            <MaterialIcons name="close" size={24} color="white" />
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                      
                      <View style={styles.popupContent}>
                        <Text style={styles.inputLabel}>Sign Name</Text>
                        <TextInput
                          style={styles.textInput}
                          value={newSignName}
                          onChangeText={setNewSignName}
                          placeholder="Enter sign name..."
                          placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                          style={styles.textInput}
                          value={newSignDescription}
                          onChangeText={setNewSignDescription}
                          placeholder="Enter sign description..."
                          placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Meaning</Text>
                        <TextInput
                          style={styles.textInput}
                          value={newSignMeaning}
                          onChangeText={setNewSignMeaning}
                          placeholder="Enter sign meaning..."
                          placeholderTextColor="#999"
                        />

                        {/* Image Upload Section */}
                        <Text style={styles.inputLabel}>Sign Image (Optional)</Text>
                        <View style={styles.imageUploadContainer}>
                          <TouchableOpacity 
                            style={styles.imageContainer} 
                            onPress={pickImage}
                            disabled={loading}
                          >
                            {newSignImage ? (
                              <View style={styles.imagePreviewWrapper}>
                                <Image source={{ uri: newSignImage }} style={styles.imagePreview} />
                                <LinearGradient
                                  colors={['rgba(254, 202, 87, 0.8)', 'rgba(254, 202, 87, 0.4)']}
                                  style={styles.editIconContainer}
                                >
                                  <MaterialIcons name="edit" size={16} color="white" />
                                </LinearGradient>
                              </View>
                            ) : (
                              <View style={styles.uploadPlaceholder}>
                                <MaterialIcons name="add-a-photo" size={32} color="#667eea" />
                                <Text style={styles.uploadPlaceholderText}>Add Image</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                          <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setAddSignModalVisible(false)}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddSign}
                          >
                            <Text style={styles.addButtonText}>Add Sign</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </Modal>

                {/* Edit Sign Modal */}
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={editSignModalVisible}
                  onRequestClose={() => setEditSignModalVisible(false)}
                >
                  <View style={styles.popupOverlay}>
                    <View style={styles.popupContainer}>
                      <LinearGradient
                        colors={selectedCategory ? selectedCategory.gradient : ['#667eea', '#764ba2']}
                        style={styles.popupHeader}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.modalHeaderContent}>
                          <Text style={styles.modalTitle}>Edit Sign</Text>
                          <TouchableOpacity 
                            onPress={() => setEditSignModalVisible(false)}
                            style={styles.closeButton}
                          >
                            <MaterialIcons name="close" size={24} color="white" />
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                      
                      <View style={styles.popupContent}>
                        <Text style={styles.inputLabel}>Sign Name</Text>
                        <TextInput
                          style={styles.textInput}
                          value={editSignName}
                          onChangeText={setEditSignName}
                          placeholder="Enter sign name..."
                          placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                          style={styles.textInput}
                          value={editSignDescription}
                          onChangeText={setEditSignDescription}
                          placeholder="Enter sign description..."
                          placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Meaning</Text>
                        <TextInput
                          style={styles.textInput}
                          value={editSignMeaning}
                          onChangeText={setEditSignMeaning}
                          placeholder="Enter sign meaning..."
                          placeholderTextColor="#999"
                        />

                        {/* Image Upload Section */}
                        <Text style={styles.inputLabel}>Sign Image</Text>
                        <View style={styles.imageUploadContainer}>
                          <TouchableOpacity 
                            style={styles.imageContainer} 
                            onPress={pickEditImage}
                            disabled={loading}
                          >
                            {editSignImage ? (
                              <View style={styles.imagePreviewWrapper}>
                                <Image source={{ uri: editSignImage }} style={styles.imagePreview} />
                                <LinearGradient
                                  colors={['rgba(254, 202, 87, 0.8)', 'rgba(254, 202, 87, 0.4)']}
                                  style={styles.editIconContainer}
                                >
                                  <MaterialIcons name="edit" size={16} color="white" />
                                </LinearGradient>
                              </View>
                            ) : editingSign?.image_url ? (
                              <View style={styles.imagePreviewWrapper}>
                                <Image source={{ uri: API_BASE_URL + editingSign.image_url }} style={styles.imagePreview} />
                                <LinearGradient
                                  colors={['rgba(254, 202, 87, 0.8)', 'rgba(254, 202, 87, 0.4)']}
                                  style={styles.editIconContainer}
                                >
                                  <MaterialIcons name="edit" size={16} color="white" />
                                </LinearGradient>
                              </View>
                            ) : (
                              <View style={styles.uploadPlaceholder}>
                                <MaterialIcons name="add-a-photo" size={32} color="#667eea" />
                                <Text style={styles.uploadPlaceholderText}>Add Image</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                          <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setEditSignModalVisible(false)}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleUpdateSign}
                          >
                            <Text style={styles.addButtonText}>Update Sign</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </Modal>
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
  emptySection: {
    height: 100,
  },
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

  // Header
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  adminBadge: {
    backgroundColor: 'rgba(254, 202, 87, 0.2)',
    borderRadius: 20,
    padding: 8,
  },

  // Tab Navigation
  tabSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: 'white',
  },
  reportsBadge: {
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  reportsBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Signs Section
  signsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  signGradient: {
    padding: 16,
    minHeight: 160,
    position: 'relative',
  },
  signIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  signArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },

  // Reports Section
  reportsSection: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  reportsListContent: {
    paddingBottom: 30,
  },
  reportItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priorityBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reportDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  reportDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportDetailText: {
    fontSize: 12,
    color: '#666',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#1dd1a1',
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
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
  filterModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  currentSignsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  currentSignsList: {
    maxHeight: 200,
  },
  signItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  signItemIcon: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    padding: 6,
    marginRight: 12,
  },
  signItemContent: {
    flex: 1,
  },
  signItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  signItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  signItemMeaning: {
    fontSize: 12,
    color: '#666',
  },
  signItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  filterOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeFilterOption: {
    backgroundColor: '#f5f5ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#666',
  },
  activeFilterOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  signImage: {
    width: 40,
    height: 40,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  addSignButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.7)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addSignButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySignsList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySignsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    marginBottom: 8,
  },
  emptySignsSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  popupHeader: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  popupContent: {
    padding: 20,
  },
  imageUploadContainer: {
    marginBottom: 20,
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholderText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
});
