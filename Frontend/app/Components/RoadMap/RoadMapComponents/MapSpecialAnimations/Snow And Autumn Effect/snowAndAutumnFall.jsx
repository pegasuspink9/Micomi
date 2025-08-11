import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function SnowAndAutumnAnimations({ mapName }) {
  const getLottieSource = () =>{
    switch (mapName) {
      case 'JavaScript':
        return 'https://lottie.host/122d9181-218a-488c-9ffc-7f91ddd5173f/dC02WDwpdO.lottie';
      case 'Computer':
        return 'https://lottie.host/23216b11-f55d-4330-b232-68c22c6cdaf6/ld4n2qWCHE.lottie';
      default:
        return null;
    }
  }

  const lottieSource = getLottieSource();

  if (!lottieSource) {
    return null; 
  }

  return (
    <View style={styles.fixedSnowEffects}>
      <LottieView
        source={{ uri: lottieSource }}
        autoPlay
        loop
        resizeMode='cover'
        cacheComposition={true}
        renderMode='HARDWARE'
        style={styles.fixedSnowLottieStyle}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fixedSnowEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20, 
    pointerEvents: 'none', 
  },
  fixedSnowLottieStyle: {
    width: '100%',
    height: '100%',
    zIndex: 100,
    opacity: 0.6,
  },
});