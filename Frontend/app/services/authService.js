import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const PLAYER_KEY = 'playerData';

export const authService = {
  // Login function
  async login(email, password) {
    try {
      const response = await apiService.post('/player/login/', { email, password });
      
      if (response.success) {
        const { accessToken, player } = response.data;
        // Attempt to get refreshToken from data if the backend sends it there. 
        // If it's strictly a cookie, it might need extra handling, but we assume it's accessible.
        const refreshToken = response.data.refreshToken || response.refreshToken;
        
        await this.setSession(accessToken, refreshToken, player);
        return player;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  },

  // Stub for Signup (you can implement the endpoint later)
  async signup(userData) {
    try {
      // Assuming endpoint is similar
      const response = await apiService.post('/player/signup/', userData);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Signup failed');
    } catch (error) {
      throw error;
    }
  },

  // Helper to save tokens and user data
  async setSession(accessToken, refreshToken, player) {
    if (accessToken) {
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      apiService.setAuthToken(accessToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (player) {
      await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(player));
    }
  },

  // Refresh Token logic
  async refreshAccessToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await apiService.post('/auth/refresh', { refreshToken });
      
      if (response.success && response.data.token) {
        const newAccessToken = response.data.token;
        await AsyncStorage.setItem(TOKEN_KEY, newAccessToken);
        apiService.setAuthToken(newAccessToken);
        return newAccessToken;
      }
      throw new Error('Refresh failed');
    } catch (error) {
      // If refresh fails, you might want to logout
      await this.logout();
      throw error;
    }
  },

  // Initialize app: restore session
  async loadUser() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const player = await AsyncStorage.getItem(PLAYER_KEY);
    
    if (token) {
      apiService.setAuthToken(token);
    }
    
    return player ? JSON.parse(player) : null;
  },

  // Logout
  async logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(PLAYER_KEY);
    apiService.setAuthToken(null);
  }
};