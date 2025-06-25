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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  reportsSubmitted: number;
  avatar?: string;
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  
  // Mock users data
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@roadbro.com',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2025-06-20',
      reportsSubmitted: 42,
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      id: '2',
      name: 'Moderator One',
      email: 'mod1@roadbro.com',
      role: 'moderator',
      status: 'active',
      joinDate: '2024-03-10',
      lastActive: '2025-06-19',
      reportsSubmitted: 28,
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      id: '3',
      name: 'Regular User',
      email: 'user1@roadbro.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-05-22',
      lastActive: '2025-06-18',
      reportsSubmitted: 15,
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
    },
    {
      id: '4',
      name: 'Suspended User',
      email: 'suspended@roadbro.com',
      role: 'user',
      status: 'suspended',
      joinDate: '2024-02-05',
      lastActive: '2025-05-30',
      reportsSubmitted: 5,
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
    },
    {
      id: '5',
      name: 'New User',
      email: 'pending@roadbro.com',
      role: 'user',
      status: 'pending',
      joinDate: '2025-06-10',
      lastActive: '2025-06-10',
      reportsSubmitted: 0,
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
    },
    {
      id: '6',
      name: 'Power User',
      email: 'poweruser@roadbro.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-04-18',
      lastActive: '2025-06-17',
      reportsSubmitted: 36,
      avatar: 'https://randomuser.me/api/portraits/women/6.jpg'
    },
    {
      id: '7',
      name: 'Moderator Two',
      email: 'mod2@roadbro.com',
      role: 'moderator',
      status: 'active',
      joinDate: '2024-06-01',
      lastActive: '2025-06-16',
      reportsSubmitted: 19,
      avatar: 'https://randomuser.me/api/portraits/men/7.jpg'
    },
    {
      id: '8',
      name: 'Inactive User',
      email: 'inactive@roadbro.com',
      role: 'user',
      status: 'suspended',
      joinDate: '2024-07-15',
      lastActive: '2025-04-22',
      reportsSubmitted: 8,
      avatar: 'https://randomuser.me/api/portraits/women/8.jpg'
    }
  ]);

  // Filter and search users
  const getFilteredUsers = (): User[] => {
    let filtered = users;
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Handle user actions
  const handleUserAction = (userId: string, action: 'activate' | 'suspend' | 'promote' | 'demote') => {
    setUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      
      switch (action) {
        case 'activate':
          return { ...user, status: 'active' };
        case 'suspend':
          return { ...user, status: 'suspended' };
        case 'promote':
          return { ...user, role: user.role === 'user' ? 'moderator' : 'admin' };
        case 'demote':
          return { ...user, role: user.role === 'admin' ? 'moderator' : 'user' };
        default:
          return user;
      }
    }));
    
    Alert.alert(
      'Success', 
      `User ${action === 'activate' ? 'activated' : 
        action === 'suspend' ? 'suspended' : 
        action === 'promote' ? 'promoted' : 'demoted'} successfully!`
    );
  };

  // Bulk actions
  const handleBulkAction = (action: 'activate' | 'suspend') => {
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
          onPress: () => {
            setUsers(prev => prev.map(user => 
              selectedUsers.includes(user.id)
                ? { ...user, status: action === 'activate' ? 'active' : 'suspended' }
                : user
            ));
            setSelectedUsers([]);
            setBulkSelectMode(false);
            Alert.alert('Success', `${selectedUsers.length} user(s) ${action === 'activate' ? 'activated' : 'suspended'} successfully!`);
          }
        }
      ]
    );
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
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
        
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
        )}
        
        <View style={styles.userDetails}>
          <View style={styles.userHeader}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                <MaterialIcons name={getRoleIcon(user.role)} size={12} color="white" />
                <Text style={styles.badgeText}>{user.role.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
          
          <View style={styles.userMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="date-range" size={12} color="#666" />
              <Text style={styles.metaText}>Joined: {user.joinDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="report" size={12} color="#666" />
              <Text style={styles.metaText}>Reports: {user.reportsSubmitted}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
            <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const filteredUsers = getFilteredUsers();
  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;

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
              <Text style={styles.statNumber}>{users.length}</Text>
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
            keyExtractor={(item) => item.id}
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
                    colors={[getRoleColor(selectedUser.role), getRoleColor(selectedUser.role) + '80']}
                    style={styles.detailsHeader}
                  >
                    <TouchableOpacity 
                      onPress={() => setUserDetailsVisible(false)}
                      style={styles.detailsCloseButton}
                    >
                      <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    
                    {selectedUser.avatar ? (
                      <Image source={{ uri: selectedUser.avatar }} style={styles.detailsAvatar} />
                    ) : (
                      <View style={[styles.detailsAvatar, styles.detailsAvatarPlaceholder]}>
                        <MaterialIcons name="person" size={36} color="white" />
                      </View>
                    )}
                    
                    <Text style={styles.detailsTitle}>{selectedUser.name}</Text>
                    <Text style={styles.detailsSubtitle}>{selectedUser.email}</Text>
                    
                    <View style={styles.detailsBadges}>
                      <View style={[styles.detailsStatusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                        <Text style={styles.detailsBadgeText}>{selectedUser.status.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.detailsRoleBadge, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                        <MaterialIcons name={getRoleIcon(selectedUser.role)} size={14} color="white" />
                        <Text style={styles.detailsBadgeText}>{selectedUser.role.toUpperCase()}</Text>
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
                          <Text style={styles.detailsInfoValue}>{selectedUser.joinDate}</Text>
                        </View>
                        <View style={styles.detailsInfoItem}>
                          <MaterialIcons name="update" size={18} color="#666" />
                          <Text style={styles.detailsInfoLabel}>Last Active</Text>
                          <Text style={styles.detailsInfoValue}>{selectedUser.lastActive}</Text>
                        </View>
                        <View style={styles.detailsInfoItem}>
                          <MaterialIcons name="report" size={18} color="#666" />
                          <Text style={styles.detailsInfoLabel}>Reports Submitted</Text>
                          <Text style={styles.detailsInfoValue}>{selectedUser.reportsSubmitted}</Text>
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
                      
                      {selectedUser.role !== 'admin' && (
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsPromoteButton]}
                          onPress={() => {
                            handleUserAction(selectedUser.id, 'promote');
                            setUserDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="arrow-upward" size={20} color="white" />
                          <Text style={styles.detailsActionText}>
                            {selectedUser.role === 'user' ? 'Promote to Moderator' : 'Promote to Admin'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      {selectedUser.role !== 'user' && (
                        <TouchableOpacity 
                          style={[styles.detailsActionButton, styles.detailsDemoteButton]}
                          onPress={() => {
                            handleUserAction(selectedUser.id, 'demote');
                            setUserDetailsVisible(false);
                          }}
                        >
                          <MaterialIcons name="arrow-downward" size={20} color="white" />
                          <Text style={styles.detailsActionText}>
                            {selectedUser.role === 'admin' ? 'Demote to Moderator' : 'Demote to User'}
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
