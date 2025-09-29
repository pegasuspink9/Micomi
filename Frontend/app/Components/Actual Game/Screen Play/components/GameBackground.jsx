import React from 'react';
import { ImageBackground, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GameBackground = ({ children, isPaused }) => {
  return (
    <ImageBackground 
      source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758944674/493200252-e8d6fed7-4356-49f6-af2d-715cf325df59_tron6z.png' }}
      style={[styles.firstGrid, isPaused && styles.pausedBackground]}
      resizeMode="fill"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  firstGrid: {
    minHeight: SCREEN_HEIGHT * 0.334,
    backgroundColor: '#ff6b6b',
  },
  
  pausedBackground: {
    backgroundColor: '#d4544d',
  },
});

export default GameBackground;