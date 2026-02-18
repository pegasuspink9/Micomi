import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Pressable} from 'react-native';
import CodeEditor from './Component/CodeEditor';
import DocumentQuestion from './Component/DocumentQuestion';
import ComputerEditor from './Component/ComputerEditor';
import { renderHighlightedText } from './utils/syntaxHighligther';
import { scrollToNextBlank, calculateGlobalBlankIndex } from './utils/blankHelper';
import { soundManager } from '../Sounds/UniversalSoundManager';
import { gameScale } from '../../Responsiveness/gameResponsive';

const GameQuestions = ({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex,
  onTabChange,
  activeTab,
  isAnswerCorrect, 
  selectedBlankIndex,
  onBlankPress,
  canProceed,
  submissionResult
}) => {
  const scrollViewRef = useRef(null);
  const blankRefs = useRef({});
  const options = currentQuestion?.options || [];

  const correctAnswersList = submissionResult?.correctAnswer || currentQuestion?.correctAnswer;

  const cumulativeBlankCounts = useMemo(() => {
    if (!currentQuestion?.question) return [];
    
    const lines = currentQuestion.question.split('\n');
    const counts = [];
    let runningTotal = 0;
    
    for (const line of lines) {
      counts.push(runningTotal);
      const blanks = (line.match(/_/g) || []).length;
      runningTotal += blanks;
    }
    return counts;
  }, [currentQuestion?.question]);

  
  const getFilledQuestion = (questionText, answers) => {
    if (!questionText || !Array.isArray(answers) || answers.length === 0) {
      return questionText;
    }
    const parts = questionText.split('_');
    if (parts.length <= 1) {
      return questionText;
    }
    let result = '';
    let answerIndex = 0;
    for (let i = 0; i < parts.length; i++) {
        result += parts[i];
        if (i < parts.length - 1) { 
            if (answerIndex < answers.length) {
                result += answers[answerIndex];
                answerIndex++;
            }
        }
    }
    return result;
  };

  const displayQuestion = useMemo(() => isAnswerCorrect 
    ? getFilledQuestion(currentQuestion?.question, currentQuestion?.correctAnswer) 
    : currentQuestion?.question, [isAnswerCorrect, currentQuestion?.question, currentQuestion?.correctAnswer, getFilledQuestion]);

  useEffect(() => {
    if (!currentQuestion) return;
    
    const challengeType = currentQuestion.challenge_type;
    if (challengeType === 'fill in the blank' || challengeType === 'code with guide') {
      const timeoutId = setTimeout(() => {
        scrollToNextBlank(scrollViewRef, blankRefs, currentQuestion, selectedAnswers, selectedBlankIndex);
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedAnswers, currentQuestion, selectedBlankIndex]);

  const handleTabChange = useCallback((tabName) => {
    if (onTabChange) {
      onTabChange(tabName);
    }
  }, [onTabChange]);

  const isComputerMap = currentQuestion?.map_name === 'Computer' || 
                        currentQuestion?.question_type?.toLowerCase() === 'computer';

const renderSyntaxHighlightedLine = useCallback((line, lineIndex) => {
  if (!line || typeof line !== 'string') {
    return <Text style={styles.codeText}></Text>;
  }

  const parts = line.split('_');
  // Use pre-calculated cumulative index instead of expensive O(N^2) search
  const blanksBeforeCurrent = cumulativeBlankCounts[lineIndex] || 0;
  
  return (
    <View style={styles.codeLineContainer}>
      {parts.map((part, partIndex) => {
        const globalBlankIndex = blanksBeforeCurrent + partIndex;
        const isLastPart = partIndex === parts.length - 1;

        // Determine blank state after submission feedback is shown
        let isWrong = false;
        let isCorrectBlank = false;
        
        // Optimization: Only compute feedback logic when actually needed
        if (canProceed && isAnswerCorrect === false && !isLastPart) {
          const selectedValueIndex = selectedAnswers[globalBlankIndex];
          const selectedValue = selectedValueIndex != null 
            ? options[selectedValueIndex] 
            : null;
          
          const correctValue = correctAnswersList?.[globalBlankIndex];
          
          if (selectedValue !== correctValue) {
            isWrong = true;
          } else if (selectedValue != null) {
            isCorrectBlank = true;
          }
        }

        return (
          <React.Fragment key={partIndex}>
            {part ? (
              <Text style={[styles.codeText, isComputerMap && styles.codeTextBook]}>
                {isComputerMap ? part : renderHighlightedText(part)}
              </Text>
            ) : null}
            
            {!isLastPart && (
              <Pressable 
                key={`blank-${globalBlankIndex}`}
                onPress={(e) => {
                  e.stopPropagation();
                  soundManager.playBlankTapSound(1.0);
                  if (onBlankPress) onBlankPress(globalBlankIndex);
                }}
                ref={(ref) => {
                  if (ref) {
                    blankRefs.current[globalBlankIndex] = ref;
                  }
                }}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                style={[
                  styles.codeBlankContainer,
                  globalBlankIndex === selectedBlankIndex && styles.currentBlank,
                  isCorrectBlank && styles.correctBlank,
                  isWrong && styles.wrongBlank,
                  isComputerMap && styles.codeBlankBook,
                  isComputerMap && globalBlankIndex === selectedBlankIndex && styles.currentBlankBook,
                ]}
              >
                <Text style={[styles.codeBlankText, isComputerMap && styles.codeBlankTextBook]}>
                  {selectedAnswers?.[globalBlankIndex] != null
                    ? options?.[selectedAnswers[globalBlankIndex]] || '_'
                    : '_'}
                </Text>
              </Pressable>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}, [cumulativeBlankCounts, canProceed, isAnswerCorrect, selectedAnswers, selectedBlankIndex, options, correctAnswersList, onBlankPress]);

  if (!currentQuestion) {
    return (
      <View style={styles.secondGrid}>
        <View style={styles.questionContainer}>
          <Text style={styles.errorText}>No question data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.secondGrid}>
      <View style={styles.questionContainer}>
        {isComputerMap ? (
            <ComputerEditor 
              key={currentQuestion.id} 
              currentQuestion={useMemo(() => ({
                ...currentQuestion,
                question: displayQuestion 
              }), [currentQuestion.id, displayQuestion])}
              selectedAnswers={selectedAnswers}
              getBlankIndex={getBlankIndex}
              scrollViewRef={scrollViewRef}
              blankRefs={blankRefs}
              renderSyntaxHighlightedLine={renderSyntaxHighlightedLine}
              onTabChange={handleTabChange}
              activeTab={activeTab}
            />
        ) : (currentQuestion.challenge_type === 'fill in the blank' || 
          currentQuestion.challenge_type === 'code with guide' || 
          currentQuestion.challenge_type === 'multiple choice') ? (
          <CodeEditor 
            key={currentQuestion.id} 
            // Only update currentQuestion reference when actual question data or correctness changes
            currentQuestion={useMemo(() => ({
              ...currentQuestion,
              question: displayQuestion 
            }), [currentQuestion.id, displayQuestion])}
            selectedAnswers={selectedAnswers}
            getBlankIndex={getBlankIndex}
            scrollViewRef={scrollViewRef}
            blankRefs={blankRefs}
            renderSyntaxHighlightedLine={renderSyntaxHighlightedLine}
            onTabChange={handleTabChange}
            activeTab={activeTab}
          />
        ) : (
          <DocumentQuestion 
            key={currentQuestion.id}
            currentQuestion={useMemo(() => ({
              ...currentQuestion,
              question: displayQuestion 
            }), [currentQuestion, displayQuestion])}
            selectedAnswers={selectedAnswers}
          />
        )}
      </View>
    </View>
  );
};

export default React.memo(GameQuestions, (prev, next) => {
  // Use faster reference or length checks instead of JSON.stringify for large arrays
  return (
    prev.currentQuestion?.id === next.currentQuestion?.id &&
    prev.activeTab === next.activeTab && 
    prev.isAnswerCorrect === next.isAnswerCorrect &&
    prev.canProceed === next.canProceed &&
    prev.selectedBlankIndex === next.selectedBlankIndex &&
    prev.selectedAnswers === next.selectedAnswers && // Reference equality for Redux/State updates
    prev.submissionResult === next.submissionResult
  );
});


const styles = StyleSheet.create({
  secondGrid: {
    flex: 1, 
    minHeight: 0, 
  },
  questionContainer: {
    flex: 1,
    width: '100%',
    minHeight: 0, 
    maxHeight: '100%',
  },
   codeLineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: gameScale(25),
  },
  codeText: {
    color: '#943232',
    fontFamily: 'monospace',
    fontSize: gameScale(14),
  },
  codeTextBook: {
    color: '#000000',
    fontFamily: 'DynaPuff', // Changed from GoldenAge
    fontSize: gameScale(20),
    marginBottom: gameScale(10),
  },
  codeBlankBook: {
    backgroundColor: '#d6c8a1',
    borderColor: '#8b5a2b',
    borderWidth: gameScale(2),
    borderRadius: gameScale(4),
    shadowColor: '#4a331d',
    paddingHorizontal: gameScale(15),
    paddingVertical: gameScale(15),
    shadowOpacity: 0.3,
    borderBottomWidth: gameScale(4),
  },
  currentBlankBook: {
    backgroundColor: '#ffecb3',
    borderColor: '#ff9800',
    shadowOpacity: 0.6,
    shadowRadius: gameScale(6),
  },
   codeBlankText: {
    color: '#ffffff', // Default for CodeEditor (Blue theme)
    fontFamily: 'DynaPuff',
    fontSize: gameScale(15),
    textAlign: 'center'
  },
  codeBlankTextBook: {
    color: '#000000', // Pure black for Computer map
    fontFamily: 'DynaPuff',
    fontSize: gameScale(20), // Increased to match question text better
  },
  codeBlankContainer: {
    backgroundColor: '#0e639c',
    borderRadius: gameScale(6),
    paddingHorizontal: gameScale(12),
    borderTopWidth: gameScale(1),
    borderTopColor: '#4da6ff',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#1177bb',
    borderBottomWidth: gameScale(2),
    borderBottomColor: '#003d82',
    borderRightWidth: gameScale(2),
    borderRightColor: '#0066cc',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(2) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(3),
    elevation: gameScale(6),
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentBlank: {
    backgroundColor: '#ff9500',
    borderTopColor: '#ffb84d',
    borderLeftColor: '#ff7f00',
    borderBottomColor: '#cc6600',
    borderRightColor: '#e68900',
    shadowColor: '#ff9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(8),
    elevation: gameScale(12),
  },
  wrongBlank: {
    backgroundColor: '#ff4d4d',
    borderTopColor: '#ff8080',
    borderLeftColor: '#ff1a1a',
    borderBottomColor: '#b30000',
    borderRightColor: '#e60000',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(8),
    elevation: gameScale(12),
  },
  correctBlank: {
    backgroundColor: '#4caf50', // Green
    borderTopColor: '#81c784',
    borderLeftColor: '#388e3c',
    borderBottomColor: '#1b5e20',
    borderRightColor: '#2e7d32',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(8),
    elevation: gameScale(12),
  },
  codeBlankText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: gameScale(13),
    textAlign: 'center'
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: gameScale(16),
    textAlign: 'center',
    margin: gameScale(20),
  },
});