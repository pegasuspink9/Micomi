// Try different possible backend U
const POSSIBLE_BACKEND_URLS = [
  'http://192.168.100.200:3000'
];

class ApiService {
  constructor() {
    this.baseURL = POSSIBLE_BACKEND_URLS[0];
    this.isBackendAvailable = false;
  }

  // Test backend connectivity
  async testConnection() {
    for (const url of POSSIBLE_BACKEND_URLS) {
      try {
        console.log(`Testing connection to: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}/map`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.baseURL = url;
          this.isBackendAvailable = true;
          console.log(`✅ Connected to backend at: ${url}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Failed to connect to: ${url}`, error.message);
      }
    }
    
    this.isBackendAvailable = false;
    console.log('❌ No backend server found');
    return false;
  }

  async request(endpoint, options = {}) {
    if (!this.isBackendAvailable) {
      await this.testConnection();
    }

    if (!this.isBackendAvailable) {
      throw new Error('Backend server is not available');
    }

    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API response for ${endpoint}:`, data);
      this.isBackendAvailable = true;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API request failed for ${endpoint}:`, error);
      
      if (error.message.includes('Network request failed') || error.message.includes('fetch') || error.name === 'AbortError') {
        this.isBackendAvailable = false;
      }
      
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