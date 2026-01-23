import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load user from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authService.loadUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user', error);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      Alert.alert('Success', `Welcome back, ${userData.player_name}!`);
      // Navigate to game play or home after success
      // router.replace('/GamePlay'); 
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.replace('/'); // Go back to login/intro
  };

  return {
    user,
    loading,
    login,
    logout,
    refresh: authService.refreshAccessToken
  };
};