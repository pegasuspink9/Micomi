import React from 'react';
import { Pressable, Text, StyleSheet, Dimensions, View } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const AnswerOption = ({ 
  item, 
  index, 
  isSelected, 
  isDisabled, 
  onPress 
}) => {
  return (
    <View style={styles.buttonFrame}>
      <Pressable 
        style={({ pressed }) => [
          styles.listItemContainer,
          isSelected && styles.listItemSelected,
          isDisabled && styles.listItemDisabled,
          pressed && !isDisabled && styles.listItemPressed
        ]}
        onPress={() => !isDisabled && onPress(item)}
        disabled={isDisabled}
      >
        <View style={styles.innerButton}>
          <View style={styles.buttonHighlight} />
          <View style={styles.buttonShadow} />
          <Text style={[
            styles.listItemText,
            isSelected && styles.listItemTextSelected,
            isDisabled && styles.listItemTextDisabled 
          ]}>
            {item}
            
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonFrame: {
    backgroundColor: '#000000ff', 
    marginBottom: SCREEN_HEIGHT * 0.009,
    shadowColor: '#1a365d',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    // Outer 3D frame
    borderTopWidth: 1,
    borderTopColor: '#87ceeb',
    borderLeftWidth: 1,
    borderLeftColor: '#87ceeb',
    borderBottomWidth: 3,
    borderBottomColor: '#1a365d',
    borderRightWidth: 2,
    borderRightColor: '#1a365d',
  },

  listItemContainer: {
    width: SCREEN_WIDTH * 0.20,
    position: 'relative',
    overflow: 'hidden',
    
    // Sky blue console button background
    backgroundColor: '#4a90e2',
    
    // Console-style 3D borders
    borderTopWidth: 2,
    borderTopColor: '#93c5fd', // Light blue highlight
    borderLeftWidth: 2,
    borderLeftColor: '#93c5fd',
    borderBottomWidth: 3,
    borderBottomColor: '#1e3a8a', // Dark blue shadow
    borderRightWidth: 3,
    borderRightColor: '#1e3a8a',
    
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
    paddingVertical: 3,
    justifyContent: 'center',
    backgroundColor: '#014656ae', 
    borderRadius: SCREEN_WIDTH * 0.015,
    
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 138, 0.4)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(30, 58, 138, 0.3)',
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
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.015,
    borderBottomRightRadius: SCREEN_WIDTH * 0.015,
    pointerEvents: 'none',
  },

  listItemPressed: {
    transform: [{ translateY: 1 }],
    backgroundColor: '#0044b1ff', 
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    borderTopWidth: 3,
    borderTopColor: '#1e3a8a',
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#93c5fd',
    borderRightWidth: 1,
    borderRightColor: '#93c5fd',
  },

  listItemSelected: {
    backgroundColor: '#0ea5e9', 
    borderTopColor: '#38bdf8',
    borderLeftColor: '#38bdf8',
    borderBottomColor: '#0c4a6e',
    borderRightColor: '#0c4a6e',
    
    // Add glow effect for selected state
    shadowColor: '#0ea5e9',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 15,
  },

  listItemDisabled: {
    opacity: 0.4,
    backgroundColor: '#2e78e0ff',
    borderTopColor: '#94a3b8',
    borderLeftColor: '#94a3b8',
    borderBottomColor: '#334155',
    borderRightColor: '#334155',
  },

  listItemText: {
    fontSize: SCREEN_WIDTH * 0.026,
    color: '#ffffff', 
    textAlign: 'center',
    fontFamily: 'DynaPuff', 
    textShadowRadius: 2,
    zIndex: 1,
  },

  listItemTextSelected: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  listItemTextDisabled: {
    color: '#e2e8f0',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default AnswerOption;