import React, {useState} from 'react';
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

const GRADIENT_THEMES = {
   'HTML': {
    colors: ['#36962973', '#09ff000a'],
    locations: [0.15, 0.9]
  },
  'CSS': {
    colors: ['#810c0c59', '#00000041'], 
    locations: [0.15, 0.9]
  },
  'JavaScript': {
    colors: ['#1740c659', '#00000041'],
    locations: [0.15, 0.9]
  },
  'Computer': {
    colors: ['#c13d0059', '#d43b084a'],
    locations: [0.15, 0.9]
  }
}

export default function MapLandingPage() {

  //Select the level to be displayed
  const fadeAnim = useState(new Animated.Value(1))[0];

  const [currentGradient, setCurrentGradient] = useState(GRADIENT_THEMES['HTML']);

  const handleGradientChange = (mapName) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0.8,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      const newGradient = GRADIENT_THEMES[mapName] || GRADIENT_THEMES['HTML'];
      setCurrentGradient(newGradient);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {/* ✅ Background Image Layer */}
      <ImageBackground
        source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759495800/Gemini_Generated_Image_ugmdzwugmdzwugmd_krfzr6.png' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* ✅ Gradient Overlay */}
        <LinearGradient
          colors={currentGradient.colors}
          locations={currentGradient.locations}
          start={[0, 0]}
          end={[0, 1]}
          style={styles.gradient}
        >
          {/* ✅ Lower Hills - Move to back layer */}
          <LottieView
            source={{ uri: 'https://lottie.host/7a86b8d3-7b6b-4841-994d-3a12acb80eb1/1UKTK3rnbF.lottie' }}
            style={styles.lowerHills}
            resizeMode="contain"
            autoPlay
            loop
            speed={2}
            pointerEvents="none"
          />

          {/* ✅ Clouds - Behind content */}
          <LottieView
            source={{ uri: 'https://lottie.host/6dc90492-37c5-4169-9db7-4a6f79ad0bf9/pR3Q6bxLZq.lottie' }}
            style={styles.clouds}
            resizeMode="cover"
            autoPlay
            loop
            speed={0.8}
            pointerEvents="none"
          />

          {/* Header - Higher z-index */}
          <View style={styles.headerContainer}>
            <MapHeader />
          </View>

          {/* Map Navigation - Highest z-index for touch events */}
          <View style={styles.navigationContainer}>
            <MapNavigate onMapChange={handleGradientChange} />
          </View>

        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    position: 'relative', 
  },
  
  // ✅ Background animations (lowest z-index)
  lowerHills: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    width: '100%',
    height: Math.max(screenHeight * 0.50, 300), 
    opacity: 0.9,
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
    zIndex: 20, // ✅ Highest z-index for touch events
  },
});