import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import GridContainer from './components/GridContainer';
import AnswerGrid from './components/AnswerGrid';
import GameButton from './components/GameButtons';
import PotionGrid from './components/Potions/Potions';


const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
  setThirdGridHeight,
  selectedBlankIndex = 0, 
}) => {

  if (!currentQuestion) {
    console.warn('No currentQuestion provided to ThirdGrid');
    return null;
  }
  
  // ✅ Memoize maxAnswers calculation
  const maxAnswers = useMemo(() => getMaxAnswers(currentQuestion), [currentQuestion]);

  const isFillInTheBlank = (currentQuestion.type || currentQuestion.challenge_type) === 'fill in the blank';
  
  const handleAnswerSelect = useMemo(() => {
    return createAnswerSelectHandler(currentQuestion, selectedAnswers, setSelectedAnswers);
  }, [currentQuestion, selectedAnswers, setSelectedAnswers]);

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
  const [runDisabled, setRunDisabled] = useState(false);


  const togglePotions = useCallback(() => {
    setShowPotions(!showPotions);
  }, [showPotions]);

  const runButtonDisabled = useMemo(() => (
    submitting || 
    usingPotion ||
    runDisabled  ||
    (!selectedPotion && (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0))
  ), [submitting, usingPotion, selectedPotion, selectedAnswers]);

  const handleRunPress = useCallback(() => {
  setRunDisabled(true); 
  if (selectedPotion) {
    onPotionPress?.(selectedPotion);
  } else {
    handleCheckAnswer();
  }
  setTimeout(() => {
    setRunDisabled(false);
  }, 5000);
}, [selectedPotion, onPotionPress, handleCheckAnswer]);

  const runButtonTitle = useMemo(() => {
    if (usingPotion) return "Using...";
    if (selectedPotion) return "Use Potion";
    if (submitting) return "Running";
    return "Run";
  }, [usingPotion, selectedPotion, submitting]);

  const runButtonVariant = useMemo(() => {
    return selectedPotion ? "info" : "primary";
  }, [selectedPotion]);

  const options = useMemo(() => currentQuestion.options || [], [currentQuestion.options]);

  console.log('ThirdGrid render:', {
    questionTitle: currentQuestion.title,
    challenge_type: currentQuestion.type || currentQuestion.challenge_type,
    optionsLength: options.length,
    selectedAnswersLength: selectedAnswers?.length,
    maxAnswers,
    submitting
  });

    const calculateHeight = (numOptions) => {
      if (numOptions > 8) {
        return SCREEN_HEIGHT * 0.2; 
      }
      
      const baseHeight = SCREEN_HEIGHT * 0.10;
      const itemHeight = SCREEN_HEIGHT * 0.04; 
      const columns = 4; 
      const rows = Math.ceil(numOptions / columns);
      const extraHeight = (rows - 1) * itemHeight;
      return baseHeight + extraHeight;
    };

    const handleClearAll = useCallback(() => {
        setSelectedAnswers([]); 
      }, [setSelectedAnswers]);



  const dynamicHeight = calculateHeight(options.length);

   useEffect(() => {
    if (setThirdGridHeight) {
      setThirdGridHeight(dynamicHeight);
    }
  }, [dynamicHeight, setThirdGridHeight]);

  return (
    <GridContainer
      mainHeight={dynamicHeight}
      lowerChildren={
        <View style={{ flex: 1, position: 'relative' }}>
          <GameButton 
            title={runButtonTitle}
            position="right"
            variant={runButtonVariant}
            onPress={selectedPotion ? () => onPotionPress?.(selectedPotion) : handleRunPress}
            disabled={runButtonDisabled}
          />

          <GameButton 
            title={showPotions ? "Keyboard" : "Potions"}
            position="center"
            variant="secondary"
            onPress={togglePotions}
            disabled={submitting || usingPotion}
          />

          <GameButton 
          title="Clear"
          position="left"
          variant="danger"
          onPress={handleClearAll}
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
          isFillInTheBlank={isFillInTheBlank}
          selectedBlankIndex={selectedBlankIndex} 
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
      prevProps.submitAnswer === nextProps.submitAnswer &&
      prevProps.selectedBlankIndex === nextProps.selectedBlankIndex 
    );
});