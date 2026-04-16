import AsyncStorage from '@react-native-async-storage/async-storage';

const POSSIBLE_BACKEND_URLS = [
  'http://192.168.100.207:3000'
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

  async request(endpoint, options = {}, isRetry = false) {
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

      let isJwtExpired = false;
      let errorData = null;

      // ✅ Step 1: Safely parse the error body first if the request failed
      if (!response.ok) {
        const clone = response.clone(); // Clone so we don't consume the stream
        try {
          errorData = await clone.json();
          const errMsg = typeof errorData.error === 'string' ? errorData.error : errorData.message;
          
          // Trigger refresh if status is 401 OR if the text explicitly says "jwt expired"
          if (response.status === 401 || (errMsg && errMsg.includes('jwt expired'))) {
            isJwtExpired = true;
          }
        } catch (e) {
          if (response.status === 401) isJwtExpired = true;
        }
      }
      
      // ✅ Step 2: Intercept Expired Token based on the smarter check above
      if (isJwtExpired && !isRetry && !endpoint.includes('/refresh')) {
        console.log("🔄 JWT Expired strictly detected. Attempting automatic token refresh...");
        try {
          const { authService } = require('./authService');
          const newToken = await authService.refreshAccessToken();
          
          if (newToken) {
            console.log("✅ Token refreshed successfully! Retrying original request...");
            this.setAuthToken(newToken);
            
            const retryConfig = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`
              }
            };
            return await this.request(endpoint, retryConfig, true);
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError.message);
          throw new Error('Session expired. Please log in again.');
        }
      }

      // ✅ Step 3: Handle all other standard API errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (errorData) {
          if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
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