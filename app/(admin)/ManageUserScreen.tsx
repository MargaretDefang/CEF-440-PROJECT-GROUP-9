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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { ApiService, API_BASE_URL } from '../services/ApiService';

// Interfaces
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'admin' | 'moderator' | 'user';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
  reports_count: number;
  avatar_url?: string;
  phone?: string;
}

const { width, height } = Dimensions.get('window');

export default function ManageUsersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailsVisible, setUserDetailsVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  
  // Real users data
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const [pagination, setPagination] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const apiService = new ApiService();

  // Fetch users on mount and when filters change
  useEffect(() => {
    const initializeData = async () => {
      // Small delay to ensure token is loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('ManageUserScreen - Initializing data...');
      await fetchUsers();
      await fetchUserStats();
    };
    
    initializeData();
  }, [currentPage, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await apiService.getUsers(currentPage, 20, searchQuery, roleFilter, statusFilter);
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log('ManageUserScreen - Fetching user stats...');
      const stats = await apiService.getUserStats();
      console.log('ManageUserScreen - User stats received:', stats);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Handle user actions
  const handleUserAction = async (userId: number, action: 'activate' | 'suspend' | 'promote' | 'demote') => {
    try {
      setLoading(true);
      
      let updateData: any = {};
      
      switch (action) {
        case 'activate':
          updateData.status = 'active';
          break;
        case 'suspend':
          updateData.status = 'suspended';
          break;
        case 'promote':
          updateData.user_type = 'moderator';
          break;
        case 'demote':
          updateData.user_type = 'user';
          break;
      }
      
      await apiService.updateUser(userId, updateData);
      
      // Refresh users and stats
      await fetchUsers();
      await fetchUserStats();
      
      Alert.alert(
        'Success', 
        `User ${action === 'activate' ? 'activated' : 
          action === 'suspend' ? 'suspended' : 
          action === 'promote' ? 'promoted' : 'demoted'} successfully!`
      );
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'activate' | 'suspend') => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select users first');
      return;
    }
    
    Alert.alert(
      'Confirm Bulk Action',
      `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.bulkUpdateUsers(selectedUsers, action);
              
              // Refresh users and stats
              await fetchUsers();
              await fetchUserStats();
              
              setSelectedUsers([]);
              setBulkSelectMode(false);
              Alert.alert('Success', `${selectedUsers.length} user(s) ${action === 'activate' ? 'activated' : 'suspended'} successfully!`);
            } catch (error) {
              console.error('Error bulk updating users:', error);
              Alert.alert('Error', 'Failed to update users');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#1dd1a1';
      case 'suspended': return '#ff6b6b';
      case 'pending': return '#feca57';
      default: return '#999';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#667eea';
      case 'moderator': return '#764ba2';
      case 'user': return '#48dbfb';
      default: return '#999';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'security';
      case 'moderator': return 'supervisor-account';
      case 'user': return 'person';
      default: return 'person';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUserFullName = (user: User) => {
    return `${user.first_name} ${user.last_name}`;
  };

  const getUserAvatarUrl = (user: User) => {
    if (user.avatar_url) {
      return user.avatar_url.startsWith('http') 
        ? user.avatar_url 
        : `${API_BASE_URL}${user.avatar_url}`;
    }
    return null;
  };

  // Render functions
  const renderUserItem = ({ item: user }: { item: User }) => (
    <Animatable.View 
      animation="fadeInUp" 
      duration={600}
      style={styles.userItem}
    >
      <TouchableOpacity
        style={styles.userContent}
        onPress={() => {
          setSelectedUser(user);
          setUserDetailsVisible(true);
        }}
        onLongPress={() => {
          if (!bulkSelectMode) {
            setBulkSelectMode(true);
            toggleUserSelection(user.id);
          }
        }}
      >
        {bulkSelectMode && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleUserSelection(user.id)}
          >
            <View style={[
              styles.checkbox,
              selectedUsers.includes(user.id) && styles.checkboxSelected
            ]}>
              {selectedUsers.includes(user.id) && (
                <MaterialIcons name="check" size={14} color="white" />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {user.avatar_url ? (
          <Image source={{ uri: getUserAvatarUrl(user) }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
        )}
        
        <View style={styles.userDetails}>
          <View style={styles.userHeader}>
            <Text style={styles.userName} numberOfLines={1}>{getUserFullName(user)}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.user_type) }]}>
                <MaterialIcons name={getRoleIcon(user.user_type)} size={12} color="white" />
                <Text style={styles.badgeText}>{user.user_type.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
          
          <View style={styles.userMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="date-range" size={12} color="#666" />
              <Text style={styles.metaText}>Joined: {formatDate(user.created_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="report" size={12} color="#666" />
              <Text style={styles.metaText}>Reports: {user.reports_count}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
            <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const filteredUsers = users;
  const activeCount = userStats.active_users || 0;
  const suspendedCount = userStats.suspended_users || 0;
  const pendingCount = userStats.pending_users || 0;
  const totalCount = userStats.total_users || 0;

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
              <Text style={styles.headerTitle}>Manage Users</Text>
              <Text style={styles.headerSubtitle}>
                {filteredUsers.length} users • {activeCount} active
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
              placeholder="Search users..."
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
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{suspendedCount}</Text>
              <Text style={styles.statLabel}>Suspended</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
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
                setSelectedUsers([]);
              }}
            >
              <MaterialIcons name="close" size={20} color="#666" />
              <Text style={styles.bulkCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.bulkSelectedText}>
              {selectedUsers.length} selected
            </Text>
            
            <View style={styles.bulkActions}>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.bulkActivateButton]}
                onPress={() => handleBulkAction('activate')}
              >
                <MaterialIcons name="check" size={18} color="white" />
                <Text style={styles.bulkActionText}>Activate</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.bulkSuspendButton]}
                onPress={() => handleBulkAction('suspend')}
              >
                <MaterialIcons name="pause" size={18} color="white" />
                <Text style={styles.bulkActionText}>Suspend</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        {/* Users List */}
        <View style={styles.usersContainer}>
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersListContent}
          />
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
                <Text style={styles.modalTitle}>User Filters</Text>
                <TouchableOpacity 
                  onPress={() => setFiltersVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                {/* Filter by Role */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Filter by Role</Text>
                  {['all', 'admin', 'moderator', 'user'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.filterOption, roleFilter === role && styles.activeFilterOption]}
                      onPress={() => setRoleFilter(role as any)}
                    >
                      <Text style={[styles.filterOptionText, roleFilter === role && styles.activeFilterOptionText]}>
                        {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                      {roleFilter === role && (
                        <MaterialIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filter by Status */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Filter by Status</Text>
                  {['all', 'active', 'suspended', 'pending'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterOption, statusFilter === status && styles.activeFilterOption]}
                      onPress={() => setStatusFilter(status as any)}
                    >
                      <Text style={[styles.filterOptionText, statusFilter === status && styles.activeFilterOptionText]}>
                        {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                      {statusFilter === status && (
                        <MaterialIcons name="check" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* User Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={userDetailsVisible}
          onRequestClose={() => setUserDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              {selectedUser && (
                <>
                  <LinearGradient
                    colors={[getRoleColor(selectedUser.user_type), getRoleColor(selectedUser.user_type) + '80']}
                    style={styles.detailsHeader}
                  >
                    <TouchableOpacity 
                      onPress={() => setUserDetailsVisible(false)}
                      style={styles.detailsCloseButton}
                    >
                      <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    
                    {getUserAvatarUrl(selectedUser) && (
                      <Image source={{ uri: getUserAvatarUrl(selectedUser) }} style={styles.detailsAvatar} />
                    )}
                    
                    <Text style={styles.detailsTitle}>{getUserFullName(selectedUser)}</Text>
                    <Text style={styles.detailsSubtitle}>{selectedUser.email}</Text>
                    
                    <View style={styles.detailsBadges}>
                      <View style={[styles.detailsStatusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                        <Text style={styles.detailsBadgeText}>{selectedUser.status.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.detailsRoleBadge, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                        <MaterialIcons name={getRoleIcon(selectedUser.user_type)} size={14} color="white" />
                        <Text style={styles.detailsBadgeText}>{selectedUser.user_type.toUpperCase()}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  
                  <ScrollView style={styles.detailsContent}>
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>User Information</Text>
                      
                      <View style={styles.detailsInfoGrid}>
                        <View style={styles.detailsInfoItem}>
                          <MaterialIcons name="date-range" size={18} color="#666" />
                          <Text style={styles.detailsInfoLabel}>Joined</Text>
                          <Text style={styles.detailsInfoValue}>{formatDate(selectedUser.created_at)}</Text>
                        </View>
                        <View style={styles.detailsInfoItem}>
                          <MaterialIcons name="update" size={18} color="#666" />
                          <Text style={styles.detailsInfoLabel}>Last Active</Text>
                          <Text style={styles.detailsInfoValue}>{formatDate(selectedUser.updated_at)}</Text>
                        </View>
                        <View style={styles.detailsInfoItem}>
                          <MaterialIcons name="report" size={18} color="#666" />
                          <Text style={styles.detailsInfoLabel}>Reports Submitted</Text>
                          <Text style={styles.detailsInfoValue}>{selectedUser.reports_count}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.detailsActions}>
                      {selectedUser.status !== 'active' && (
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsActivateButton]}
                          onPress={() => {
                            handleUserAction(selectedUser.id, 'activate');
                            setUserDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="check" size={20} color="white" />
                          <Text style={styles.detailsActionText}>Activate User</Text>
                        </TouchableOpacity>
                      )}
                      
                      {selectedUser.status !== 'suspended' && (
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsSuspendButton]}
                          onPress={() => {
                            handleUserAction(selectedUser.id, 'suspend');
                            setUserDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="pause" size={20} color="white" />
                          <Text style={styles.detailsActionText}>Suspend User</Text>
                        </TouchableOpacity>
                      )}
                      
                      {selectedUser.user_type !== 'admin' && (
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsPromoteButton]}
                          onPress={() => {
                            handleUserAction(selectedUser.id, 'promote');
                            setUserDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="arrow-upward" size={20} color="white" />
                          <Text style={styles.detailsActionText}>
                            {selectedUser.user_type === 'user' ? 'Promote to Moderator' : 'Promote to Admin'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      {selectedUser.user_type !== 'user' && (
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsDemoteButton]}
                          onPress={() => {
                            handleUserAction(selectedUser.id, 'demote');
                            setUserDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="arrow-downward" size={20} color="white" />
                          <Text style={styles.detailsActionText}>
                            {selectedUser.user_type === 'admin' ? 'Demote to Moderator' : 'Demote to User'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
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
  bulkActivateButton: {
    backgroundColor: '#1dd1a1',
  },
  bulkSuspendButton: {
    backgroundColor: '#ff6b6b',
  },
  bulkActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Users List
  usersContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  usersListContent: {
    paddingBottom: 30,
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userContent: {
    padding: 16,
    flexDirection: 'row',
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filtersModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingBottom: 10,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeFilterOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  detailsModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  detailsHeader: {
    padding: 16,
    alignItems: 'center',
  },
  detailsCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  detailsAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  detailsAvatarPlaceholder: {
    backgroundColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  detailsSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  detailsBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  detailsStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailsRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  detailsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  detailsContent: {
    padding: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  detailsInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailsInfoItem: {
    width: '45%',
    backgroundColor: '#f7f7f7',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  detailsInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  detailsInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailsActions: {
    gap: 8,
  },
  detailsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  detailsActivateButton: {
    backgroundColor: '#1dd1a1',
  },
  detailsSuspendButton: {
    backgroundColor: '#ff6b6b',
  },
  detailsPromoteButton: {
    backgroundColor: '#667eea',
  },
  detailsDemoteButton: {
    backgroundColor: '#feca57',
  },
  detailsActionText: {
    color: 'white',
    fontWeight: '600',
  },
});
