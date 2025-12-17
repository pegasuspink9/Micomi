import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect } from '@react-navigation/native';

export const useImmersiveMode = (enabled = true) => {
  useFocusEffect(
    React.useCallback(() => {
      if (!enabled) return;

      const setupImmersiveMode = async () => {
        try {
          if (Platform.OS === 'android') {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
            await NavigationBar.setBackgroundColorAsync('#00000000');
          }
        } catch (error) {
          console.log('Immersive mode setup failed:', error);
        }
      };

      setupImmersiveMode();
      const interval = setInterval(setupImmersiveMode, 500);

      return () => {
        clearInterval(interval);
      };
    }, [enabled])
  );
};