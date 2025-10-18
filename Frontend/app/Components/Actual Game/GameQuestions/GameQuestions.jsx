import React, { useRef, useEffect, useState } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import CodeEditor from './Component/CodeEditor';
import DocumentQuestion from './Component/DocumentQuestion';
import { renderHighlightedText } from './utils/syntaxHighligther';
import { scrollToNextBlank, calculateGlobalBlankIndex } from './utils/blankHelper';
import { scale, RESPONSIVE } from '../../Responsiveness/gameResponsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameQuestions({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex,
  onTabChange,
  activeTab
}) {
  const scrollViewRef = useRef(null);
  const blankRefs = useRef({});
  const options = currentQuestion?.options || [];

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
    let localBlankIndex = 0;
    
    const blanksBeforeCurrent = calculateGlobalBlankIndex(currentQuestion, lineIndex);
    const currentBlankIndex = selectedAnswers?.length || 0; // ✅ Current blank to highlight
    
    return (
      <Text style={styles.codeText}>
        {parts.map((part, partIndex) => (
          <React.Fragment key={partIndex}>
            {renderHighlightedText(part)}
            {partIndex < parts.length - 1 && (
              <View 
                ref={(ref) => {
                  if (ref) {
                    const globalIndex = blanksBeforeCurrent + localBlankIndex;
                    blankRefs.current[globalIndex] = ref;
                  }
                }}
                style={[
                  styles.codeBlankContainer,
                  (blanksBeforeCurrent + localBlankIndex) === currentBlankIndex && styles.currentBlank
                ]}
              >
                <Text style={styles.codeBlankText}>
                {selectedAnswers?.[blanksBeforeCurrent + localBlankIndex] !== null && selectedAnswers?.[blanksBeforeCurrent + localBlankIndex] !== undefined
                  ? options?.[selectedAnswers[blanksBeforeCurrent + localBlankIndex]] || '_'
                  : '_'}
              </Text>
              </View>
            )}
            {partIndex < parts.length - 2 && localBlankIndex++}
          </React.Fragment>
        ))}
      </Text>
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
            currentQuestion={currentQuestion}
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
            currentQuestion={currentQuestion}
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
  codeText: {
    lineHeight: SCREEN_HEIGHT * 0.03,
    fontFamily: 'monospace',
    fontSize: RESPONSIVE.fontSize.md, 
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
    fontSize: SCREEN_WIDTH * 0.03,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});