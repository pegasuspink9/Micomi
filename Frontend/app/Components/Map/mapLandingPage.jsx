import React, { useState, useRef, useEffect } from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  Animated
} from 'react-native';
import MapNavigate from './MapNavigate';
import MapHeader from './mapHeader';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Dimensions } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const BACKGROUND_THEMES = {
  'HTML': require('./Assets/GreenLand Map.png'),
  'CSS': require('./Assets/Fireland MapNavigate.png'),
  'JavaScript': require('./Assets/IceLand Map.png'),
  'Computer': require('./Assets/AutumnLand MapNavigate.png')
};

const BACKGROUND_KEYS = ['HTML', 'CSS', 'JavaScript', 'Computer'];

export default function MapLandingPage() {
  const [currentMapName, setCurrentMapName] = useState('HTML');
  
  const fadeAnims = useRef(
    BACKGROUND_KEYS.reduce((acc, key) => {
      acc[key] = new Animated.Value(key === 'HTML' ? 1 : 0);
      return acc;
    }, {})
  ).current;
   
  const handleGradientChange = (mapName) => {
    if (mapName === currentMapName) return;
    
    const animations = BACKGROUND_KEYS.map((key) => {
      return Animated.timing(fadeAnims[key], {
        toValue: key === mapName ? 1 : 0,
        duration: 300, 
        useNativeDriver: true,
      });
    });
    
    Animated.parallel(animations).start();
    setCurrentMapName(mapName);
  };

  return (
    <View style={styles.container}>
      {BACKGROUND_KEYS.map((mapName) => (
        <Animated.View
          key={mapName}
          style={[
            styles.absoluteBackground,
            { opacity: fadeAnims[mapName] }
          ]}
        >
          <ImageBackground
            source={BACKGROUND_THEMES[mapName]}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>
      ))}

      {/* Content Layer */}
      <View style={styles.contentLayer}>
        {/* Lower Hills */}
        <LottieView
          source={{ uri: 'https://lottie.host/7a86b8d3-7b6b-4841-994d-3a12acb80eb1/1UKTK3rnbF.lottie' }}
          style={styles.lowerHills}
          resizeMode="contain"
          autoPlay
          loop
          speed={2}
          pointerEvents="none"
        />

        {/* Clouds */}
        <LottieView
          source={{ uri: 'https://lottie.host/6dc90492-37c5-4169-9db7-4a6f79ad0bf9/pR3Q6bxLZq.lottie' }}
          style={styles.clouds}
          resizeMode="cover"
          autoPlay
          loop
          speed={0.8}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={styles.headerContainer}>
          <MapHeader />
        </View>

        {/* Map Navigation */}
        <View style={styles.navigationContainer}>
          <MapNavigate onMapChange={handleGradientChange} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  absoluteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentLayer: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    flex: 1,
    position: 'relative', 
  },
  lowerHills: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    width: '100%',
    height: Math.max(screenHeight * 0.50, 300), 
    zIndex: 1,
  },
  clouds: {
    position: 'absolute',
    top: 60,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2, 
  },
  headerContainer: {
    position: 'relative',
    zIndex: 10, 
  },
  navigationContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },
});