import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from '../assets/fonts/font';
import { View, Text, Platform, AppState, StatusBar as RNStatusBar, Keyboard } from 'react-native'; 
import SpriteActivityIndicator from './Components/Actual Game/Loading/SpriteActivityIndicator';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar'; 
import * as SystemUI from 'expo-system-ui'; 
import { useAuth } from './hooks/useAuth';
import { soundManager } from './Components/Actual Game/Sounds/UniversalSoundManager';
import MainLoadingScreen from './MainLoadingScreen';
import UniversalLoadingOverlay from './Components/UniversalLoading/UniversalLoadingOverlay';
import { Audio } from 'expo-av';

let hasPlayedOpeningSound = false;

// Preload the sound immediately when the JS bundle is loaded 
// to eliminate the delay when the Micomi text displays
let preloadedSoundPromise = Audio.Sound.createAsync(
  require('./Micomi_opening.wav'),
  { shouldPlay: false }
).catch((e) => {
  console.log('Error preloading sound:', e);
  return null;
});

export default function RootLayout() {
  const fontsLoaded = useFonts();
  const { user, loading } = useAuth();
  const [isMainLoading, setIsMainLoading] = useState(true);
  const [openingSoundDone, setOpeningSoundDone] = useState(hasPlayedOpeningSound);
  const segments = useSegments();
  const router = useRouter();
  const appStateRef = useRef(AppState.currentState);
  const isKeyboardVisible = useRef(false); // Track keyboard state

  useEffect(() => {
    if (hasPlayedOpeningSound) {
      setOpeningSoundDone(true);
      return;
    }

    let sound;
    const playOpeningSound = async () => {
      hasPlayedOpeningSound = true;
      try {
        const result = await preloadedSoundPromise;
        if (result && result.sound) {
          sound = result.sound;
          await sound.playAsync();
        } else {
          const { sound: newSound } = await Audio.Sound.createAsync(
            require('./Micomi_opening.wav'),
            { shouldPlay: true }
          );
          sound = newSound;
        }
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setOpeningSoundDone(true);
            sound.unloadAsync();
          }
        });
      } catch (error) {
        console.error("Error playing opening sound", error);
        setOpeningSoundDone(true);
      }
    };
    
    playOpeningSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      isKeyboardVisible.current = true;
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardVisible.current = false;
      forceRehide(); // Restore immersive mode when keyboard closes
    });

    const hideSystemUI = async () => {
      try {
        RNStatusBar.setHidden(true, 'none');
        await NavigationBar.setVisibilityAsync('hidden');
        await SystemUI.setBackgroundColorAsync('transparent');
      } catch (error) {
        console.log('Immersive mode setup failed:', error);
      }
    };

    // THE FIX: Force Android to redraw the status bar by toggling it
    const forceRehide = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        
        // Briefly set to false, then true to force the OS to update
        RNStatusBar.setHidden(false, 'none');
        setTimeout(() => {
          RNStatusBar.setHidden(true, 'none');
        }, 50);
      } catch (error) {
        console.log('Force rehide failed:', error);
      }
    };

    // Initial run
    hideSystemUI();

    // LINK STATUS BAR TO BOTTOM BAR:
    const navBarListener = NavigationBar.addVisibilityListener(({ visibility }) => {
      // Only force rehide if the keyboard is NOT visible
      if (visibility === 'visible' && !isKeyboardVisible.current) {
        forceRehide();
        setTimeout(forceRehide, 200); // Fallback delay
      }
    });

    // Handle returning to the app from the background
    const appStateListener = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (!isKeyboardVisible.current) {
          forceRehide();
          setTimeout(forceRehide, 200);
          setTimeout(forceRehide, 600);
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      navBarListener.remove();
      appStateListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []); 

  // Handle authentication routing
  useEffect(() => {
    if (!fontsLoaded || loading || isMainLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isAtLoginPage = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!user && inAuthGroup) {
      router.replace('/');
    } else if (user && isAtLoginPage) {
      router.replace('/map');
    }

    // --- UNIVERSAL BGM LOGIC ---
    const NAV_BGM_URL = 'https://micomi-assets.me/Sounds/Final/Navigation.mp3';
    
    // Check if current screen is a navigation/UI page
    const isNavigationPage = 
      segments.includes('map') 
    if (isNavigationPage && user) {
      soundManager.playBackgroundMusic(NAV_BGM_URL, 0.15);
    } else if (isAtLoginPage) {
      soundManager.stopBackgroundMusic();
    }
  }, [user, segments, fontsLoaded, loading, isMainLoading]);

  // Page detection for the Universal Tap (outside useEffect for use in JSX)
   const isNavPage = 
    segments.includes('roadMapLandPage') ||
    segments.includes('(tabs)') ||

    segments.includes('map')


  
    if (!fontsLoaded || (loading && !user) || !openingSoundDone) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#98d4de' 
      }}>
        <ExpoStatusBar hidden={true} />
        <Text style={{ fontFamily: 'Grobold', fontSize: 60, color: '#ffffff' }}>Micomi</Text>
      </View>
    );
  }

  // Only show the preloading screen if the user is logged in
  if (user && isMainLoading) {
    return (
      <MainLoadingScreen 
        fontsLoaded={fontsLoaded} 
        onComplete={() => setIsMainLoading(false)} 
      />
    );
  }

  return (
     <View 
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        // Only trigger universal tap on navigation pages
        if (isNavPage && user) {
          soundManager.playUniversalTap();
        }
        return false; // Do not block children from receiving the touch
      }}
    >
      {/* Declarative component ensures React Native enforces the hidden state */}
      <ExpoStatusBar hidden={true} />
      
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { flex: 1 }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <UniversalLoadingOverlay />
    </View>
  );
}