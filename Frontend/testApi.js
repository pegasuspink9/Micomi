// Test file to verify API connection
// Run this in your React Native app or create a test component

import { apiService } from './app/services/api';

export const testApiConnection = async () => {
  console.log('🧪 Starting API connection test...');
  
  // Test backend connectivity first
  const isConnected = await apiService.testConnection();
  
  if (!isConnected) {
    console.log('❌ Backend server is not running!');
    console.log('💡 Make sure to run: cd BackEnd && npm run dev');
    return null;
  }
  
  try {
    console.log('🧪 Testing maps endpoint...');
    
    // Test basic connectivity
    const response = await apiService.get('/api/maps');
    
    console.log('✅ API Response:', response);
    
    if (response.success && response.data) {
      console.log('✅ Successfully fetched', response.data.length, 'maps');
      console.log('📊 Maps data:', response.data);
      return response.data;
    } else {
      console.log('❌ API returned unsuccessful response:', response);
      return null;
    }
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    return null;
  }
};

// Quick backend status check
export const checkBackendStatus = async () => {
  const urls = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  
  console.log('🔍 Checking backend status...');
  
  for (const url of urls) {
    try {
      const response = await fetch(`${url}/api/maps`, {
        method: 'GET',
        timeout: 3000,
      });
      
      if (response.ok) {
        console.log(`✅ Backend is running at: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`❌ No backend at: ${url}`);
    }
  }
  
  console.log('💡 Start your backend with: npm run dev');
  return null;
};

// Usage example in a component:
/*
import { testApiConnection, checkBackendStatus } from './testApi';

const TestComponent = () => {
  useEffect(() => {
    checkBackendStatus().then(() => {
      testApiConnection();
    });
  }, []);

  return <Text>Check console for API test results</Text>;
};
*/
