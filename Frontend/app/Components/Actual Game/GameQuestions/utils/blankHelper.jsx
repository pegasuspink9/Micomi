export const scrollToNextBlank = (scrollViewRef, blankRefs, currentQuestion, selectedAnswers, selectedBlankIndex) => {
  if (!scrollViewRef?.current || !blankRefs?.current) {
    return;
  }

  // ✅ CHANGED: Use selectedBlankIndex instead of selectedAnswers.length
  const nextBlankRef = blankRefs.current[selectedBlankIndex];
  
  if (!nextBlankRef) {
    console.warn(`Blank ref not found for index: ${selectedBlankIndex}`);
    return;
  }

  // Add a small delay to ensure the ref is properly attached
  setTimeout(() => {
    try {
      if (nextBlankRef && scrollViewRef.current) {
        nextBlankRef.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            scrollViewRef.current?.scrollTo({
              x: 0,
              y: Math.max(0, y - 100), // ✅ Increased offset for better visibility
              animated: true,
            });
          },
          (error) => {
            console.warn('Blank scroll measurement failed:', error);
          }
        );
      }
    } catch (error) {
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