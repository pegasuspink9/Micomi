import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { simpleApiService } from '../../services/simpleApi';

export const ConnectionTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [isConnected, setIsConnected] = useState(false);

  const testConnection = async () => {
    try {
      setStatus('🔍 Searching for backend...');
      setIsConnected(false);
      
      const workingUrl = await simpleApiService.findWorkingBackend();
      
      if (workingUrl) {
        setStatus(`✅ Connected to: ${workingUrl}`);
        setIsConnected(true);
      } else {
        setStatus('❌ No backend found. Make sure to run: npm run dev');
        setIsConnected(false);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setIsConnected(false);
    }
  };

  const testMapsAPI = async () => {
    try {
      setStatus('📡 Testing maps API...');
      const maps = await simpleApiService.getMaps();
      setStatus(`✅ Successfully fetched ${maps.length} maps!`);
      setIsConnected(true);
    } catch (error) {
      setStatus(`❌ Maps API failed: ${error.message}`);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>
      <Text style={[styles.status, isConnected ? styles.success : styles.error]}>
        {status}
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testMapsAPI}>
        <Text style={styles.buttonText}>Test Maps API</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    margin: 20,
    borderRadius: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#ff6b6b',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
