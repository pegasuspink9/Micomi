import React, { useEffect, useState } from 'react';
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

export default function ThirdGrid({ 
  currentQuestion, 
  selectedAnswers, 
  setSelectedAnswers,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionsData,
  animateToPosition,
  setBorderColor,
  timeLeft,
  isTimeExpired,
  hasShownOutput,
  setHasShownOutput,
  setCorrectAnswerRef
}) {
  
  const maxAnswers = getMaxAnswers(currentQuestion);

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
    animateToPosition,
    isTimeExpired,
    hasShownOutput,
    setHasShownOutput,
    setCorrectAnswerRef
  );

  // Handle timer expiration
  useEffect(() => {
    console.log('🔍 Timer expiration check:', { isTimeExpired, timeLeft });
    
    if (isTimeExpired) {
      console.log('🔥 TIMER EXPIRED - Evaluating answer');
      
      const isCorrect = checkAnswer(currentQuestion, selectedAnswers);
      const hasAnswers = selectedAnswers.length > 0;
      
      console.log('📊 Answer evaluation:', { 
        isCorrect, 
        hasAnswers, 
        selectedAnswers, 
        correctAnswer: currentQuestion.answer 
      });
      
      if (setCorrectAnswerRef?.current) {
        setCorrectAnswerRef.current(isCorrect && hasAnswers);
      }
      
      if (isCorrect && hasAnswers) {
        console.log('✅ Timer expired but answer is CORRECT');
        setBorderColor('#34c759');
        
        if (!hasShownOutput && currentQuestion.questionType === 'code-blanks') {
          console.log('📺 Auto-showing output for correct answer');
          setHasShownOutput(true);
          setTimeout(() => {
            animateToPosition(true);
          }, 100);
        }
        
      } else {
        console.log('❌ Timer expired and answer is WRONG/BLANK - no output');
        setBorderColor('#ff3b30');
      }
    }
  }, [isTimeExpired]);

  const [showPotions, setShowPotions] = useState(false);

  const togglePotions = () => {
    setShowPotions(!showPotions);
  };

  return (
    <GridContainer>
      {showPotions ? (
        <PotionGrid />
      ) : (
        <AnswerGrid
          options={currentQuestion.options || ""}
          selectedAnswers={selectedAnswers}
          maxAnswers={maxAnswers}
          onAnswerSelect={handleAnswerSelect}
        />
      )}
      
      <GameButton 
        title="Run"
        position="right"
        variant="primary"
        onPress={handleCheckAnswer}
        disabled={selectedAnswers.length === 0 || isTimeExpired}
      />

      <GameButton 
        title={showPotions ? "Keyboard" : "Potions"}
        position="left"
        variant="secondary"
        onPress={togglePotions}
      />
    </GridContainer>
  );
}