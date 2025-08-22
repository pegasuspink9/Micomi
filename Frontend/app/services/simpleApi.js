
const BACKEND_URLS = [
  'http://192.168.254.120:3000', // Your computer's IP address
  'http://localhost:3000',        // For web/simulator
  'http://127.0.0.1:3000',       // Alternative localhost
  'http://10.0.2.2:3000',        // Android emulator
];

export const simpleApiService = {
  async testConnection(url) {
    try {
      console.log(`🧪 Testing connection to: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${url}/api/maps`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Connection successful to: ${url}`);
        return url;
      } else {
        console.log(`❌ Connection failed to: ${url} (HTTP ${response.status})`);
        return null;
      }
    } catch (error) {
      console.log(`❌ Connection error to: ${url} - ${error.message}`);
      return null;
    }
  },

  async findWorkingBackend() {
    console.log('🔍 Searching for working backend...');
    
    for (const url of BACKEND_URLS) {
      const workingUrl = await this.testConnection(url);
      if (workingUrl) {
        return workingUrl;
      }
    }
    
    console.log('❌ No working backend found!');
    return null;
  },

  async getMaps() {
    try {
      console.log('🌐 Starting to fetch maps...');
      
      // Find a working backend URL
      const workingUrl = await this.findWorkingBackend();
      
      if (!workingUrl) {
        throw new Error('Backend server is not accessible. Make sure it\'s running on port 3000.');
      }
      
      console.log(`📡 Fetching maps from: ${workingUrl}/api/maps`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${workingUrl}/api/maps`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Maps data received:', data);

      if (data.success && data.data) {
        console.log(`🎉 Successfully fetched ${data.data.length} maps`);
        return data.data;
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout - Backend took too long to respond');
        throw new Error('Request timeout - Backend server is slow or unresponsive');
      } else {
        console.error('❌ Error fetching maps:', error.message);
        throw error;
      }
    }
  }
};
