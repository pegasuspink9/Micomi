import { Alert, Vibration } from 'react-native';
import { soundManager } from '../../Sounds/UniversalSoundManager'; 


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

export const createAnswerSelectHandler = (currentQuestion, selectedAnswers, setSelectedAnswers, selectedBlankIndex, setSelectedBlankIndex) => {
  const maxAnswers = getMaxAnswers(currentQuestion);
  const challengeType = currentQuestion.type || currentQuestion.challenge_type;
  
  return (index) => {
    setSelectedAnswers(prev => {
      let newArr = [...prev];
      if (newArr.length < maxAnswers) {
        const filled = new Array(maxAnswers).fill(null).map((_, i) => newArr[i] ?? null);
        newArr = filled;
      }

      if (challengeType === 'fill in the blank' || challengeType === 'code with guide') {
        
        const existingIndex = newArr.indexOf(index);

        if (existingIndex !== -1) {
          // Deselecting the answer.
          newArr[existingIndex] = null;
        } else {
          // Selecting the answer for the current blank.
          newArr[selectedBlankIndex] = index;
        }
        
        // --- UNIFIED INDEX UPDATE LOGIC ---
        if (setSelectedBlankIndex) {
            // 1. CHECK FOR EMPTY BOARD (User's Request)
            // After any change, if the board is now completely empty, reset the index to 0.
            const isNowEmpty = newArr.every(answer => answer === null);
            if (isNowEmpty) {
                setSelectedBlankIndex(0);
            } else if (existingIndex !== -1) {
                // 2. FOCUS ON DESELECTED BLANK
                // If we just deselected an answer, move the focus to that newly emptied blank.
                setSelectedBlankIndex(existingIndex);
            } else {
                // 3. AUTO-ADVANCE TO NEXT EMPTY BLANK
                // If we just selected an answer, find the next available blank to fill.
                let nextIndex = -1;
                for (let i = selectedBlankIndex + 1; i < maxAnswers; i++) {
                    if (newArr[i] === null) {
                        nextIndex = i;
                        break;
                    }
                }
                if (nextIndex === -1) { // Wrap around if not found
                    for (let i = 0; i < selectedBlankIndex; i++) {
                        if (newArr[i] === null) {
                            nextIndex = i;
                            break;
                        }
                    }
                }
                // If still not found, all blanks are full; default focus to the start.
                setSelectedBlankIndex(nextIndex !== -1 ? nextIndex : 0);
            }
        }

      } else {
        // ...existing multiple choice logic...
        const idx = newArr.indexOf(index);
        if (idx > -1) {
          newArr.splice(idx, 1);
        } else {
          if (newArr.filter(x => x !== null).length >= maxAnswers) {
            Alert.alert('Selection Limit', `You can only select ${maxAnswers} answer(s)`);
            return prev; 
          }
          const firstNull = newArr.indexOf(null);
          if (firstNull !== -1) newArr[firstNull] = index;
          else newArr.push(index);
        }
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
            const correctAudioUrl = submissionResult.isCorrectAudio;
            
            const onSoundStart = () => {
              setBorderColor(isCorrect ? 'green' : 'red');

              if (!isCorrect) {
                console.log('📳 VIBRATION ATTEMPTED - If your phone settings are correct, it should vibrate now.');
                Vibration.vibrate();
              }
            };


            soundManager.playUISound(correctAudioUrl, onSoundStart);
            
            
            if (isCorrect) {
              console.log('✅ Correct answer! Moving to next challenge.');
              
              if (onCorrectAnswer) {
                onCorrectAnswer();
              }
            } else {
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