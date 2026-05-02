import React, { useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Text, Animated } from 'react-native';
import AnswerOption from './AnswerOption';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const AnswerGrid = ({ 
  challengeId = null,
  strictChallengeRender = false,
  options, 
  selectedAnswers = [],
  maxAnswers = 1,
  onAnswerSelect,
  isFillInTheBlank = false,
  selectedBlankIndex = 0, 
  isSpecialAttack = false,
}) => {

  const animations = useRef([]);

  const normalizedOptions = useMemo(() => {
    if (!options) {
      return [];
    }

    if (Array.isArray(options)) {
      return options.filter((item) => item !== null && item !== undefined);
    }

    if (typeof options === 'string' && options.trim().length > 0) {
      return options
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  }, [options]);

  const renderedItems = useMemo(() => {
    // Early return if no options
    if (!normalizedOptions.length) {
      console.warn('⚠️ No options provided to AnswerGrid');
      return [];
    }

    try {
      return normalizedOptions.map((item, index) => {
        const trimmedItem = typeof item === 'string' ? item.trim() : String(item).trim();
        
        // Skip empty items
        if (!trimmedItem) {
          return null;
        } 

         if (!animations.current[index]) {
        animations.current[index] = {
          opacity: new Animated.Value(0),
          scale: new Animated.Value(0.8),
        };
        }
        
            
        const isSelected = selectedAnswers.includes(index);
        const isDisabled = !isSelected && selectedAnswers.filter(a => a !== null).length >= maxAnswers;
        
        return (
        <Animated.View
          key={`option-${challengeId || 'none'}-${index}`}
          style={{
            opacity: animations.current[index].opacity,
            transform: [{ scale: animations.current[index].scale }],
          }}
        >
          <AnswerOption
            item={trimmedItem}
            index={index}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onPress={() => onAnswerSelect(index)}
            isSpecialAttack={isSpecialAttack}
          />
        </Animated.View>
      );
      }).filter(item => item !== null);
      
    } catch (error) {
      console.error('❌ Error processing options:', error);
      return [];
    }
    }, [challengeId, isSpecialAttack, maxAnswers, normalizedOptions, onAnswerSelect, selectedAnswers]);

  const animationTriggerKey = strictChallengeRender
    ? String(challengeId ?? 'none')
    : `${String(challengeId ?? 'none')}|${normalizedOptions.length}`;

   useEffect(() => {
      if (normalizedOptions.length > 0) {
      // Reset animations
      animations.current.forEach(anim => {
        if (anim) {
          anim.opacity.setValue(0);
          anim.scale.setValue(0.8);
        }
      });

      // Stagger animation for each option
      const anims = animations.current.slice(0, normalizedOptions.length).map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            delay: index * 100, // Stagger delay
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 200,
            friction: 8,
            delay: index * 100,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.stagger(50, anims).start();
    }
  }, [animationTriggerKey, normalizedOptions.length]);
  

  if (!options) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    );
  }
  
  // Show message if no valid options after processing
  if (renderedItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No valid options available</Text>
      </View>
    );
  }

  return (
    <View 
      contentContainerStyle={styles.scrollableButton}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      <View style={styles.flexWrapContainer}>
        {renderedItems}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flexWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: gameScale(4),
  },
  scrollableButton: {
    flexGrow: 1,
    paddingHorizontal: gameScale(4),
    paddingBottom: gameScale(68), 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: gameScale(42),
  },
  loadingText: {
    color: '#999',
    fontSize: gameScale(16),
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: gameScale(16),
    textAlign: 'center',
  },
});

const MemoizedAnswerGrid = React.memo(AnswerGrid, (prev, next) => {
  const prevOptions = prev.options;
  const nextOptions = next.options;
  const optionsEqual = prevOptions === nextOptions;

  const prevSelected = prev.selectedAnswers || [];
  const nextSelected = next.selectedAnswers || [];
  const selectedEqual = prevSelected.length === nextSelected.length && prevSelected.every((value, index) => value === nextSelected[index]);

  const challengeEqual = prev.challengeId === next.challengeId;
  const strictChallengeMode = prev.strictChallengeRender && next.strictChallengeRender;

  if (strictChallengeMode && challengeEqual) {
    return (
      selectedEqual &&
      prev.maxAnswers === next.maxAnswers &&
      prev.isFillInTheBlank === next.isFillInTheBlank &&
      prev.selectedBlankIndex === next.selectedBlankIndex &&
      prev.isSpecialAttack === next.isSpecialAttack
    );
  }

  return (
    challengeEqual &&
    optionsEqual &&
    selectedEqual &&
    prev.maxAnswers === next.maxAnswers &&
    prev.isFillInTheBlank === next.isFillInTheBlank &&
    prev.selectedBlankIndex === next.selectedBlankIndex &&
    prev.isSpecialAttack === next.isSpecialAttack
  );
});

export default MemoizedAnswerGrid;