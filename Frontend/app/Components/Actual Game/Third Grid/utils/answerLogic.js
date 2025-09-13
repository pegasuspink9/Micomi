import { Alert } from 'react-native';

export const getBlankCount = (questionText) => {
  const blanks = questionText.match(/_/g);
  return blanks ? blanks.length : 1;
};

export const getMaxAnswers = (currentQuestion) => {
  return currentQuestion.questionType === 'code-blanks' 
    ? (currentQuestion.question.match(/_/g) || []).length 
    : 1;
};

export const checkAnswer = (currentQuestion, selectedAnswers) => {
  let isCorrect = false;
  
  if (currentQuestion.questionType === 'code-blanks') {
    const correctAnswers = Array.isArray(currentQuestion.answer) 
      ? currentQuestion.answer 
      : [currentQuestion.answer];
    
    isCorrect = correctAnswers.every((answer, index) => 
      selectedAnswers[index] === answer
    ) && selectedAnswers.length === correctAnswers.length;
  } else {
    isCorrect = selectedAnswers.includes(currentQuestion.answer);
  }
  
  return isCorrect;
};

export const canSelectAnswer = (selectedAnswers, answer, maxAnswers) => {
  if (selectedAnswers.includes(answer)) {
    return true; 
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
      if (prev.includes(answer)) {
        return prev.filter(item => item !== answer);
      } else {
        return [...prev, answer];
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
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
    }
  };
};

// ENHANCED: Manual submission with correct answer notification
export const createCheckAnswerHandler = (
  currentQuestion, 
  selectedAnswers, 
  setBorderColor, 
  animateToPosition,
  isTimeExpired = false,
  hasShownOutput = false,
  setHasShownOutput = null,
  setCorrectAnswerRef = null // NEW: Reference to setCorrectAnswer function
) => {
  return () => {
    // Prevent manual submission if time already expired
    if (isTimeExpired) {
      console.log('❌ Cannot submit - Timer has expired');
      return;
    }

    const isCorrect = checkAnswer(currentQuestion, selectedAnswers);
    console.log('🎯 Manual submission:', { isCorrect, selectedAnswers });

    // NEW: Notify enemy system about correct answer state
    if (setCorrectAnswerRef?.current) {
      setCorrectAnswerRef.current(isCorrect);
    }

    if (isCorrect) {
      setBorderColor('#34c759'); 
      console.log('✅ Correct answer submitted manually');
      
      // Auto-show output only if not shown yet and it's a code-blanks question
      if (!hasShownOutput && currentQuestion.questionType === 'code-blanks' && setHasShownOutput) {
        console.log('📺 Auto-showing output for correct manual answer');
        setHasShownOutput(true);
        setTimeout(() => {
          animateToPosition(true); // Show drawer/output automatically
        }, 100);
      }
      
    } else {
      setBorderColor('#ff3b30'); 
      console.log('❌ Wrong answer submitted manually - no output');
      
      // Reset border color but don't show output
      setTimeout(() => {
        setBorderColor('rgba(37, 144, 197, 1)');
      }, 2000);
    }
  };
};