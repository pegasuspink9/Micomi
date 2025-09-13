import React, { useEffect } from 'react';
import GridContainer from './components/GridContainer';
import AnswerGrid from './components/AnswerGrid';
import RunButton from './components/RunButton';

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
  setCorrectAnswerRef // NEW: Reference to setCorrectAnswer function
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
    setCorrectAnswerRef // NEW: Pass setCorrectAnswer ref
  );

  // Handle timer expiration - ONLY show feedback, don't proceed yet
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
      
      // NEW: Notify enemy system about correct answer state
      if (setCorrectAnswerRef?.current) {
        setCorrectAnswerRef.current(isCorrect && hasAnswers);
      }
      
      if (isCorrect && hasAnswers) {
        // Correct answer - show green and auto-show output (only once)
        console.log('✅ Timer expired but answer is CORRECT');
        setBorderColor('#34c759');
        
        // Auto-show output only if not shown yet and it's a code-blanks question
        if (!hasShownOutput && currentQuestion.questionType === 'code-blanks') {
          console.log('📺 Auto-showing output for correct answer');
          setHasShownOutput(true);
          setTimeout(() => {
            animateToPosition(true); // Show drawer/output
          }, 100);
        }
        
      } else {
        // Wrong or blank answer - show red but DON'T show output
        console.log('❌ Timer expired and answer is WRONG/BLANK - no output');
        setBorderColor('#ff3b30');
      }
    }
  }, [isTimeExpired]);

  return (
    <GridContainer>
      <AnswerGrid
        options={currentQuestion.options || ""}
        selectedAnswers={selectedAnswers}
        maxAnswers={maxAnswers}
        onAnswerSelect={handleAnswerSelect}
      />
      
      <RunButton 
        onPress={handleCheckAnswer}
        disabled={selectedAnswers.length === 0 || isTimeExpired}
      />
    </GridContainer>
  );
}