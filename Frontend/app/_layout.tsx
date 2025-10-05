import React, { useEffect } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useFonts } from '../assets/fonts/font';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar'; 
import * as SystemUI from 'expo-system-ui'; 

export default function RootLayout() {
  const fontsLoaded = useFonts();

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

    const interval = setInterval(setupImmersiveMode, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#034251' 
      }}>
        <ActivityIndicator size="large" color="#fff" />
        <StatusBar hidden={true} />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden={true} />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { flex: 1 }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}