import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { scale, RESPONSIVE } from '../../../Responsiveness/gameResponsive';

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
    borderRadius: SCREEN_WIDTH * 0.11,
  },

  container: {
    flex: 1,
    backgroundColor: '#052a53ff',
    borderRadius: SCREEN_WIDTH * 0.045,
    padding: RESPONSIVE.margin.sm,
    borderTopWidth: scale(3),
    borderTopColor: '#1a5a7aff',
    borderLeftWidth: scale(2),
    borderLeftColor: '#2a6a8aff',
    borderBottomWidth: scale(4),
    borderBottomColor: '#2a6a8aff',
    borderRightWidth: scale(3),
    borderRightColor: '#2a6a8aff',
  },

  innerBorderContainer: {
    flex: 1,
    borderWidth: scale(6),
    overflow: 'hidden',
    borderRadius: SCREEN_WIDTH * 0.08,
    position: 'relative',
    backgroundColor: '#ffffff',
    borderTopWidth: scale(6),
    borderTopColor: '#f0f8ffff', 
    borderLeftWidth: scale(6),
    borderLeftColor: '#e0f0ffff',
    borderBottomWidth: scale(6),
    borderBottomColor: '#1a4a6aff',
    borderRightWidth: scale(6),
    borderRightColor: '#0a4166ff',
  },

  contentContainer: {
    flex: 1,
    borderWidth: scale(2),
    borderColor: '#8ab4d5ff',
    borderRadius: SCREEN_WIDTH * 0.06,
    overflow: 'hidden',
    backgroundColor: '#f5f9fcff',
    borderTopWidth: scale(3),
    borderTopColor: '#e8f4ffff',
    borderLeftWidth: scale(3),
    borderLeftColor: '#d0e8f8ff',
    borderBottomWidth: scale(3),
    borderBottomColor: '#3a6a8aff',
    borderRightWidth: scale(3),
    borderRightColor: '#4a7a9aff',
  },
});

export default GameContainer;