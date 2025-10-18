import { Alert } from 'react-native';

export const getBlankCount = (questionText) => {
  if (!questionText || typeof questionText !== 'string') {
    return 1;
  }
  const blanks = questionText.match(/_/g);
  return blanks ? blanks.length : 1;
};

export const getMaxAnswers = (currentQuestion) => {
  if (!currentQuestion) {
    return 1;
  }
  
  // Check for both possible type field names from API
  const challengeType = currentQuestion.type || currentQuestion.challenge_type;

  if (challengeType === 'fill in the blank' || challengeType === 'code with guide') {
    const question = currentQuestion.question || '';
    const blankCount = (question.match(/_/g) || []).length;
    return blankCount > 0 ? blankCount : 1;
  }
  
  return 1;
};

export const checkAnswer = (currentQuestion, selectedAnswers) => {
  if (!currentQuestion || !selectedAnswers) {
    return false;
  }
  
  // Handle both API response format (correctAnswer) and legacy format (answer)
  const correctAnswers = currentQuestion.correctAnswer || currentQuestion.answer;
  
  if (!correctAnswers) {
    console.warn('No correct answer found in question data');
    return false;
  }
  
  const challenge_type = currentQuestion.type || currentQuestion.challenge_type;
  let isCorrect = false;

  if (challenge_type === 'fill in the blank') {
    const correctAnswersArray = Array.isArray(correctAnswers)
      ? correctAnswers
      : [correctAnswers];
    
    console.log('Fill in blank check:', { 
      correctAnswersArray, 
      selectedAnswers,
      lengthMatch: selectedAnswers.length === correctAnswersArray.length
    });
    
    isCorrect = correctAnswersArray.every((answer, index) => 
      selectedAnswers[index] === answer
    ) && selectedAnswers.length === correctAnswersArray.length;
  } else {
    // Multiple choice - check if selected answer is in correct answers
    const correctAnswersArray = Array.isArray(correctAnswers) 
      ? correctAnswers 
      : [correctAnswers];
    
    isCorrect = selectedAnswers.some(selected => 
      correctAnswersArray.includes(selected)
    );
  }
  
  console.log('Answer check result:', { isCorrect, challenge_type, correctAnswers, selectedAnswers });
  return isCorrect;
};

export const canSelectAnswer = (selectedAnswers, answer, maxAnswers) => {
  if (!selectedAnswers || !Array.isArray(selectedAnswers)) {
    return true;
  }
  
  if (selectedAnswers.includes(answer)) {
    return true; // Can deselect
  }
  
  return selectedAnswers.length < maxAnswers;
};

export const createAnswerSelectHandler = (currentQuestion, selectedAnswers, setSelectedAnswers) => {
  const maxAnswers = getMaxAnswers(currentQuestion);
  
  return (index) => {
    setSelectedAnswers(prev => {
      const newArr = [...prev];
      const idx = newArr.indexOf(index);
      if (idx > -1) {
        // Remove if already selected
        newArr.splice(idx, 1);
      } else {
        // Add if not selected and under limit
        if (newArr.length >= maxAnswers) {
          Alert.alert('Selection Limit', `You can only select ${maxAnswers} answer(s)`);
          return newArr;
        }
        newArr.push(index);
      }
      return newArr;
    });
  };
};

export const createNextQuestionHandler = (
  currentQuestionIndex, 
  questionsData, 
  setCurrentQuestionIndex, 
  setSelectedAnswers
) => {
  return () => {
    if (questionsData && currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
    }
  };
};

// UPDATED: Added automatic tab switching on correct answer
export const createCheckAnswerHandler = (
  currentQuestion,
  selectedAnswers,
  setBorderColor,
  setCorrectAnswerRef,
  submitAnswerFunction,
  onCorrectAnswer,
  options
) => {
  return async () => {
    if (!selectedAnswers || selectedAnswers.length === 0) {
      console.warn('No answers selected');
      return;
    }

    const actualAnswers = selectedAnswers.map(index => options?.[index]).filter(answer => answer !== undefined);

    console.log('Checking answer:', { selectedAnswers, actualAnswers, currentQuestion });
    
    // Submit answer to API
    if (submitAnswerFunction) {
      try {
        const result = await submitAnswerFunction(actualAnswers);
        
        console.log('Submit answer result:', result);
        
        if (result.success) {
          // Access the submission result from the updated game state
          const updatedGameState = result.updatedGameState;
          const submissionResult = updatedGameState?.submissionResult;
          
          if (submissionResult) {
            const isCorrect = submissionResult.isCorrect || false;
            
            if (isCorrect) {
              setBorderColor('green');
              console.log('✅ Correct answer! Moving to next challenge.');
              console.log('🎯 Next challenge:', updatedGameState.currentChallenge?.title);
              
              // NEW: Automatically switch to Output tab on correct answer
              if (onCorrectAnswer) {
                onCorrectAnswer();
              }
            } else {
              setBorderColor('red');
              console.log('❌ Incorrect answer. Message:', submissionResult.message);
            }

            // Log fight result if available
            if (submissionResult.fightResult) {
              console.log('⚔️ Fight result:', {
                status: submissionResult.fightResult.status,
                charHealth: submissionResult.fightResult.charHealth,
                enemyHealth: submissionResult.fightResult.enemyHealth,
                damage: submissionResult.fightResult.damage,
                attackType: submissionResult.fightResult.attackType
              });
            }

            // Log level status if available
            if (submissionResult.levelStatus) {
              console.log('🏆 Level status:', {
                isCompleted: submissionResult.levelStatus.isCompleted,
                battleWon: submissionResult.levelStatus.battleWon,
                battleLost: submissionResult.levelStatus.battleLost,
                canProceed: submissionResult.levelStatus.canProceed
              });
            }

            // Set correct answer reference for other components
            if (setCorrectAnswerRef && setCorrectAnswerRef.current) {
              setCorrectAnswerRef.current(isCorrect);
            }
          } else {
            console.error('❌ No submission result found in updated game state');
            setBorderColor('red');
          }
        } else {
          // Handle submission error
          console.error('❌ Failed to submit answer:', result.error);
          setBorderColor('red');
          
          // Set error state
          if (setCorrectAnswerRef && setCorrectAnswerRef.current) {
            setCorrectAnswerRef.current(false);
          }
        }
      } catch (error) {
        const isCorrect = checkAnswer(currentQuestion, actualAnswers); 
        setBorderColor(isCorrect ? 'green' : 'red');
        
        if (isCorrect && onCorrectAnswer) {
          onCorrectAnswer();
        }
        
        if (setCorrectAnswerRef && setCorrectAnswerRef.current) {
          setCorrectAnswerRef.current(isCorrect);
        }
      }
    } else {
      // Fallback to local checking if no submit function provided
      const isCorrect = checkAnswer(currentQuestion, selectedAnswers);
      setBorderColor(isCorrect ? 'green' : 'red');
      
      // NEW: Automatically switch to Output tab on correct answer (local mode)
      if (isCorrect && onCorrectAnswer) {
        onCorrectAnswer();
      }
      
      if (setCorrectAnswerRef && setCorrectAnswerRef.current) {
        setCorrectAnswerRef.current(isCorrect);
      }
    }
  };
};