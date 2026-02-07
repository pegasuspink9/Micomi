import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useFonts } from '../assets/fonts/font';
import { View, ActivityIndicator, Platform, AppState } from 'react-native'; // Added AppState
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
      try {
        if (Platform.OS === 'android') {
          await NavigationBar.setVisibilityAsync('hidden');
          await SystemUI.setBackgroundColorAsync('transparent');
        }
      } catch (error) {
        console.log('Navigation bar setup failed:', error);
      }
    };

    setupImmersiveMode();
    const interval = setInterval(setupImmersiveMode, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
        <StatusBar hidden={true} translucent={true} backgroundColor="transparent" />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden={true} translucent={true} backgroundColor="transparent" />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { flex: 1 }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}