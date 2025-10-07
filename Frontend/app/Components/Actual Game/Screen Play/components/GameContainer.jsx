import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameContainer = ({ children, borderColor }) => {
  return (
    <View style={styles.outerFrame}>
      <View style={styles.container}>
        <View style={[styles.innerBorderContainer, { borderColor }]}>
          <View style={styles.contentContainer}>
            <View style={styles.containerHighlight} />
            <View style={styles.containerShadow} />
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
  outerFrame: {
    borderRadius: SCREEN_WIDTH * 0.11,
    backgroundColor: '#000000c4', 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
  },


  innerBorderContainer: {
    borderWidth: 6,
    overflow: 'hidden',
    borderRadius: SCREEN_WIDTH * 0.08,
    position: 'relative',

    // Original inner borders preserved
    borderTopWidth: 6,
    borderTopColor: '#052a53ff', 
    borderLeftWidth: 6,
    borderLeftColor: '#052a53ff',
    borderBottomWidth: 6,
    borderBottomColor: '#052a53ff',
    borderRightWidth: 6,
    borderRightColor: '#052a53ff', 

  },

  contentContainer: {
    borderWidth: 2,
    borderColor: '#052953f2',
    borderRadius: SCREEN_WIDTH * 0.06,
    overflow: 'hidden',
    
    borderTopWidth: 3,
    borderTopColor: '#052953f2',
    borderLeftWidth: 3,
    borderLeftColor: '#052a53ff',
    borderBottomWidth: 3,
    borderBottomColor: '#052a53ff',
    borderRightWidth: 3,
    borderRightColor: '#052a53ff',
  },

  containerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_WIDTH * 0.08,
    borderTopLeftRadius: SCREEN_WIDTH * 0.06,
    borderTopRightRadius: SCREEN_WIDTH * 0.06,
    pointerEvents: 'none',
    zIndex: 1,
  },

  containerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_WIDTH * 0.06,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.06,
    borderBottomRightRadius: SCREEN_WIDTH * 0.06,
    pointerEvents: 'none',
    zIndex: 1,
  },

  leftHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.04,
    borderTopLeftRadius: SCREEN_WIDTH * 0.06,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.06,
    pointerEvents: 'none',
    zIndex: 1,
  },

  rightShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.03,
    borderTopRightRadius: SCREEN_WIDTH * 0.06,
    borderBottomRightRadius: SCREEN_WIDTH * 0.06,
    pointerEvents: 'none',
    zIndex: 1,
  },
});

export default GameContainer;