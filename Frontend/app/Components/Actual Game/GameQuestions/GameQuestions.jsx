import React, { useRef, useEffect, useState } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Pressable} from 'react-native';
import CodeEditor from './Component/CodeEditor';
import DocumentQuestion from './Component/DocumentQuestion';
import { renderHighlightedText } from './utils/syntaxHighligther';
import { scrollToNextBlank, calculateGlobalBlankIndex } from './utils/blankHelper';
import { scale, RESPONSIVE, scaleWidth, scaleHeight, wp, hp } from '../../Responsiveness/gameResponsive';


const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameQuestions({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex,
  onTabChange,
  activeTab,
  isAnswerCorrect, 
  selectedBlankIndex,
  onBlankPress
}) {
  const scrollViewRef = useRef(null);
  const blankRefs = useRef({});
  const options = currentQuestion?.options || [];

  // NEW: Determine which question to display
  const displayQuestion = isAnswerCorrect && currentQuestion?.expected_output 
    ? currentQuestion.expected_output 
    : currentQuestion?.question;

  useEffect(() => {
    if (!currentQuestion) return;
    
    const challengeType = currentQuestion.challenge_type;
    if (challengeType === 'fill in the blank' || challengeType === 'code with guide') {
      const timeoutId = setTimeout(() => {
        scrollToNextBlank(scrollViewRef, blankRefs, currentQuestion, selectedAnswers);
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedAnswers, currentQuestion]);

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
}

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
    minHeight: scale(25),
  },
  codeText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: RESPONSIVE.fontSize.md,
  },
  codeBlankContainer: {
    backgroundColor: '#0e639c',
    borderRadius: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#4da6ff',
    borderLeftWidth: 1,
    borderLeftColor: '#1177bb',
    borderBottomWidth: 2,
    borderBottomColor: '#003d82',
    borderRightWidth: 2,
    borderRightColor: '#0066cc',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 6,
    position: 'relative',
    // top: scale(3), // Adjusted alignment if needed
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
    shadowRadius: 8,
    elevation: 12,
  },
  codeBlankText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: scale(13),
    textAlign: 'center'
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});