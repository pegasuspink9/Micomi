import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SpriteActivityIndicator from './Components/Actual Game/Loading/SpriteActivityIndicator';
import { gameScale } from './Components/Responsiveness/gameResponsive';

export default function RedirectRoute() {
  const router = useRouter();

  useEffect(() => {
    // Redirect instantly to the root index page
    // The RootLayout in _layout.jsx will automatically inspect the authentication state
    // and route the user to /map if login succeeded, or keep them on the login page if not.
    const timer = setTimeout(() => {
      router.replace('/');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SpriteActivityIndicator size={gameScale(80)} />
        <Text style={styles.loadingText}>Connecting to Micomi...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101035', // Match the rich background dark theme of Micomi
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontFamily: 'DynaPuff',
    fontSize: gameScale(18),
    color: '#98d4de', // Match the custom theme color palette
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
