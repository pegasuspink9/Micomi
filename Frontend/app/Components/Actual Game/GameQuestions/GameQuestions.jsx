import React, { useRef, useEffect } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import CodeEditor from './Component/CodeEditor';
import DocumentQuestion from './Component/DocumentQuestion';
import { renderHighlightedText } from './utils/syntaxHighligther';
import { scrollToNextBlank, calculateGlobalBlankIndex } from './utils/blankHelper';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameQuestions({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex 
}) {
  const scrollViewRef = useRef(null);
  const blankRefs = useRef({});

  useEffect(() => {
    if (currentQuestion.questionType === 'code-blanks') {
      scrollToNextBlank(scrollViewRef, blankRefs, currentQuestion, selectedAnswers);
    }
  }, [selectedAnswers]);

  const renderSyntaxHighlightedLine = (line, lineIndex) => {
    const parts = line.split('_');
    let blankIndex = 0;
    
    const blanksBeforeCurrent = calculateGlobalBlankIndex(currentQuestion, lineIndex);
    
    return (
      <Text style={styles.codeText}>
        {parts.map((part, partIndex) => (
          <React.Fragment key={partIndex}>
            {renderHighlightedText(part)}
            {partIndex < parts.length - 1 && (
              <View 
                ref={(ref) => {
                  if (ref) {
                    blankRefs.current[blanksBeforeCurrent + blankIndex] = ref;
                  }
                  blankIndex++;
                }}
                style={[
                  styles.codeBlankContainer,
                  blanksBeforeCurrent + blankIndex - 1 === selectedAnswers.length && styles.currentBlank
                ]}
              >
                <Text style={styles.codeBlankText}>
                  {selectedAnswers[getBlankIndex(lineIndex, partIndex)] || '_'}
                </Text>
              </View>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  return (
    <View style={styles.secondGrid}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.questionContainer}>
          {currentQuestion.questionType === 'code-blanks' ? (
            <CodeEditor 
              currentQuestion={currentQuestion}
              selectedAnswers={selectedAnswers}
              getBlankIndex={getBlankIndex}
              scrollViewRef={scrollViewRef}
              blankRefs={blankRefs}
              renderSyntaxHighlightedLine={renderSyntaxHighlightedLine}
            />
          ) : (
            <DocumentQuestion 
              currentQuestion={currentQuestion}
              selectedAnswers={selectedAnswers}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Main component styles
const styles = StyleSheet.create({
  secondGrid: {
    flexShrink: 1,
    maxHeight: SCREEN_HEIGHT * 0.28,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  questionContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.01,
    flex: 1,
    width: '100%',
    justifyContent: 'center', 
  },

  codeText: {
    fontSize: SCREEN_WIDTH * 0.035,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  
  codeBlankContainer: {
    backgroundColor: '#0e639c',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    
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
    fontSize: SCREEN_WIDTH * 0.035,
    textAlign: 'center',
  },
});