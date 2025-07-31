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
    colors: ['#2d5a27', '#28f82f45'],
    locations: [0.15, 0.9]
  },
  'CSS': {
    colors: ['#8b0000', '#ff003c41'], 
    locations: [0.15, 0.9]
  },
  'JavaScript': {
    colors: ['#1e3a8a', '#3b83f64a'],
    locations: [0.15, 0.9]
  },
  'Computer': {
    colors: ['#c13d00ff', '#d43b084a'],
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
      // Change gradient
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
      <LinearGradient
        colors={currentGradient.colors}
        locations={currentGradient.locations}
        start={[0, 0]}
        end={[0, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <MapHeader />

        {/* Map Navigation */}
         <LottieView
                    source={{ uri: 'https://lottie.host/6dc90492-37c5-4169-9db7-4a6f79ad0bf9/pR3Q6bxLZq.lottie' }}
                    style={styles.clouds}
                    resizeMode="cover"
                    autoPlay
                    loop
                    speed={0.8}
          />
        <MapNavigate onMapChange={handleGradientChange} />

        {/* Footer*/}
         <LottieView
            source={{ uri: 'https://lottie.host/7a86b8d3-7b6b-4841-994d-3a12acb80eb1/1UKTK3rnbF.lottie' }}
            style={styles.lowerHills}
            resizeMode="contain"
            autoPlay
            loop
            speed={2}
          />

      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  gradient: {
    flex: 1
  },
  clouds: {
    position: 'absolute',
    top: 55,
    left: 0,
    width: '100%',
    height: '100%'
  },
  lowerHills: {
    position: 'absolute',
    bottom: -50,                        // Bottom edge
    left: 0,                          // Left edge
    right: 0,                         // Right edge (ensures full width)
    width: '100%',                    // Full screen width
    height: Math.max(screenHeight * 0.50, 300), // Responsive height with minimum
    zIndex: -1, 
  }
});