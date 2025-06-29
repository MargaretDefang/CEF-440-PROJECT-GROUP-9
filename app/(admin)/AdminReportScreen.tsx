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
  Switch,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { ApiService } from '../services/ApiService';

// Interfaces
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
  images?: string[];
}

interface GroupedReports {
  [key: string]: Report[];
}

const { width, height } = Dimensions.get('window');
const apiService = new ApiService();

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'type' | 'status' | 'priority'>('none');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [reportDetailsVisible, setReportDetailsVisible] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  
  // Real reports data from API
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });

  // Load reports from API
  const loadReports = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setInitialLoading(true);
      }

      const filters: any = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }

      const response = await apiService.getReports(page, 20, filters);
      const newReports = response.reports || [];
      
      if (page === 1 || refresh) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }
      
      setPagination(response.pagination || {
        current_page: page,
        total_pages: 1,
        total_items: newReports.length,
        items_per_page: 20
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports. Please try again.');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize data
  useEffect(() => {
    loadReports(1);
  }, [filterStatus]);

  // Refresh data
  const onRefresh = () => {
    loadReports(1, true);
  };

  // Handle report actions
  const handleReportAction = async (reportId: number, action: 'approve' | 'reject') => {
    try {
      setLoading(true);
      await apiService.updateReport(reportId, { status: action === 'approve' ? 'approved' : 'rejected' });
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action === 'approve' ? 'approved' : 'rejected' }
          : report
      ));
      
      Alert.alert(
        'Success', 
        `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      );
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedReports.length === 0) {
      Alert.alert('No Reports Selected', 'Please select reports to perform bulk actions.');
      return;
    }

    try {
      setLoading(true);
      
      // Update all selected reports
      await Promise.all(
        selectedReports.map(reportId => 
          apiService.updateReport(reportId, { 
            status: action === 'approve' ? 'approved' : 'rejected' 
          })
        )
      );
      
      // Update local state
      setReports(prev => prev.map(report => 
        selectedReports.includes(report.id)
          ? { ...report, status: action === 'approve' ? 'approved' : 'rejected' }
          : report
      ));
      
      // Clear selection
      setSelectedReports([]);
      setBulkSelectMode(false);
      
      Alert.alert(
        'Success', 
        `${selectedReports.length} reports ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      );
    } catch (error) {
      console.error('Error performing bulk action:', error);
      Alert.alert('Error', 'Failed to perform bulk action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleReportSelection = (reportId: number) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedReports([]);
  };

  // Group reports function
  const getGroupedReports = (): { [key: string]: Report[] } => {
    const filteredReports = getFilteredReports();
    
    if (groupBy === 'none') {
      return { 'All Reports': filteredReports };
    }
    
    return filteredReports.reduce((groups: GroupedReports, report) => {
      let key = '';
      
      switch (groupBy) {
        case 'location':
          key = report.address || '';
          break;
        case 'type':
          key = report.report_type;
          break;
        case 'status':
          key = report.status.charAt(0).toUpperCase() + report.status.slice(1);
          break;
        case 'priority':
          key = report.priority.charAt(0).toUpperCase() + report.priority.slice(1);
          break;
        default:
          key = 'All Reports';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(report);
      return groups;
    }, {});
  };

  // Filter and search reports
  const getFilteredReports = (): Report[] => {
    let filtered = reports;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.description.toLowerCase().includes(query) ||
        report.address?.toLowerCase().includes(query) ||
        report.report_type.toLowerCase().includes(query) ||
        report.first_name.toLowerCase().includes(query) ||
        report.last_name.toLowerCase().includes(query)
      );
    }
    
    // Sort reports
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1, urgent: 4 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Utility functions
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
      case 'urgent': return '#ff6b6b';
      default: return '#999';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'remove';
      case 'low': return 'expand-more';
      case 'urgent': return 'priority-high';
      default: return 'remove';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'missing sign': return 'report-problem';
      case 'damaged sign': return 'broken-image';
      case 'vandalized sign': return 'warning';
      case 'incorrect sign': return 'error';
      case 'new sign request': return 'add-circle';
      default: return 'report';
    }
  };

  // Render functions
  const renderReportItem = ({ item: report }: { item: Report }) => (
    <Animatable.View 
      animation="fadeInUp" 
      duration={600}
      style={styles.reportItem}
    >
      <TouchableOpacity
        style={styles.reportContent}
        onPress={() => {
          setSelectedReport(report);
          setReportDetailsVisible(true);
        }}
        onLongPress={() => {
          if (!bulkSelectMode) {
            setBulkSelectMode(true);
            toggleReportSelection(report.id);
          }
        }}
      >
        {bulkSelectMode && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleReportSelection(report.id)}
          >
            <View style={[
              styles.checkbox,
              selectedReports.includes(report.id) && styles.checkboxSelected
            ]}>
              {selectedReports.includes(report.id) && (
                <MaterialIcons name="check" size={14} color="white" />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        <View style={styles.reportIcon}>
          <MaterialIcons 
            name={getTypeIcon(report.report_type)} 
            size={24} 
            color={getPriorityColor(report.priority)} 
          />
        </View>
        
        <View style={styles.reportDetails}>
          <View style={styles.reportHeader}>
            <View style={styles.reportTitleContainer}>
              <Text style={styles.reportType} numberOfLines={1}>{report.report_type}</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(report.priority) }]}>
                  <MaterialIcons name={getPriorityIcon(report.priority)} size={12} color="white" />
                  <Text style={styles.badgeText}>{report.priority.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
              <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.reportDescription} numberOfLines={2}>
            {report.description}
          </Text>
          
          <View style={styles.reportMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="location-on" size={14} color="#666" />
              <Text style={styles.metaText} numberOfLines={1}>{report.address}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="person" size={14} color="#666" />
              <Text style={styles.metaText}>{report.first_name} {report.last_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="date-range" size={14} color="#666" />
              <Text style={styles.metaText}>{new Date(report.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          {report.status === 'pending' && !bulkSelectMode && (
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.quickActionButton, styles.approveButton]}
                onPress={() => handleReportAction(report.id, 'approve')}
              >
                <MaterialIcons name="check" size={16} color="white" />
                <Text style={styles.quickActionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickActionButton, styles.rejectButton]}
                onPress={() => handleReportAction(report.id, 'reject')}
              >
                <MaterialIcons name="close" size={16} color="white" />
                <Text style={styles.quickActionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderGroupedSection = ({ item }: { item: [string, Report[]] }) => {
    const [groupName, groupReports] = item;
    
    return (
      <View style={styles.groupSection}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{groupName}</Text>
          <Text style={styles.groupCount}>
            {groupReports.length} report{groupReports.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <FlatList
          data={groupReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const groupedReports = getGroupedReports();
  const groupedArray = Object.entries(groupedReports);
  const totalReports = getFilteredReports().length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <Animatable.View 
          animation="fadeInDown" 
          duration={1000}
          style={styles.headerSection}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Reports Management</Text>
              <Text style={styles.headerSubtitle}>
                {totalReports} total • {pendingCount} pending
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.filtersToggle}
              onPress={() => setFiltersVisible(true)}
            >
              <MaterialIcons name="tune" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Search Bar */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000}
          delay={200}
          style={styles.searchSection}
        >
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>

        {/* Quick Stats */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={1000}
          delay={400}
          style={styles.statsSection}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{reports.filter(r => r.status === 'approved').length}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{reports.filter(r => r.status === 'rejected').length}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{reports.filter(r => r.priority === 'high').length}</Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
          </ScrollView>
        </Animatable.View>

        {/* Bulk Actions Bar */}
        {bulkSelectMode && (
          <Animatable.View 
            animation="slideInDown" 
            duration={300}
            style={styles.bulkActionsBar}
          >
            <TouchableOpacity 
              style={styles.bulkCancelButton}
              onPress={() => {
                setBulkSelectMode(false);
                setSelectedReports([]);
              }}
            >
              <MaterialIcons name="close" size={20} color="#666" />
              <Text style={styles.bulkCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.bulkSelectedText}>
              {selectedReports.length} selected
            </Text>
            
            <View style={styles.bulkActions}>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.bulkApproveButton]}
                onPress={() => handleBulkAction('approve')}
              >
                <MaterialIcons name="check" size={18} color="white" />
                <Text style={styles.bulkActionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.bulkRejectButton]}
                onPress={() => handleBulkAction('reject')}
              >
                <MaterialIcons name="close" size={18} color="white" />
                <Text style={styles.bulkActionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        {/* Reports List */}
        <View style={styles.reportsContainer}>
          {groupBy === 'none' ? (
            <FlatList
              data={getFilteredReports()}
              renderItem={renderReportItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reportsListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              }
            />
          ) : (
            <FlatList
              data={groupedArray}
              renderItem={renderGroupedSection}
              keyExtractor={(item) => item[0]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reportsListContent}
            />
          )}
        </View>

        {/* Filters Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={filtersVisible}
          onRequestClose={() => setFiltersVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filtersModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters & Sorting</Text>
                <TouchableOpacity 
                  onPress={() => setFiltersVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                {/* Group By */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Group By</Text>
                  {['none', 'location', 'type', 'status', 'priority'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterOption, groupBy === option && styles.activeFilterOption]}
                      onPress={() => setGroupBy(option as any)}
                    >
                      <Text style={[styles.filterOptionText, groupBy === option && styles.activeFilterOptionText]}>
                        {option === 'none' ? 'No Grouping' : option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                      {groupBy === option && (
                        <MaterialIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Sort By */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Sort By</Text>
                  {[
                    { value: 'date', label: 'Date (Newest First)' },
                    { value: 'priority', label: 'Priority (High First)' },
                    { value: 'status', label: 'Status' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.filterOption, sortBy === option.value && styles.activeFilterOption]}
                      onPress={() => setSortBy(option.value as any)}
                    >
                      <Text style={[styles.filterOptionText, sortBy === option.value && styles.activeFilterOptionText]}>
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <MaterialIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filter by Status */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Filter by Status</Text>
                  {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterOption, filterStatus === status && styles.activeFilterOption]}
                      onPress={() => setFilterStatus(status as any)}
                    >
                      <Text style={[styles.filterOptionText, filterStatus === status && styles.activeFilterOptionText]}>
                        {status === 'all' ? 'All Reports' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                      {filterStatus === status && (
                        <MaterialIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Report Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reportDetailsVisible}
          onRequestClose={() => setReportDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              {selectedReport && (
                <>
                  <LinearGradient
                    colors={[getPriorityColor(selectedReport.priority), getPriorityColor(selectedReport.priority) + '80']}
                    style={styles.detailsHeader}
                  >
                    <TouchableOpacity 
                      onPress={() => setReportDetailsVisible(false)}
                      style={styles.detailsCloseButton}
                    >
                      <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.detailsTitle}>{selectedReport.report_type}</Text>
                    <View style={styles.detailsBadges}>
                      <View style={[styles.detailsStatusBadge, { backgroundColor: getStatusColor(selectedReport.status) }]}>
                        <Text style={styles.detailsBadgeText}>{selectedReport.status.toUpperCase()}</Text>
                      </View>
                      <View style={styles.detailsPriorityBadge}>
                        <MaterialIcons name={getPriorityIcon(selectedReport.priority)} size={14} color="white" />
                        <Text style={styles.detailsBadgeText}>{selectedReport.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  
                  <ScrollView style={styles.detailsContent}>
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>Description</Text>
                      <Text style={styles.detailsDescription}>{selectedReport.description}</Text>
                    </View>
                    
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>Location</Text>
                      <View style={styles.detailsLocationRow}>
                        <MaterialIcons name="location-on" size={20} color="#667eea" />
                        <Text style={styles.detailsLocationText}>{selectedReport.address}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailsInfoGrid}>
                      <View style={styles.detailsInfoItem}>
                        <MaterialIcons name="person" size={18} color="#666" />
                        <Text style={styles.detailsInfoLabel}>Reported By</Text>
                        <Text style={styles.detailsInfoValue}>{selectedReport.first_name} {selectedReport.last_name}</Text>
                      </View>
                      <View style={styles.detailsInfoItem}>
                        <MaterialIcons name="date-range" size={18} color="#666" />
                        <Text style={styles.detailsInfoLabel}>Date</Text>
                        <Text style={styles.detailsInfoValue}>{new Date(selectedReport.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    
                    {selectedReport.status === 'pending' && (
                      <View style={styles.detailsActions}>
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsApproveButton]}
                          onPress={() => {
                            handleReportAction(selectedReport.id, 'approve');
                            setReportDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="check" size={20} color="white" />
                          <Text style={styles.detailsActionText}>Approve Report</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsRejectButton]}
                          onPress={() => {
                            handleReportAction(selectedReport.id, 'reject');
                            setReportDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="close" size={20} color="white" />
                          <Text style={styles.detailsActionText}>Reject Report</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                </>
              )}
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

  // Header
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  filtersToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },

  // Search Bar
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  statsScroll: {
    paddingBottom: 5,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: 120,
    marginRight: 12,
    alignItems: 'center',
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
    textAlign: 'center',
  },

  // Bulk Actions Bar
  bulkActionsBar: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bulkCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkCancelText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  bulkSelectedText: {
    color: '#333',
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  bulkApproveButton: {
    backgroundColor: '#1dd1a1',
  },
  bulkRejectButton: {
    backgroundColor: '#ff6b6b',
  },
  bulkActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Reports List
  reportsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reportsListContent: {
    paddingBottom: 30,
  },
  reportItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportContent: {
    padding: 16,
    flexDirection: 'row',
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  reportIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  reportDetails: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  badgeText: {
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
  reportMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    maxWidth: 120,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickActionButton: {
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
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Grouped Reports
  groupSection: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  groupCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  detailsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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

  // Report Details Modal
  detailsHeader: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40,
  },
  detailsCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  detailsBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailsPriorityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsContent: {
    padding: 20,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailsLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsLocationText: {
    fontSize: 14,
    color: '#333',
  },
  detailsInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  detailsInfoItem: {
    width: '48%',
  },
  detailsInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 2,
  },
  detailsInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  detailsActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailsApproveButton: {
    backgroundColor: '#1dd1a1',
  },
  detailsRejectButton: {
    backgroundColor: '#ff6b6b',
  },
  detailsActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});