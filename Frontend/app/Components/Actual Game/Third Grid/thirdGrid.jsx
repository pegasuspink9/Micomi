import React, { useEffect, useState } from 'react';
import GridContainer from './components/GridContainer';
import AnswerGrid from './components/AnswerGrid';
import GameButton from './components/GameButtons';
import PotionGrid from './components/Potions/Potions';

import { 
  getMaxAnswers, // Add this import
  createAnswerSelectHandler,
  createNextQuestionHandler,
  createCheckAnswerHandler,
  checkAnswer
} from './utils/answerLogic';

export default function ThirdGrid({ 
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
  onCorrectAnswer // Callback to switch tab when answer is correct
}) {
  
  // Safety check for currentQuestion
  if (!currentQuestion) {
    console.warn('No currentQuestion provided to ThirdGrid');
    return null;
  }
  
  const maxAnswers = getMaxAnswers(currentQuestion);
  console.log('Max answers calculated:', { 
    maxAnswers, 
    challenge_type: currentQuestion.type || currentQuestion.challenge_type 
  });

  const handleAnswerSelect = createAnswerSelectHandler(
    currentQuestion, 
    selectedAnswers, 
    setSelectedAnswers
  );

  const handleNextQuestion = createNextQuestionHandler(
    currentQuestionIndex,
    questionsData,
    setCurrentQuestionIndex,
    setSelectedAnswers
  );

  const handleCheckAnswer = createCheckAnswerHandler(
    currentQuestion,
    selectedAnswers,
    setBorderColor,
    setCorrectAnswerRef,
    submitAnswer,
    onCorrectAnswer // Pass the callback for automatic tab switching
  );

  const [showPotions, setShowPotions] = useState(false);

  const togglePotions = () => {
    setShowPotions(!showPotions);
  };

  // Debug logging
  console.log('ThirdGrid render:', {
    questionTitle: currentQuestion.title,
    challenge_type: currentQuestion.type || currentQuestion.challenge_type,
    optionsLength: currentQuestion.options?.length,
    selectedAnswersLength: selectedAnswers?.length,
    maxAnswers,
    submitting
  });

  return (
    <GridContainer>
      {showPotions ? (
        <PotionGrid />
      ) : (
        <AnswerGrid
          options={currentQuestion.options || []}
          selectedAnswers={selectedAnswers}
          maxAnswers={maxAnswers}
          onAnswerSelect={handleAnswerSelect}
        />
      )}
      
      <GameButton 
        title={submitting ? "Submitting..." : "Run"}
        position="right"
        variant="primary"
        onPress={handleCheckAnswer}
        disabled={
          submitting || 
          !Array.isArray(selectedAnswers) || 
          selectedAnswers.length === 0
        }
      />

      <GameButton 
        title={showPotions ? "Keyboard" : "Potions"}
        position="left"
        variant="secondary"
        onPress={togglePotions}
        disabled={submitting}
      />
    </GridContainer>
  );
}