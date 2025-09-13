export const scrollToNextBlank = (scrollViewRef, blankRefs, currentQuestion, selectedAnswers) => {
  const totalBlanks = (currentQuestion.question.match(/_/g) || []).length;
  const currentBlankIndex = selectedAnswers.length;
  
  if (currentBlankIndex < totalBlanks && blankRefs.current[currentBlankIndex]) {
    blankRefs.current[currentBlankIndex].measureLayout(
      scrollViewRef.current,
      (x, y, width, height) => {
        scrollViewRef.current?.scrollTo({
          x: 0,
          y: y - 50, 
          animated: true
        });
      },
      () => {} 
    );
  }
};

export const calculateGlobalBlankIndex = (currentQuestion, lineIndex, partIndex) => {
  const linesBeforeCurrent = currentQuestion.question.split('\n').slice(0, lineIndex);
  return linesBeforeCurrent.join('').match(/_/g)?.length || 0;
};