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
  checkAnswer,
  setBorderColor
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
  usePotion,
  cardImageUrl,
  cardDisplaySequence
}) => {

  if (!currentQuestion) {
    console.warn('No currentQuestion provided to ThirdGrid');
    return null;
  }
  
  const maxAnswers = useMemo(() => getMaxAnswers(currentQuestion), [currentQuestion]);

  const isFillInTheBlank = (currentQuestion.type || currentQuestion.challenge_type) === 'fill in the blank';
  
  
  const options = useMemo(() => currentQuestion.options || [], [currentQuestion.options]);

   const getPotionBorderColor = (potionName) => {
    switch (potionName) {
      case 'Health':
        return 'rgba(227, 140, 140, 1)';
      case 'Strong':
        return 'rgba(197, 197, 96, 1)';
      case 'Hint':
        return 'rgba(8, 120, 66, 1)';
      case 'Freeze':
        return 'rgba(1, 184, 201, 1)';
      default:
        return 'white';
    }
  };


  const challengeType = currentQuestion.type || currentQuestion.challenge_type;

  const handleAnswerSelect = useMemo(() => 
  createAnswerSelectHandler(currentQuestion, selectedAnswers, setSelectedAnswers), 
  [currentQuestion, selectedAnswers, setSelectedAnswers]
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
      onCorrectAnswer,
      options
    ), [currentQuestion, selectedAnswers, setBorderColor, setCorrectAnswerRef, submitAnswer, onCorrectAnswer, options]
  );

  const [showPotions, setShowPotions] = useState(false);
  const [runDisabled, setRunDisabled] = useState(false);
  const [potionUsed, setPotionUsed] = useState(false);
  const togglePotions = useCallback(() => {
    setShowPotions(!showPotions); //  Always allow toggling
  }, [showPotions]);

  const runButtonDisabled = useMemo(() => (
    submitting || 
    usingPotion ||
    runDisabled  ||
    (!selectedPotion && (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0))
  ), [submitting, usingPotion, selectedPotion, selectedAnswers]);

  
  useEffect(() => {
  setPotionUsed(false);
  }, [currentQuestion?.id]);

  const handleRunPress = useCallback(() => {
    setRunDisabled(true); 
    if (selectedPotion) {
      setPotionUsed(true); 
      usePotion(selectedPotion.player_potion_id);
      setBorderColor(getPotionBorderColor(selectedPotion.name)); 
      console.log('🧪 Potion activated:', selectedPotion.name, 'Border color changed');
    } else {
      handleCheckAnswer();
    }
    setTimeout(() => {
      setRunDisabled(false);
    }, 3000);
  }, [selectedPotion, usePotion, handleCheckAnswer, setBorderColor]);

  const runButtonTitle = useMemo(() => {
    if (usingPotion) return "Using...";
    if (selectedPotion) return "Activate";
    if (submitting) return "Running";
    return "Run";
  }, [usingPotion, selectedPotion, submitting]);

  const runButtonVariant = useMemo(() => {
    return selectedPotion ? "info" : "primary";
  }, [selectedPotion]);


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
      cardImageUrl={cardImageUrl}
      showCardInGrid={cardDisplaySequence === 'grid'}
      lowerChildren={
        <View style={{ flex: 1, position: 'relative' }}>
          <GameButton 
            title={runButtonTitle}
            position="right"
            variant={runButtonVariant}
            onPress={handleRunPress}
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
          potionUsed={potionUsed} 
          currentQuestionId={currentQuestion.id} 
        />
      ) : (
        <AnswerGrid
          options={options}
          selectedAnswers={selectedAnswers}
          maxAnswers={maxAnswers}
          onAnswerSelect={handleAnswerSelect}
          isFillInTheBlank={isFillInTheBlank}
          selectedBlankIndex={selectedBlankIndex} 
          currentQuestionId={currentQuestion.id}
        />
      )}
    </GridContainer>
  );
};

//  Memoize ThirdGrid with custom comparison
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