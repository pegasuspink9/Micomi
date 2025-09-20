import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoadingScreen({ progress = 0, theme }) {
  return (
    <View style={[styles.container, { backgroundColor: theme?.colors?.container || '#000' }]}>
      
      {/* Loading Animation */}
      <LottieView
        source={{ uri: 'https://lottie.host/loading-animation.json' }}
        autoPlay
        loop
        style={styles.loadingAnimation}
        resizeMode="contain"
      />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress)}%
        </Text>
      </View>
      
      <Text style={styles.loadingText}>Loading Map Assets...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.3,
    marginBottom: 30,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarBackground: {
    width: screenWidth * 0.6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Computerfont',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Computerfont',
    textAlign: 'center',
  },
});