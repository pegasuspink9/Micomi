import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import AnswerOption from './AnswerOption';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const AnswerGrid = ({ 
  options, 
  selectedAnswers, 
  maxAnswers, 
  onAnswerSelect 
}) => {
  const renderListItems = () => {
    if (!options) return [];
    
    return options.split(',').map((item, index) => {
      const trimmedItem = item.trim();
      const isSelected = selectedAnswers.includes(trimmedItem);
      const isDisabled = !isSelected && selectedAnswers.length >= maxAnswers;
      
      return (
        <AnswerOption
          key={index}
          item={trimmedItem}
          index={index}
          isSelected={isSelected}
          isDisabled={isDisabled}
          onPress={onAnswerSelect}
        />
      );
    });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollableButton}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      <View style={styles.flexWrapContainer}>
        {renderListItems()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flexWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SCREEN_WIDTH * 0.01,
  },

  scrollableButton: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_WIDTH * 0.01,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    paddingBottom: SCREEN_HEIGHT * 0.08, 
  },
});

export default AnswerGrid;