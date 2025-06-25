import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://192.168.30.138:3000'; // Updated to correct backend IP

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

    return await this.makeRequest(`/reports?${params}`);
  }

  async getReport(id: number) {
    return await this.makeRequest(`/reports/${id}`);
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
    return await this.makeRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(id: number, updateData: {
    status?: 'pending' | 'approved' | 'rejected';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    description?: string;
  }) {
    return await this.makeRequest(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteReport(id: number) {
    return await this.makeRequest(`/reports/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserReports(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await this.makeRequest(`/reports/user/me?${params}`);
  }

  // Notifications methods
  async loadNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unread_only: unreadOnly.toString(),
    });

    return await this.makeRequest(`/notifications?${params}`);
  }

  async markNotificationAsRead(id: number) {
    return await this.makeRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return await this.makeRequest('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async getUnreadNotificationCount() {
    return await this.makeRequest('/notifications/unread-count');
  }

  async deleteNotification(id: number) {
    return await this.makeRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Road signs methods
  async loadSignCategories() {
    try {
      return await this.makeRequest('/signs/categories');
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

    return await this.makeRequest(`/signs?${params}`);
  }

  async getSignsByCategory(categoryId: number, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await this.makeRequest(`/signs/category/${categoryId}?${params}`);
  }

  async getSign(id: number) {
    return await this.makeRequest(`/signs/${id}`);
  }

  async searchSigns(query: string, limit = 10) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return await this.makeRequest(`/signs/search/${query}?${params}`);
  }

  async getPopularSigns(limit = 10) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return await this.makeRequest(`/signs/popular?${params}`);
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
}
