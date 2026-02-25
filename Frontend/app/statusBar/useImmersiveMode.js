import React from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect } from '@react-navigation/native';

export const useImmersiveMode = (enabled = true) => {
  useFocusEffect(
    React.useCallback(() => {
      if (!enabled || Platform.OS !== 'android') return;

      const setupImmersiveMode = async () => {
        try {
          RNStatusBar.setHidden(true, 'none');
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBackgroundColorAsync('#00000000');
        } catch (error) {
          console.log('Immersive mode setup failed:', error);
        }
      };

      // THE FIX: Force Android to redraw the status bar by toggling it
      const forceRehide = async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          
          RNStatusBar.setHidden(false, 'none');
          setTimeout(() => {
            RNStatusBar.setHidden(true, 'none');
          }, 50);
        } catch (error) {
          console.log('Force rehide failed:', error);
        }
      };

      // Initial hide when screen comes into focus
      setupImmersiveMode();

      // LINK STATUS BAR TO BOTTOM BAR:
      const navBarListener = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === 'visible') {
          forceRehide();
          setTimeout(forceRehide, 200); // Fallback delay
        }
      });

      return () => {
        // Cleanup listener when screen loses focus
        navBarListener.remove();
      };
    }, [enabled])
  );
};