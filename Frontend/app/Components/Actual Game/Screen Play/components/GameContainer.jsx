import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameContainer = ({ children, borderColor }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.innerBorderContainer, { borderColor }]}>
        <View style={styles.contentContainer}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    borderWidth: 8,
    borderColor: '#1a1a1a',
    borderRadius: SCREEN_WIDTH * 0.1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 25,

    borderTopWidth: 8,
    borderTopColor: '#5a5a5a',
    borderLeftWidth: 8,
    borderLeftColor: '#4a4a4a',
    borderBottomWidth: 8,
    borderBottomColor: '#0a0a0a',
    borderRightWidth: 8,
    borderRightColor: '#0f0f0f',
  },

  innerBorderContainer: {
    borderWidth: 6,
    overflow: 'hidden',
    borderRadius: SCREEN_WIDTH * 0.08,

    borderTopWidth: 6,
    borderTopColor: '#6a6a6a', 
    borderLeftWidth: 6,
    borderLeftColor: '#5a5a5a',
    borderBottomWidth: 6,
    borderBottomColor: '#0a0a0a',
    borderRightWidth: 6,
    borderRightColor: '#151515', 

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8, 
    shadowRadius: 12, 
    elevation: 18,
  },

  contentContainer: {
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: SCREEN_WIDTH * 0.06,
    overflow: 'hidden',
    backgroundColor: 'black'
  },
});

export default GameContainer;