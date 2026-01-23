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
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.signup(userData);
      Alert.alert('Success', 'Player created successfully! Please log in.');
      router.back(); // Return to Login screen
      return result;
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

   const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const userData = await authService.googleLogin(idToken);
      setUser(userData);
      Alert.alert('Success', `Welcome, ${userData.player_name}!`);
    } catch (error) {
      Alert.alert('Google Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (accessToken) => {
    setLoading(true);
    try {
      const userData = await authService.facebookLogin(accessToken);
      setUser(userData);
      Alert.alert('Success', `Welcome, ${userData.player_name}!`);
    } catch (error) {
      Alert.alert('Facebook Login Failed', error.message);
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
    refresh: authService.refreshAccessToken,
    signup,
    loginWithGoogle,
    loginWithFacebook,
  };
};