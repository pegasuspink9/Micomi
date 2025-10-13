import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import GridContainer from './components/GridContainer';
import AnswerGrid from './components/AnswerGrid';
import GameButton from './components/GameButtons';
import PotionGrid from './components/Potions/Potions';

import { 
  getMaxAnswers,
  createAnswerSelectHandler,
  createNextQuestionHandler,
  createCheckAnswerHandler,
  checkAnswer
} from './utils/answerLogic';

const ThirdGrid = ({ 
  currentQuestion, 
  selectedAnswers = [],
  setSelectedAnswers,
  currentQuestionIndex = 0,
  setCurrentQuestionIndex,
  questionsData,
  setBorderColor,
  setCorrectAnswerRef,
  challengeData,
  gameState,
  submitAnswer,
  submitting = false,
  onCorrectAnswer,
  potions = [],
  selectedPotion = null,
  onPotionPress,
  loadingPotions = false,
  usingPotion = false,
}) => {
  
  if (!currentQuestion) {
    console.warn('No currentQuestion provided to ThirdGrid');
    return null;
  }
  
  // ✅ Memoize maxAnswers calculation
  const maxAnswers = useMemo(() => getMaxAnswers(currentQuestion), [currentQuestion]);
  
  // ✅ Memoize handlers to prevent recreation
  const handleAnswerSelect = useMemo(() => 
    createAnswerSelectHandler(
      currentQuestion, 
      selectedAnswers, 
      setSelectedAnswers
    ), [currentQuestion, selectedAnswers, setSelectedAnswers]
  );

  const handleNextQuestion = useMemo(() => 
    createNextQuestionHandler(
      currentQuestionIndex,
      questionsData,
      setCurrentQuestionIndex,
      setSelectedAnswers
    ), [currentQuestionIndex, questionsData, setCurrentQuestionIndex, setSelectedAnswers]
  );

  const handleCheckAnswer = useMemo(() => 
    createCheckAnswerHandler(
      currentQuestion,
      selectedAnswers,
      setBorderColor,
      setCorrectAnswerRef,
      submitAnswer,
      onCorrectAnswer
    ), [currentQuestion, selectedAnswers, setBorderColor, setCorrectAnswerRef, submitAnswer, onCorrectAnswer]
  );

  const [showPotions, setShowPotions] = useState(false);

  // ✅ Memoize toggle function
  const togglePotions = useCallback(() => {
    setShowPotions(!showPotions);
  }, [showPotions]);

  const runButtonDisabled = useMemo(() => (
    submitting || 
    usingPotion ||
    (!selectedPotion && (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0))
  ), [submitting, usingPotion, selectedPotion, selectedAnswers]);

  const runButtonTitle = useMemo(() => {
    if (usingPotion) return "Using...";
    if (selectedPotion) return "Use Potion";
    if (submitting) return "Running...";
    return "Run";
  }, [usingPotion, selectedPotion, submitting]);

  const runButtonVariant = useMemo(() => {
    return selectedPotion ? "info" : "primary";
  }, [selectedPotion]);

  // ✅ Memoize options array
  const options = useMemo(() => currentQuestion.options || [], [currentQuestion.options]);

  console.log('ThirdGrid render:', {
    questionTitle: currentQuestion.title,
    challenge_type: currentQuestion.type || currentQuestion.challenge_type,
    optionsLength: options.length,
    selectedAnswersLength: selectedAnswers?.length,
    maxAnswers,
    submitting
  });

  return (
    <GridContainer
      lowerChildren={
        <View style={{ flex: 1, position: 'relative' }}>
          <GameButton 
            title={runButtonTitle}
            position="right"
            variant={runButtonVariant}
            onPress={selectedPotion ? () => onPotionPress?.(selectedPotion) : handleCheckAnswer}
            disabled={runButtonDisabled}
          />

          <GameButton 
            title={showPotions ? "Keyboard" : "Potions"}
            position="left"
            variant="secondary"
            onPress={togglePotions}
            disabled={submitting || usingPotion}
          />
        </View>
      }
    >
      {showPotions ? (
        <PotionGrid 
          potions={potions}
          onPotionPress={onPotionPress}
          selectedPotion={selectedPotion}
          loadingPotions={loadingPotions}
        />
      ) : (
        <AnswerGrid
          options={options}
          selectedAnswers={selectedAnswers}
          maxAnswers={maxAnswers}
          onAnswerSelect={handleAnswerSelect}
        />
      )}
    </GridContainer>
  );
};

// ✅ Memoize ThirdGrid with custom comparison
export default React.memo(ThirdGrid, (prevProps, nextProps) => {
  return (
    prevProps.currentQuestion?.id === nextProps.currentQuestion?.id &&
    prevProps.currentQuestion?.title === nextProps.currentQuestion?.title &&
    JSON.stringify(prevProps.selectedAnswers) === JSON.stringify(nextProps.selectedAnswers) &&
    prevProps.submitting === nextProps.submitting &&
    prevProps.currentQuestionIndex === nextProps.currentQuestionIndex &&
    prevProps.setSelectedAnswers === nextProps.setSelectedAnswers &&
    prevProps.submitAnswer === nextProps.submitAnswer
  );
});