import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


const GameContainer = ({ children, borderColor }) => {
  return (
    <View style={styles.outerFrame}>
      <View style={styles.container}>
        <View style={[styles.innerBorderContainer, { borderColor }]}>
          <View style={styles.contentContainer}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // ✅ FIXED: Using gameScale for consistent border radius
    borderRadius: gameScale(43),
  },
  container: {
    flex: 1,
    backgroundColor: '#052a53ff',
    // ✅ FIXED: Using gameScale
    borderRadius: gameScale(18),
    padding: gameScale(8),
    borderTopWidth: gameScale(3),
    borderTopColor: '#1a5a7aff',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#2a6a8aff',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#2a6a8aff',
    borderRightWidth: gameScale(3),
    borderRightColor: '#2a6a8aff',
  },
  innerBorderContainer: {
    flex: 1,
    borderWidth: gameScale(6),
    overflow: 'hidden',
    // ✅ FIXED: Using gameScale
    borderRadius: gameScale(31),
    position: 'relative',
    backgroundColor: '#ffffff',
    borderTopWidth: gameScale(6),
    borderTopColor: '#f0f8ffff', 
    borderLeftWidth: gameScale(6),
    borderLeftColor: '#e0f0ffff',
    borderBottomWidth: gameScale(6),
    borderBottomColor: '#1a4a6aff',
    borderRightWidth: gameScale(6),
    borderRightColor: '#0a4166ff',
  },
  contentContainer: {
    flex: 1,
    borderWidth: gameScale(2),
    borderColor: '#8ab4d5ff',
    // ✅ FIXED: Using gameScale
    borderRadius: gameScale(23),
    overflow: 'hidden',
    backgroundColor: '#f5f9fcff',
    borderTopWidth: gameScale(3),
    borderTopColor: '#e8f4ffff',
    borderLeftWidth: gameScale(3),
    borderLeftColor: '#d0e8f8ff',
    borderBottomWidth: gameScale(3),
    borderBottomColor: '#3a6a8aff',
    borderRightWidth: gameScale(3),
    borderRightColor: '#4a7a9aff',
  },
});


export default GameContainer;