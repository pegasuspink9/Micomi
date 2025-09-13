import React from 'react';
import { Pressable, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const AnswerOption = ({ 
  item, 
  index, 
  isSelected, 
  isDisabled, 
  onPress 
}) => {
  return (
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
      <Text style={[
        styles.listItemText,
        isSelected && styles.listItemTextSelected,
        isDisabled && styles.listItemTextDisabled 
      ]}>
        {item}
      </Text>
    </Pressable>
  );
};

// Make sure all styles are properly defined
const styles = StyleSheet.create({
  listItemContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    width: SCREEN_WIDTH * 0.20,
    marginBottom: SCREEN_HEIGHT * 0.015,
    
    backgroundColor: '#f2f2f7', 
    
    borderTopWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftWidth: 2,
    borderLeftColor: '#e5e5ea',
    borderBottomWidth: 4,
    borderBottomColor: '#8e8e93',
    borderRightWidth: 3,
    borderRightColor: '#aeaeb2',
    
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  listItemPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.15,
    borderTopColor: '#d1d1d6',
    borderLeftColor: '#c7c7cc',
    borderBottomWidth: 2,
    borderBottomColor: '#8e8e93',
  },

  listItemSelected: {
    backgroundColor: '#007aff',
    borderTopColor: '#4da6ff',
    borderLeftColor: '#0066cc',
    borderBottomColor: '#005bb5',
    borderRightColor: '#005bb5',
  },

  listItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#e5e5ea',
  },

  listItemText: {
    fontSize: SCREEN_WIDTH * 0.032,
    fontWeight: 'bold',
    color: '#1c1c1e',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  listItemTextSelected: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
  },

  listItemTextDisabled: {
    color: '#636366',
    textShadowColor: 'transparent',
  },
});

// IMPORTANT: Make sure to export as default
export default AnswerOption;