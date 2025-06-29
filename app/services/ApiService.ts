import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const API_BASE_URL = 'http://192.168.138.138:3000';

export class ApiService {
  static API_BASE_URL = API_BASE_URL;

  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
      console.log('ApiService - Token loaded:', this.token ? `Token exists (${this.token.substring(0, 20)}...)` : 'No token');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem('auth_token', token);
      this.token = token;
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private async removeToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
      this.token = null;
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('ApiService - Authorization header set:', `Bearer ${this.token.substring(0, 20)}...`);
    } else {
      console.log('ApiService - No token available for Authorization header');
    }

    return headers;
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.makeRequest('/api/auth/refresh', {
      method: 'POST',
    }).then(response => {
      if (response.token) {
        this.saveToken(response.token);
        return response.token;
      }
      throw new Error('No token in refresh response');
    }).catch(error => {
      console.error('Token refresh failed:', error);
      this.removeToken();
      throw error;
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Try to refresh token
        try {
          await this.refreshToken();
          // Retry the original request with new token
          config.headers = this.getHeaders();
          const retryResponse = await fetch(url, config);
          
          if (retryResponse.status === 401) {
            // Refresh failed, user needs to login again
            await this.removeToken();
            throw new Error('Authentication required');
          }
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        } catch (refreshError) {
          await this.removeToken();
          throw new Error('Authentication required');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) {
    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      await this.saveToken(response.token);
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      await this.saveToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      // Call logout endpoint if available
      await this.makeRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.log('Logout endpoint not available, proceeding with local logout');
    } finally {
      await this.removeToken();
    }
  }

  async getCurrentUser() {
    return await this.makeRequest('/api/auth/me');
  }

  async refreshAuthToken() {
    return await this.refreshToken();
  }

  // User profile methods
  async loadUserProfile() {
    try {
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  // Admin user management methods
  async getUsers(page = 1, limit = 20, search?: string, role?: string, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    if (status && status !== 'all') params.append('status', status);

    return await this.makeRequest(`/api/admin/users?${params}`);
  }

  async getUserById(id: number) {
    return await this.makeRequest(`/api/admin/users/${id}`);
  }

  async updateUser(id: number, userData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    user_type?: 'user' | 'admin' | 'moderator';
    status?: 'active' | 'suspended' | 'pending';
  }) {
    return await this.makeRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number) {
    return await this.makeRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateUsers(userIds: number[], action: 'activate' | 'suspend' | 'promote' | 'demote') {
    return await this.makeRequest('/api/admin/users/bulk', {
      method: 'PUT',
      body: JSON.stringify({ user_ids: userIds, action }),
    });
  }

  async getUserStats() {
    return await this.makeRequest('/api/admin/users/stats');
  }

  async testAdminRoute() {
    return await this.makeRequest('/api/admin/test');
  }

  async testDatabaseConnection() {
    return await this.makeRequest('/api/admin/db-test');
  }

  async testEnvironment() {
    return await this.makeRequest('/api/admin/env-test');
  }

  // Reports methods
  async getReports(page = 1, limit = 10, filters?: { status?: string; user_id?: number }) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.user_id) params.append('user_id', filters.user_id.toString());
    }

    return await this.makeRequest(`/api/reports?${params}`);
  }

  async getReport(id: number) {
    return await this.makeRequest(`/api/reports/${id}`);
  }

  async createReport(reportData: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    report_type: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    images?: string[];
  }) {
    return await this.makeRequest('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(id: number, updateData: {
    status?: 'pending' | 'approved' | 'rejected';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    description?: string;
  }) {
    return await this.makeRequest(`/api/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteReport(id: number) {
    return await this.makeRequest(`/api/reports/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserReports(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await this.makeRequest(`/api/reports/user/me?${params}`);
  }

  // Notifications methods
  async loadNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unread_only: unreadOnly.toString(),
    });

    return await this.makeRequest(`/api/notifications?${params}`);
  }

  async markNotificationAsRead(id: number) {
    return await this.makeRequest(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return await this.makeRequest('/api/notifications/read-all', {
      method: 'PUT',
    });
  }

  async getUnreadNotificationCount() {
    return await this.makeRequest('/api/notifications/unread-count');
  }

  async deleteNotification(id: number) {
    return await this.makeRequest(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Road State Notifications methods
  async getRoadStateNotifications(page = 1, limit = 20, type?: string, severity?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) params.append('type', type);
    if (severity) params.append('severity', severity);

    return await this.makeRequest(`/api/road-state-notifications?${params}`);
  }

  async getProximityNotifications(latitude: number, longitude: number, radius = 10) {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    return await this.makeRequest(`/api/road-state-notifications/proximity?${params}`);
  }

  async createRoadStateNotification(notificationData: any) {
    return await this.makeRequest('/api/road-state-notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async updateRoadStateNotification(id: number, notificationData: any) {
    return await this.makeRequest(`/api/road-state-notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(notificationData),
    });
  }

  async deleteRoadStateNotification(id: number) {
    return await this.makeRequest(`/api/road-state-notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getRoadStateNotificationStats() {
    return await this.makeRequest('/api/road-state-notifications/stats');
  }

  // User notification preferences
  async updateNotificationPreferences(preferences: any) {
    return await this.makeRequest('/api/users/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  }

  async updatePushToken(pushToken: string) {
    return await this.makeRequest('/api/users/push-token', {
      method: 'PUT',
      body: JSON.stringify({ push_token: pushToken }),
    });
  }

  // Road signs methods
  async loadSignCategories() {
    try {
      return await this.makeRequest('/api/signs/categories');
    } catch (error) {
      console.error('Error loading sign categories:', error);
      throw error;
    }
  }

  async getSigns(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return await this.makeRequest(`/api/signs?${params}`);
  }

  async getSignsByCategory(categoryId: number, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await this.makeRequest(`/api/signs/category/${categoryId}?${params}`);
  }

  async getSign(id: number) {
    return await this.makeRequest(`/api/signs/${id}`);
  }

  async searchSigns(query: string, limit = 10) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return await this.makeRequest(`/api/signs/search/${query}?${params}`);
  }

  async getPopularSigns(limit = 10) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return await this.makeRequest(`/api/signs/popular?${params}`);
  }

  // Search functionality
  async search(query: string) {
    try {
      const [signs, reports] = await Promise.all([
        this.searchSigns(query, 5),
        this.getReports(1, 5, { status: 'pending' }), // You might want to implement report search
      ]);

      return {
        signs,
        reports,
        query,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Health check
  async healthCheck() {
    return await fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.json());
  }

  async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  }) {
    return await this.makeRequest('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updatePassword(old_password: string, new_password: string) {
    return await this.makeRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ old_password, new_password }),
    });
  }

  async uploadAvatar(imageUri: string) {
    // Ensure token is loaded
    await this.loadToken();
    
    const formData = new FormData();
    // Extract filename and type
    const filename = imageUri.split('/').pop() || `avatar.jpg`;
    const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;
    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const url = `${API_BASE_URL}/api/auth/avatar`;
    const headers: any = {
      'Authorization': this.token ? `Bearer ${this.token}` : '',
      // Remove Content-Type - let fetch set it automatically for FormData
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw error;
    }
  }

  async uploadSignImage(imageUri: string) {
    try {
      const formData = new FormData();
      
      // Create file object from URI
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/admin/upload-sign-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.loadToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  async uploadReportImage(imageUri: string) {
    try {
      // Ensure token is loaded
      await this.loadToken();
      
      const formData = new FormData();
      // Extract filename and type
      const filename = imageUri.split('/').pop() || `report_${Date.now()}.jpg`;
      const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const url = `${API_BASE_URL}/api/reports/upload-image`;
      const headers: any = {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        // Remove Content-Type - let fetch set it automatically for FormData
      };
      
      console.log('UploadReportImage - Token:', this.token ? 'Token exists' : 'No token');
      console.log('UploadReportImage - Headers:', headers);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      console.log('UploadReportImage - Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('UploadReportImage - Error data:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('UploadReportImage - Success result:', result);
      return result;
    } catch (error) {
      console.error('Report image upload failed:', error);
      throw error;
    }
  }

  // Category management
  async createCategory(data: { name: string; description: string }) {
    return await this.makeRequest('/api/signs/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: { name?: string; description?: string }) {
    return await this.makeRequest(`/api/signs/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number) {
    return await this.makeRequest(`/api/signs/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Sign management
  async createSign(data: { name: string; description: string; meaning: string; image_url?: string; category_id: number }) {
    return await this.makeRequest('/api/signs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSign(id: number, data: { name?: string; description?: string; meaning?: string; image_url?: string; category_id?: number }) {
    return await this.makeRequest(`/api/signs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSign(id: number) {
    return await this.makeRequest(`/api/signs/${id}`, {
      method: 'DELETE',
    });
  }
}
