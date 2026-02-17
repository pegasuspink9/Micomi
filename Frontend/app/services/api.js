import AsyncStorage from '@react-native-async-storage/async-storage';

// Try different possible backend URLs (local IP, Android Emulator IP, and localhost)
const POSSIBLE_BACKEND_URLS = [
  'http://192.168.254.110:3000', 
  'http://10.0.2.2:3000',      
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
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        try {
          errorData = await response.json();
          // Prioritize the detailed 'error' field if the 'message' is generic
          if (errorData) {
            if (errorData.error && typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          }
        } catch (jsonError) {
          // If response is not JSON, or parsing fails, use the default HTTP error message
          console.warn(`Could not parse error response from ${url} as JSON (status ${response.status}):`, jsonError);
        }
        
        // Log a more specific warning for 401, using the extracted message if available
        if (response.status === 401) {
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