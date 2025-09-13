import React from 'react';
import { Pressable, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RunButton = ({ onPress, disabled = false }) => {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.runButtonContainer,
        pressed && styles.runButtonPressed,
        disabled && styles.runButtonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.runButton,
        disabled && styles.runButtonTextDisabled
      ]}>
        Run
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  runButtonContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.010,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    width: SCREEN_WIDTH * 0.3,
    alignSelf: 'flex-end',
    
    // Special run button styling
    backgroundColor: '#34c759',
    
    // Position
    position: 'absolute',
    bottom: SCREEN_WIDTH * 0.02,
    right: SCREEN_WIDTH * 0.02,
    
    // 3D effect
    borderTopWidth: 2,
    borderTopColor: '#5ac777',
    borderLeftWidth: 2,
    borderLeftColor: '#30d158',
    borderBottomWidth: 4,
    borderBottomColor: '#248a3d',
    borderRightWidth: 3,
    borderRightColor: '#1f7a37',
    
    // Button shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },

  runButtonPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.2,
  },

  runButtonDisabled: {
    backgroundColor: '#8e8e93',
    borderTopColor: '#aeaeb2',
    borderLeftColor: '#aeaeb2',
    borderBottomColor: '#636366',
    borderRightColor: '#636366',
  },

  runButton: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  runButtonTextDisabled: {
    color: '#f2f2f7',
    textShadowColor: 'transparent',
  },
});

export default RunButton;