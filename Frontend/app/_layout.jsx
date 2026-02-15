import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from '../assets/fonts/font';
import { View, ActivityIndicator, Platform, AppState, StatusBar } from 'react-native'; 
import { setStatusBarHidden, setStatusBarTranslucent, setStatusBarStyle } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar'; 
import * as SystemUI from 'expo-system-ui'; 
import { useAuth } from './hooks/useAuth';

export default function RootLayout() {
  const fontsLoaded = useFonts();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const setupImmersiveMode = async () => {
      if (Platform.OS !== 'android') return;

      try {
        setStatusBarHidden(true, 'none');
        setStatusBarTranslucent(true);
        setStatusBarStyle('light');
        
        StatusBar.setHidden(true, 'none');
        StatusBar.setTranslucent(true);
        
        // Navigation Bar (Bottom Bar) setup
        await NavigationBar.setVisibilityAsync('hidden');
        
        // setBehaviorAsync is deprecated/unsupported when edge-to-edge is enabled
        // We omit it to avoid the warning, as setVisibilityAsync handles the hiding.
        
        // System UI background should be transparent to avoid flashes
        await SystemUI.setBackgroundColorAsync('transparent');
        
        // 🛠️ Extra enforce after a small delay (helps on resume from background)
        setTimeout(() => {
          StatusBar.setHidden(true, 'none');
          setStatusBarHidden(true, 'none');
        }, 100);
        
        setTimeout(() => {
          StatusBar.setHidden(true, 'none');
          setStatusBarHidden(true, 'none');
        }, 500);

      } catch (error) {
        console.log('Immersive mode setup failed:', error);
      }
    };

    // Initial run
    setupImmersiveMode();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setupImmersiveMode();
      }
    });

    const reHideTimer = setInterval(setupImmersiveMode, 1000);

    return () => {
      subscription.remove();
      clearInterval(reHideTimer);
    };
  }, [segments]); // Dependency on segments to re-trigger on navigation

  // Handle authentication routing
  useEffect(() => {
    if (!fontsLoaded || loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isAtLoginPage = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!user && inAuthGroup) {
      router.replace('/');
    } else if (user && isAtLoginPage) {
      router.replace('/map');
    }
  }, [user, segments, fontsLoaded, loading]);

  
  if (!fontsLoaded || loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#034251' 
      }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { flex: 1 }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}