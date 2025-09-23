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
  
  return (answer) => {
    if (!canSelectAnswer(selectedAnswers, answer, maxAnswers)) {
      Alert.alert('Selection Limit', `You can only select ${maxAnswers} answer(s)`);
      return;
    }

    setSelectedAnswers(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      
      if (prevArray.includes(answer)) {
        return prevArray.filter(item => item !== answer);
      } else {
        return [...prevArray, answer];
      }
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

export const createCheckAnswerHandler = (
  currentQuestion,
  selectedAnswers,
  setBorderColor,
  animateToPosition,
  hasShownOutput,
  setHasShownOutput,
  setCorrectAnswerRef,
  submitAnswerFunction
) => {
  return async () => {
    if (!selectedAnswers || selectedAnswers.length === 0) {
      console.warn('No answers selected');
      return;
    }

    console.log('Checking answer:', { selectedAnswers, currentQuestion });
    
    // Submit answer to API
    if (submitAnswerFunction) {
      try {
        const result = await submitAnswerFunction(selectedAnswers);
        
        if (result.success) {
          const isCorrect = result.result?.isCorrect || false;
          
          if (isCorrect) {
            setBorderColor('green');
            console.log('Correct answer! Moving to next challenge.');
          } else {
            setBorderColor('red');
            console.log('Incorrect answer. Message:', result.result?.message);
          }

          // Show the output drawer
          if (!hasShownOutput) {
            setHasShownOutput(true);
            if (setCorrectAnswerRef.current) {
              setCorrectAnswerRef.current(isCorrect);
            }
            animateToPosition(true);
          }
        } else {
          // Handle submission error
          console.error('Failed to submit answer:', result.error);
          setBorderColor('red');
        }
      } catch (error) {
        console.error('Error during answer submission:', error);
        setBorderColor('red');
      }
    } else {
      // Fallback to local checking if no submit function provided
      const isCorrect = checkAnswer(currentQuestion, selectedAnswers);
      setBorderColor(isCorrect ? 'green' : 'red');
      
      if (!hasShownOutput) {
        setHasShownOutput(true);
        if (setCorrectAnswerRef.current) {
          setCorrectAnswerRef.current(isCorrect);
        }
        animateToPosition(true);
      }
    }
  };
};