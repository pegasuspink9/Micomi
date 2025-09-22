import React from 'react';
import { Pressable, Text, StyleSheet, Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameButton = ({ 
  onPress, 
  disabled = false, 
  title, 
  position = 'right', 
  variant = 'primary' 
}) => {
  
  const getButtonStyles = (variant) => {
    const variants = {
      primary: {
        backgroundColor: '#34c759',
        borderTopColor: '#5ac777',
        borderLeftColor: '#30d158',
        borderBottomColor: '#248a3d',
        borderRightColor: '#1f7a37',
        frameColor: '#1f7a37', // Darker green for frame
        innerColor: '#48d66a', // Lighter green for inner
        pressedColor: '#2ea043', // Darker when pressed
      },
      secondary: {
        backgroundColor: '#af52de',
        borderTopColor: '#bf65ef',
        borderLeftColor: '#c969f0',
        borderBottomColor: '#8e44ad',
        borderRightColor: '#7d3c98',
        frameColor: '#7d3c98', // Darker purple for frame
        innerColor: '#c969f0', // Lighter purple for inner
        pressedColor: '#9d47cc', // Darker when pressed
      },
      danger: {
        backgroundColor: '#ff3b30',
        borderTopColor: '#ff6b5a',
        borderLeftColor: '#ff5545',
        borderBottomColor: '#d70015',
        borderRightColor: '#c20010',
        frameColor: '#c20010', // Darker red for frame
        innerColor: '#ff5545', // Lighter red for inner
        pressedColor: '#e6001a', // Darker when pressed
      },
      info: {
        backgroundColor: '#007aff',
        borderTopColor: '#339dff',
        borderLeftColor: '#1a8cff',
        borderBottomColor: '#0056cc',
        borderRightColor: '#004bb3',
        frameColor: '#004bb3', // Darker blue for frame
        innerColor: '#1a8cff', // Lighter blue for inner
        pressedColor: '#005fcc', // Darker when pressed
      }
    };
    
    return variants[variant] || variants.primary;
  };
  
  const buttonVariant = getButtonStyles(variant);
  
  return (
    <View style={[
      styles.buttonFrame,
      position === 'left' ? styles.leftPosition : styles.rightPosition,
      { backgroundColor: buttonVariant.frameColor }
    ]}>
      <Pressable 
        style={({ pressed }) => [
          styles.buttonContainer,
          {
            backgroundColor: buttonVariant.backgroundColor,
            borderTopColor: buttonVariant.borderTopColor,
            borderLeftColor: buttonVariant.borderLeftColor,
            borderBottomColor: buttonVariant.borderBottomColor,
            borderRightColor: buttonVariant.borderRightColor,
          },
          pressed && !disabled && [
            styles.buttonPressed,
            { backgroundColor: buttonVariant.pressedColor }
          ],
          disabled && styles.buttonDisabled
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={[
          styles.innerButton,
          { backgroundColor: buttonVariant.innerColor },
          disabled && { backgroundColor: '#b0b0b0' }
        ]}>
          <View style={styles.buttonHighlight} />
          <View style={styles.buttonShadow} />
          <Text style={[
            styles.buttonText,
            disabled && styles.buttonTextDisabled
          ]}>
            {title}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonFrame: {
    borderRadius: SCREEN_WIDTH * 0.025,
    position: 'absolute',
    bottom: SCREEN_WIDTH * 0.018,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  leftPosition: {
    left: SCREEN_WIDTH * 0.02,
    alignSelf: 'flex-start',
  },

  rightPosition: {
    right: SCREEN_WIDTH * 0.02,
    alignSelf: 'flex-end',
  },

  buttonContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    width: SCREEN_WIDTH * 0.2,
    position: 'relative',
    overflow: 'hidden',
    
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },

  innerButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SCREEN_WIDTH * 0.015,
    paddingVertical: SCREEN_WIDTH * 0.009,
    paddingHorizontal: SCREEN_WIDTH * 0.015,
    
    // Inner button borders for extra depth (same as AnswerOption)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },

  buttonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: SCREEN_WIDTH * 0.015,
    borderTopRightRadius: SCREEN_WIDTH * 0.015,
    pointerEvents: 'none',
  },

  buttonShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.015,
    borderBottomRightRadius: SCREEN_WIDTH * 0.015,
    pointerEvents: 'none',
  },

  buttonPressed: {
    transform: [{ translateY: 1 }],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    // Pressed state - invert the 3D effect (same as AnswerOption)
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  buttonDisabled: {
    opacity: 0.4,
    backgroundColor: '#8e8e93',
    borderTopColor: '#aeaeb2',
    borderLeftColor: '#aeaeb2',
    borderBottomColor: '#636366',
    borderRightColor: '#636366',
  },

  buttonText: {
    fontSize: SCREEN_WIDTH * 0.031,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },

  buttonTextDisabled: {
    color: '#f2f2f7',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default GameButton;