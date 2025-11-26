import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import GridContainer from './components/GridContainer';
import AnswerGrid from './components/AnswerGrid';
import GameButton from './components/GameButtons';
import PotionGrid from './components/Potions/Potions';
import { gameScale, BASE_HEIGHT } from '../../Responsiveness/gameResponsive';
import { soundManager } from '../Sounds/UniversalSoundManager';

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
  cardDisplaySequence,
  canProceed = false,
  onProceed = null,
  isLevelComplete = false,
  showRunButton = true,
  onRetry = null,
  onHome = null,
  onNextLevel = null,
  hasNextLevel = false,
  onCharacterRun = null, 
  fadeOutAnim = null,
  isInRunMode = false,
  setSelectedBlankIndex,
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
  createAnswerSelectHandler(
    currentQuestion, 
    selectedAnswers, 
    setSelectedAnswers,
    selectedBlankIndex, // ✅ ADDED: Pass selected index
    setSelectedBlankIndex // ✅ ADDED: Pass setter for auto-advance
  ), 
  [currentQuestion, selectedAnswers, setSelectedAnswers, selectedBlankIndex, setSelectedBlankIndex]
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
    soundManager.playGameButtonTapSound();
    setShowPotions(!showPotions);
  }, [showPotions]);

   const runButtonDisabled = useMemo(() => {
    const hasSelectedAnswer = selectedAnswers.some(answer => answer != null);

    return (
      submitting || 
      usingPotion ||
      runDisabled  ||
      (!selectedPotion && !hasSelectedAnswer)
    );
  }, [submitting, usingPotion, runDisabled, selectedPotion, selectedAnswers]);

  useEffect(() => {
    setPotionUsed(false);
  }, [currentQuestion?.id]);

  const handleRunPress = useCallback(() => {
    soundManager.playGameButtonTapSound();
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
    submitting,
    canProceed
  });

       const calculateHeight = (numOptions) => {
    if (!currentQuestion || !numOptions || numOptions === 0) {
      return gameScale(BASE_HEIGHT * 0.12);
    }
    
    if (numOptions > 8) {
      return gameScale(BASE_HEIGHT * 0.2); 
    }

    const baseHeight = gameScale(BASE_HEIGHT * 0.10);
    const itemHeight = gameScale(BASE_HEIGHT * 0.04); 
    const columns = 4; 
    const rows = Math.ceil(numOptions / columns);
    const extraHeight = (rows - 1) * itemHeight;
    return baseHeight + extraHeight;
  };

   const dynamicHeight = useMemo(() => {
    if (canProceed || isLevelComplete) {
      return gameScale(BASE_HEIGHT * 0.12);
    }

    return calculateHeight(options.length);
  }, [canProceed, isLevelComplete, options.length, showPotions]);


  const handleClearAll = useCallback(() => {
    soundManager.playGameButtonTapSound();
    setSelectedAnswers([]); 
    setSelectedBlankIndex(0);
  }, [setSelectedAnswers, setSelectedBlankIndex]);


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
      isProceedMode={canProceed && !isLevelComplete}
      onProceed={onProceed}
      isLevelComplete={isLevelComplete} 
      showRunButton={showRunButton}
      onRetry={onRetry} 
      onHome={onHome}
      onNextLevel={onNextLevel}
      hasNextLevel={hasNextLevel}
      onRun={onCharacterRun}
      fadeOutAnim={fadeOutAnim}
      isInRunMode={isInRunMode}
      lowerChildren={
        <View style={{ flex: 1, position: 'relative' }}>
          {canProceed ? (
            <View />
          ) : (
            <>
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
            </>
          )}
        </View>
      }
    >
      {/* REMOVED: AnswerOption proceed button - now in GridContainer */}
       {!canProceed && !isLevelComplete && showPotions ? (
        <PotionGrid 
          potions={potions}
          onPotionPress={onPotionPress}
          selectedPotion={selectedPotion}
          loadingPotions={loadingPotions}
          potionUsed={potionUsed} 
          currentQuestionId={currentQuestion.id} 
        />
      ) : !canProceed && !isLevelComplete ? (
        <AnswerGrid
          options={options}
          selectedAnswers={selectedAnswers}
          maxAnswers={maxAnswers}
          onAnswerSelect={handleAnswerSelect}
          isFillInTheBlank={isFillInTheBlank}
          selectedBlankIndex={selectedBlankIndex} 
          currentQuestionId={currentQuestion.id}
        />
      ) : null}
    </GridContainer>
  );
};

const styles = StyleSheet.create({
  proceedContainer: {
    flex: 1,
    width: gameScale(100),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: gameScale(10),
  },
});

export default React.memo(ThirdGrid, (prevProps, nextProps) => {
    return (
      prevProps.currentQuestion?.id === nextProps.currentQuestion?.id &&
      prevProps.currentQuestion?.title === nextProps.currentQuestion?.title &&
      JSON.stringify(prevProps.selectedAnswers) === JSON.stringify(nextProps.selectedAnswers) &&
      prevProps.submitting === nextProps.submitting &&
      prevProps.currentQuestionIndex === nextProps.currentQuestionIndex &&
      prevProps.canProceed === nextProps.canProceed &&
      prevProps.isLevelComplete === nextProps.isLevelComplete &&
      prevProps.showRunButton === nextProps.showRunButton &&
      prevProps.isInRunMode === nextProps.isInRunMode &&
      
      prevProps.setSelectedAnswers === nextProps.setSelectedAnswers &&
      prevProps.submitAnswer === nextProps.submitAnswer &&
      prevProps.selectedBlankIndex === nextProps.selectedBlankIndex 
    );
});