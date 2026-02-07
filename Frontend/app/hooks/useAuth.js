import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

// Shared state outside the hook to sync all components
let globalUser = null;
let globalLoading = true;
let listeners = new Set();

const updateGlobalState = (user, loading) => {
  globalUser = user;
  globalLoading = loading;
  listeners.forEach((listener) => listener({ user, loading }));
};

export const useAuth = () => {
  const [user, setUser] = useState(globalUser);
  const [loading, setLoading] = useState(globalLoading);
  const router = useRouter();

  useEffect(() => {
    // Add this component to listeners
    const listener = (data) => {
      setUser(data.user);
      setLoading(data.loading);
    };
    listeners.add(listener);

    // Initial load if not already done
    if (globalLoading && listeners.size === 1) {
      initAuth();
    }

    return () => listeners.delete(listener);
  }, []);

  const initAuth = async () => {
    try {
      const userData = await authService.loadUser();
      updateGlobalState(userData, false);
    } catch (error) {
      console.error('Failed to load user', error);
      updateGlobalState(null, false);
    }
  };

  const login = async (email, password) => {
    updateGlobalState(globalUser, true);
    try {
      const userData = await authService.login(email, password);
      updateGlobalState(userData, false);
      Alert.alert('Success', `Welcome back, ${userData.player_name}!`);
    } catch (error) {
      updateGlobalState(null, false);
      Alert.alert('Login Failed', error.message);
    }
  };

    const logout = async () => {
    try {
      await authService.logout();
      updateGlobalState(null, false);
      router.replace('/'); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // ... (keep signup, loginWithGoogle, loginWithFacebook with the same updateGlobalState pattern)
  const signup = async (userData) => {
    updateGlobalState(globalUser, true);
    try {
      const result = await authService.signup(userData);
      Alert.alert('Success', 'Player created successfully! Please log in.');
      router.back();
      return result;
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
      throw error;
    } finally {
      updateGlobalState(globalUser, false);
    }
  };

  const loginWithGoogle = async (idToken) => {
    updateGlobalState(globalUser, true);
    try {
      const userData = await authService.googleLogin(idToken);
      updateGlobalState(userData, false);
      Alert.alert('Success', `Welcome, ${userData.player_name}!`);
    } catch (error) {
      updateGlobalState(null, false);
      Alert.alert('Google Login Failed', error.message);
    }
  };

  const loginWithFacebook = async (accessToken) => {
    updateGlobalState(globalUser, true);
    try {
      const userData = await authService.facebookLogin(accessToken);
      updateGlobalState(userData, false);
      Alert.alert('Success', `Welcome, ${userData.player_name}!`);
    } catch (error) {
      updateGlobalState(null, false);
      Alert.alert('Facebook Login Failed', error.message);
    }
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