import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GridContainer = ({ children }) => {
  return (
    <View style={styles.thirdGrid}>
      <View style={styles.innerContent}>
        <View style={styles.innerBorder}>
          <View style={styles.backlightOverlay} />
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  thirdGrid: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.02,
    backgroundColor: 'transparent',
  },

  innerContent: {
    flex: 1,
    backgroundColor: '#2c2c2e', 
    borderRadius: SCREEN_WIDTH * 0.04,
    padding: SCREEN_WIDTH * 0.03,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    borderTopWidth: 2,
    borderTopColor: '#4a4a4c',
    borderBottomWidth: 4,
    borderBottomColor: '#1c1c1e',
    borderLeftWidth: 2,
    borderLeftColor: '#3a3a3c',
    borderRightWidth: 3,
    borderRightColor: '#1c1c1e',
  },

  innerBorder: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: SCREEN_WIDTH * 0.025,
    borderTopWidth: 1,
    borderTopColor: '#0a0a0a',
    borderLeftWidth: 1,
    borderLeftColor: '#0a0a0a',
    borderBottomWidth: 2,
    borderBottomColor: '#2c2c2e',
    borderRightWidth: 2,
    borderRightColor: '#2c2c2e',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  backlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 127, 255, 0.07)',
    borderRadius: SCREEN_WIDTH * 0.025,
    pointerEvents: 'none',
  },
});

export default GridContainer;