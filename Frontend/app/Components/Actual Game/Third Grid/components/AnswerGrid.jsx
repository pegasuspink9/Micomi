import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Text } from 'react-native';
import AnswerOption from './AnswerOption';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const AnswerGrid = ({ 
  options, 
  selectedAnswers = [],
  maxAnswers = 1,
  onAnswerSelect 
}) => {
  const renderListItems = () => {
    // Early return if no options
    if (!options) {
      console.warn('⚠️ No options provided to AnswerGrid');
      return [];
    }

    // Handle both array and string formats
    let optionsArray = [];
    
    try {
      if (Array.isArray(options)) {
        // API format: options is already an array
        optionsArray = options.filter(item => item !== null && item !== undefined);
        console.log('📋 Options received as array:', optionsArray);
      } else if (typeof options === 'string' && options.trim().length > 0) {
        // Legacy format: options is a comma-separated string
        optionsArray = options.split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        console.log('📋 Options received as string, converted to array:', optionsArray);
      } else {
        console.error('❌ Invalid options format:', typeof options, options);
        return [];
      }

      // Additional safety check
      if (optionsArray.length === 0) {
        console.warn('⚠️ Options array is empty after processing');
        return [];
      }

      return optionsArray.map((item, index) => {
        const trimmedItem = typeof item === 'string' ? item.trim() : String(item).trim();
        
        // Skip empty items
        if (!trimmedItem) {
          return null;
        }
        
        const isSelected = selectedAnswers.includes(trimmedItem);
        const isDisabled = !isSelected && selectedAnswers.length >= maxAnswers;
        
        return (
          <AnswerOption
            key={`option-${index}-${trimmedItem}`}
            item={trimmedItem}
            index={index}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onPress={onAnswerSelect}
          />
        );
      }).filter(item => item !== null); // Remove null items
      
    } catch (error) {
      console.error('❌ Error processing options:', error);
      return [];
    }
  };

  // Show loading state if no options yet
  if (!options) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    );
  }

  const renderedItems = renderListItems();
  
  // Show message if no valid options after processing
  if (renderedItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No valid options available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollableButton}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      <View style={styles.flexWrapContainer}>
        {renderedItems}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flexWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: SCREEN_WIDTH * 0.01,
  },

  scrollableButton: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_WIDTH * 0.01,
    paddingBottom: SCREEN_HEIGHT * 0.08, 
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.05,
  },

  loadingText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },

  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AnswerGrid;