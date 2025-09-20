import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GridContainer = ({ children }) => {
  return (
    <View style={styles.thirdGrid}>
      <View style={styles.outerFrame}>
        <View style={styles.innerContent}>
          <View style={styles.innerBorder}>
            <View style={styles.backlightOverlay} />
            <View style={styles.topHighlight} />
            <View style={styles.bottomShadow} />
            <View style={styles.leftHighlight} />
            <View style={styles.rightShadow} />
            {children}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  thirdGrid: {
    height: SCREEN_HEIGHT * 0.25,
    padding: SCREEN_WIDTH * 0.02,
    backgroundColor: 'transparent',
  },

  outerFrame: {
    flex: 1, // This will work within the fixed height container
    backgroundColor: '#052a53ff',
    borderRadius: SCREEN_WIDTH * 0.05,
    padding: SCREEN_WIDTH * 0.004,
    shadowColor: '#052a53ff',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
    // 3D outer border effect
    borderTopWidth: 3,
    borderTopColor: '#87ceeb',
    borderLeftWidth: 2,
    borderLeftColor: '#87ceeb',
    borderBottomWidth: 5,
    borderBottomColor: '#2c5282',
    borderRightWidth: 4,
    borderRightColor: '#2c5282',
  },

  innerContent: {
    flex: 1,
    backgroundColor: '#052a53ff',
    borderRadius: SCREEN_WIDTH * 0.045,
    padding: SCREEN_WIDTH * 0.03,
    shadowColor: '#1a365d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 18,
  },

  innerBorder: {
    flex: 1,
    backgroundColor: '#000000fc',
    borderRadius: SCREEN_WIDTH * 0.03,
    position: 'relative',
    overflow: 'hidden',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  backlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(135, 206, 235, 0.15)', 
    borderRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_WIDTH * 0.08,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderTopRightRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_WIDTH * 0.06,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.03,
    borderBottomRightRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  leftHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.04,
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  rightShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.03,
    borderTopRightRadius: SCREEN_WIDTH * 0.03,
    borderBottomRightRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },
});

export default GridContainer;