import AsyncStorage from '@react-native-async-storage/async-storage';

// Try different possible backend URLs (local IP, Android Emulator IP, and localhost)
const POSSIBLE_BACKEND_URLS = [
  'http://192.168.254.120:3000', // Your actual machine IP
  'http://10.0.2.2:3000',        // Special Android Emulator IP
  'http://localhost:3000'
];

class ApiService {
  constructor() {
    this.baseURL = POSSIBLE_BACKEND_URLS[0];
    this.isBackendAvailable = false;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }
  
  // Test backend connectivity
  async testConnection() {
    for (const url of POSSIBLE_BACKEND_URLS) {
      try {
        console.log(`Testing connection to: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${url}/`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Even 401/404 means the server IS there.
        if (response.status) {
          this.baseURL = url;
          this.isBackendAvailable = true;
          console.log(` ✅ Connected to backend at: ${url}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Failed to connect to: ${url}`, error.message);
      }
    }
    
    this.isBackendAvailable = false;
    return false;
  }

  async request(endpoint, options = {}) {
    // 1. Try to recover token if missing (Fixes the race condition)
    if (!this.authToken) {
      const storedToken = await AsyncStorage.getItem('accessToken');
      if (storedToken) {
        this.authToken = storedToken;
      }
    }

    if (!this.isBackendAvailable) {
      await this.testConnection();
    }

    if (!this.isBackendAvailable) {
      throw new Error('Backend server is not available');
    }

    // Ensure endpoint has a leading slash and remove trailing slash if needed
    // The backend uses /map and /player/profile
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const url = `${this.baseURL}${cleanEndpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Detailed error for debugging 401s
        if (response.status === 401) {
          console.warn('🔑 Authentication failed (401). Token might be expired.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();