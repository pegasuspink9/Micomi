export const scrollToNextBlank = (scrollViewRef, blankRefs, currentQuestion, selectedAnswers) => {
  if (!scrollViewRef?.current || !blankRefs?.current) {
    return;
  }

  const nextBlankIndex = selectedAnswers?.length || 0;
  const nextBlankRef = blankRefs.current[nextBlankIndex];
  
  if (!nextBlankRef) {
    return;
  }

  // Add a small delay to ensure the ref is properly attached
  setTimeout(() => {
    try {
      // Check if the ref is still valid and attached to a native component
      if (nextBlankRef && scrollViewRef.current) {
        nextBlankRef.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            scrollViewRef.current?.scrollTo({
              x: 0,
              y: Math.max(0, y - 50),
              animated: true,
            });
          },
          (error) => {
            // Silently handle measurement errors
            console.warn('Blank scroll measurement failed:', error);
          }
        );
      }
    } catch (error) {
      // Silently handle any measurement errors
      console.warn('Blank scroll error:', error);
    }
  }, 100);
};

export const calculateGlobalBlankIndex = (currentQuestion, lineIndex) => {
  if (!currentQuestion?.question) {
    return 0;
  }

  let blankIndex = 0;
  const lines = currentQuestion.question.split('\n');
  
  for (let i = 0; i < lineIndex && i < lines.length; i++) {
    const blanks = lines[i].match(/_/g);
    blankIndex += blanks ? blanks.length : 0;
  }
  
  return blankIndex;
};