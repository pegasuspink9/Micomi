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
    <View style={[
      styles.buttonFrame,
      isSelected && styles.buttonFrameSelected
    ]}>
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
        <View style={[
          styles.innerButton,
          isSelected && styles.innerButtonSelected,
          isDisabled && styles.innerButtonDisabled
        ]}>
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
    backgroundColor: '#000000ff', // ✅ Keep original color
    borderRadius: SCREEN_WIDTH * 0.025, // ✅ Added from GameButton
    marginBottom: SCREEN_HEIGHT * 0.009,
    shadowColor: '#000', // ✅ Updated from GameButton
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    // ✅ Updated border structure from GameButton
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  buttonFrameSelected: {
    // ✅ Add glow for selected frame
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  listItemContainer: {
    width: SCREEN_WIDTH * 0.20,
    borderRadius: SCREEN_WIDTH * 0.02, // ✅ Added from GameButton
    position: 'relative',
    overflow: 'hidden',
    
    // ✅ Keep original colors
    backgroundColor: '#4a90e2',
    
    // ✅ Updated border structure from GameButton
    borderTopWidth: 2,
    borderTopColor: '#93c5fd', // Keep original light blue highlight
    borderLeftWidth: 2,
    borderLeftColor: '#93c5fd',
    borderBottomWidth: 3,
    borderBottomColor: '#1e3a8a', // Keep original dark blue shadow
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
    justifyContent: 'center',
    borderRadius: SCREEN_WIDTH * 0.015,
    paddingVertical: SCREEN_WIDTH * 0.009, // ✅ Updated from GameButton
    paddingHorizontal: SCREEN_WIDTH * 0.015, // ✅ Added from GameButton
    backgroundColor: '#014656ae', // ✅ Keep original color
    
    // ✅ Keep GameButton's inner border structure
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },

  innerButtonSelected: {
    backgroundColor: '#014656ae', // ✅ Keep original but could be slightly different for selected
  },

  innerButtonDisabled: {
    backgroundColor: '#b0b0b0', // ✅ From GameButton
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

  listItemPressed: {
    transform: [{ translateY: 0.5 }],
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
    
    // ✅ Keep original glow effect
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
    backgroundColor: '#8e8e93', // ✅ Updated from GameButton
    borderTopColor: '#aeaeb2', // ✅ Updated from GameButton
    borderLeftColor: '#aeaeb2',
    borderBottomColor: '#636366', // ✅ Updated from GameButton
    borderRightColor: '#636366',
  },

  listItemText: {
    fontSize: SCREEN_WIDTH * 0.031, // ✅ Updated from GameButton
    color: '#ffffff', 
    textAlign: 'center',
    fontFamily: 'DynaPuff', 
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // ✅ Updated from GameButton
    textShadowOffset: { width: 1, height: 1 }, // ✅ Updated from GameButton
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
    color: '#f2f2f7', // ✅ Updated from GameButton
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
});


export default React.memo(AnswerOption, (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.onPress === nextProps.onPress
  );
});