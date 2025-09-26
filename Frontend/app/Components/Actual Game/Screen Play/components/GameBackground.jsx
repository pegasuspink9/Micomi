import React from 'react';
import { ImageBackground, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GameBackground = ({ children, isPaused }) => {
  return (
    <ImageBackground 
      source={{ uri: 'https://github.com/user-attachments/assets/e8d6fed7-4356-49f6-af2d-715cf325df59' }}
      style={[styles.firstGrid, isPaused && styles.pausedBackground]}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  firstGrid: {
    minHeight: SCREEN_HEIGHT * 0.32,
    backgroundColor: '#ff6b6b',
  },
  
  pausedBackground: {
    backgroundColor: '#d4544d',
  },
});

export default GameBackground;