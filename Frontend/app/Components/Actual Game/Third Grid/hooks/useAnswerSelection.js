import { Alert } from 'react-native';
import { getMaxAnswers, canSelectAnswer } from '../utils/answerLogic';

const useAnswerSelection = (currentQuestion, selectedAnswers, setSelectedAnswers) => {
  const maxAnswers = getMaxAnswers(currentQuestion);

  const handleAnswerSelect = (answer) => {
    if (!canSelectAnswer(selectedAnswers, answer, maxAnswers)) {
      Alert.alert('Selection Limit', `You can only select ${maxAnswers} answer(s)`);
      return;
    }

    setSelectedAnswers(prev => {
      if (prev.includes(answer)) {
        return prev.filter(item => item !== answer);
      } else {
        const newAnswers = [...prev, answer];
        
        setTimeout(() => {
          // Any additional logic after selection
        }, 100);
        
        return newAnswers;
      }
    });
  };

  return {
    maxAnswers,
    handleAnswerSelect
  };
};

export default useAnswerSelection;