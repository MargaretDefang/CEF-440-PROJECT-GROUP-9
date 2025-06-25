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
  Modal,
  FlatList,
  TextInput,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Interfaces
interface SignCategory {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient: [string, string];
  signs: string[];
}

interface Report {
  id: string;
  type: string;
  description: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  reportedBy: string;
  dateReported: string;
  priority: 'low' | 'medium' | 'high';
}

const { width, height } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signs' | 'reports'>('signs');
  const [selectedCategory, setSelectedCategory] = useState<SignCategory | null>(null);
  const [addSignModalVisible, setAddSignModalVisible] = useState(false);
  const [reportsModalVisible, setReportsModalVisible] = useState(false);
  const [newSignName, setNewSignName] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  // Sign categories (same as home screen)
  const [signCategories, setSignCategories] = useState<SignCategory[]>([
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
    }
  ]);

  // Mock reports data
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      type: 'Missing Sign',
      description: 'Stop sign missing at intersection of Main St and Oak Ave',
      location: 'Main St & Oak Ave',
      status: 'pending',
      reportedBy: 'John Doe',
      dateReported: '2025-06-20',
      priority: 'high'
    },
    {
      id: '2',
      type: 'Damaged Sign',
      description: 'Speed limit sign is faded and barely readable',
      location: 'Highway 101, Mile 45',
      status: 'approved',
      reportedBy: 'Jane Smith',
      dateReported: '2025-06-19',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'Incorrect Sign',
      description: 'Wrong speed limit posted - should be 35 mph not 25 mph',
      location: 'School District Road',
      status: 'pending',
      reportedBy: 'Mike Johnson',
      dateReported: '2025-06-18',
      priority: 'low'
    },
    {
      id: '4',
      type: 'New Sign Request',
      description: 'Need pedestrian crossing sign near new shopping center',
      location: 'Commerce Blvd',
      status: 'rejected',
      reportedBy: 'Sarah Wilson',
      dateReported: '2025-06-17',
      priority: 'medium'
    },
    {
      id: '5',
      type: 'Vandalized Sign',
      description: 'Graffiti on yield sign, needs cleaning/replacement',
      location: 'Park Street',
      status: 'approved',
      reportedBy: 'Robert Brown',
      dateReported: '2025-06-16',
      priority: 'high'
    }
  ]);

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

  const handleAddSign = () => {
    if (!newSignName.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please enter a sign name');
      return;
    }

    setSignCategories(prev => prev.map(category => 
      category.title === selectedCategory.title 
        ? { ...category, signs: [...category.signs, newSignName.trim()] }
        : category
    ));

    setNewSignName('');
    setAddSignModalVisible(false);
    setSelectedCategory(null);
    
    Alert.alert('Success', 'Sign added successfully!');
  };

  const handleDeleteSign = (categoryTitle: string, signToDelete: string) => {
    Alert.alert(
      'Delete Sign',
      `Are you sure you want to delete "${signToDelete}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSignCategories(prev => prev.map(category => 
              category.title === categoryTitle 
                ? { ...category, signs: category.signs.filter(sign => sign !== signToDelete) }
                : category
            ));
          }
        }
      ]
    );
  };

  const handleReportAction = (reportId: string, action: 'approve' | 'reject') => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'approve' ? 'approved' : 'rejected' }
        : report
    ));
    
    Alert.alert(
      'Success', 
      `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
    );
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#feca57';
      case 'low': return '#48dbfb';
      default: return '#999';
    }
  };

  const renderSignItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.signItem}>
      <View style={styles.signItemIcon}>
        <MaterialIcons name="traffic" size={20} color="#667eea" />
      </View>
      <Text style={styles.signItemText}>{item}</Text>
      <TouchableOpacity 
        onPress={() => handleDeleteSign(selectedCategory?.title || '', item)}
        style={styles.deleteButton}
      >
        <MaterialIcons name="delete" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  const renderReportItem = ({ item }: { item: Report }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <Text style={styles.reportType}>{item.type}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.reportDescription}>{item.description}</Text>
      
      <View style={styles.reportDetails}>
        <View style={styles.reportDetailItem}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{item.location}</Text>
        </View>
        <View style={styles.reportDetailItem}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{item.reportedBy}</Text>
        </View>
        <View style={styles.reportDetailItem}>
          <MaterialIcons name="date-range" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{item.dateReported}</Text>
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
                  {signCategories.reduce((total, category) => total + category.signs.length, 0)} total signs
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
                      onPress={() => {
                        animatePress(Math.min(index, scaleAnims.length - 1));
                        setSelectedCategory(category);
                        setAddSignModalVisible(true);
                      }}
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
                          <Text style={styles.signTitle}>{category.title}</Text>
                          <Text style={styles.signDescription}>{category.description}</Text>
                          <Text style={styles.signCount}>{category.signs.length} signs</Text>
                        </View>
                        <View style={styles.addIcon}>
                          <MaterialIcons name="add" size={20} color="white" />
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

        {/* Add Sign Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={addSignModalVisible}
          onRequestClose={() => setAddSignModalVisible(false)}
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
                  <Text style={styles.modalTitle}>Add Sign to {selectedCategory?.title}</Text>
                  <TouchableOpacity 
                    onPress={() => setAddSignModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              
              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>Sign Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newSignName}
                  onChangeText={setNewSignName}
                  placeholder="Enter sign name..."
                  placeholderTextColor="#999"
                />

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

                {/* Current Signs List */}
                <Text style={styles.currentSignsTitle}>Current Signs in {selectedCategory?.title}</Text>
                <FlatList
                  data={selectedCategory?.signs || []}
                  renderItem={renderSignItem}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  style={styles.currentSignsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
        </Modal>

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
  addIcon: {
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
    gap: 12,
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
  signItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
});

