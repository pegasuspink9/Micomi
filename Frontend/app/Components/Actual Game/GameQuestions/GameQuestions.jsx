import React, { useRef, useEffect, useState } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Pressable} from 'react-native';
import CodeEditor from './Component/CodeEditor';
import DocumentQuestion from './Component/DocumentQuestion';
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
  onBlankPress
}) => {
  const scrollViewRef = useRef(null);
  const blankRefs = useRef({});
  const options = currentQuestion?.options || [];

  
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

  const displayQuestion = isAnswerCorrect 
    ? getFilledQuestion(currentQuestion?.question, currentQuestion?.correctAnswer) 
    : currentQuestion?.question;

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

  const handleTabChange = (tabName) => {
    if (onTabChange) {
      onTabChange(tabName);
    }
  };

const renderSyntaxHighlightedLine = (line, lineIndex) => {
  if (!line || typeof line !== 'string') {
    return <Text style={styles.codeText}></Text>;
  }

  const parts = line.split('_');
  // Removed localBlankIndex variable as partIndex is sufficient and safer
  
  const blanksBeforeCurrent = calculateGlobalBlankIndex(currentQuestion, lineIndex);
  
  return (
    //  CHANGED: Use View with row layout instead of Text to fix touch handling
    <View style={styles.codeLineContainer}>
      {parts.map((part, partIndex) => (
        <React.Fragment key={partIndex}>
            {/* Wrap text parts in Text component to apply styles */}
            {part ? <Text style={styles.codeText}>{renderHighlightedText(part)}</Text> : null}
            
            {partIndex < parts.length - 1 && (
              <Pressable 
                key={`blank-${blanksBeforeCurrent + partIndex}`}
                onPress={(e) => {
                  e.stopPropagation();
                  soundManager.playBlankTapSound(1.0);
                  if (onBlankPress) onBlankPress(blanksBeforeCurrent + partIndex);
                }}
                ref={(ref) => {
                  if (ref) {
                    const globalIndex = blanksBeforeCurrent + partIndex;
                    blankRefs.current[globalIndex] = ref;
                  }
                }}
                //  Keep hitSlop for better usability
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                style={[
                  styles.codeBlankContainer,
                  (blanksBeforeCurrent + partIndex) === selectedBlankIndex && styles.currentBlank
                ]}
              >
                <Text style={styles.codeBlankText}>
                {selectedAnswers?.[blanksBeforeCurrent + partIndex] != null
                  ? options?.[selectedAnswers[blanksBeforeCurrent + partIndex]] || '_'
                  : '_'}
              </Text>
              </Pressable>
            )}
        </React.Fragment>
      ))}
    </View>
  );
};

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
        {(currentQuestion.challenge_type === 'fill in the blank' || 
          currentQuestion.challenge_type === 'code with guide' || 
          currentQuestion.challenge_type === 'multiple choice') ? (
          <CodeEditor 
            currentQuestion={{
              ...currentQuestion,
              question: displayQuestion // MODIFIED: Pass the appropriate question text
            }}
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
            currentQuestion={{
              ...currentQuestion,
              question: displayQuestion // MODIFIED: Pass the appropriate question text
            }}
            selectedAnswers={selectedAnswers}
          />
        )}
      </View>
    </View>
  );
};

export default React.memo(GameQuestions, (prevProps, nextProps) => {
  // Custom comparison: Only rerender if props relevant to thirdGrid or CodeEditor change
  return (
    prevProps.currentQuestion?.id === nextProps.currentQuestion?.id &&
    JSON.stringify(prevProps.selectedAnswers) === JSON.stringify(nextProps.selectedAnswers) &&
    prevProps.activeTab === nextProps.activeTab && // Include to allow CodeEditor tab updates
    prevProps.isAnswerCorrect === nextProps.isAnswerCorrect &&
    prevProps.selectedBlankIndex === nextProps.selectedBlankIndex &&
    prevProps.onTabChange === nextProps.onTabChange &&
    prevProps.onBlankPress === nextProps.onBlankPress &&
    prevProps.getBlankIndex === nextProps.getBlankIndex
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
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: gameScale(14),
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
    elevation: 6,
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
    elevation: 12,
  },
  codeBlankText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
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