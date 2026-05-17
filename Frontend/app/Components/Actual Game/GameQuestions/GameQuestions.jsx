import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Pressable} from 'react-native';
import CodeEditor from './Component/CodeEditor';
import DocumentQuestion from './Component/DocumentQuestion';
import ComputerEditor from './Component/ComputerEditor';
import { renderHighlightedText } from './utils/syntaxHighligther';
import { scrollToNextBlank, calculateGlobalBlankIndex, splitLineIntoBlanks, countBlanksInLine, parseQuestionBlanks } from './utils/blankHelper';
import { soundManager } from '../Sounds/UniversalSoundManager';
import { gameScale } from '../../Responsiveness/gameResponsive';

const GameQuestions = ({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex,
  onTabChange,
  activeTab,
  isPvpMode = false,
  isAnswerCorrect, 
  selectedBlankIndex,
  onBlankPress,
  canProceed,
  submissionResult,
  reviewGuide = null,
  showOutputInScreenPlay = false,
  onOutputToggle = null,
  showExpectedInScreenPlay = false,
  onExpectedToggle = null,
  previewMode = 'web',
  onPreviewModeToggle = null,
  isLevelCompletionModalVisible = false,
}) => {
  const scrollViewRef = useRef(null);
  const blankRefs = useRef({});
  const computerQuestionTemplateRef = useRef({});
  const lastUserScrollRef = useRef(0);
  const options = currentQuestion?.options || [];

  const currentChallengeId = useMemo(() => (
    currentQuestion?.challenge_id ?? currentQuestion?.id ?? null
  ), [currentQuestion?.challenge_id, currentQuestion?.id]);

  const isComputerMap = currentQuestion?.map_name === 'Computer' || 
                        currentQuestion?.question_type?.toLowerCase() === 'computer';

  const correctAnswersList = submissionResult?.correctAnswer || currentQuestion?.correctAnswer;

  // ✅ Smart blank parsing: excludes URLs, _blank, multi-underscores; clamps to answer count
  const parsedBlanks = useMemo(() => {
    if (!currentQuestion?.question) return { lineParts: [], totalBlanks: 0 };
    const answers = currentQuestion?.correctAnswer || null;
    return parseQuestionBlanks(currentQuestion.question, answers);
  }, [currentQuestion?.question, currentQuestion?.correctAnswer]);

  const cumulativeBlankCounts = useMemo(() => {
    const counts = [];
    let runningTotal = 0;
    for (const parts of parsedBlanks.lineParts) {
      counts.push(runningTotal);
      runningTotal += parts.length - 1;
    }
    return counts;
  }, [parsedBlanks]);

  const lineMeta = useMemo(() => {
    if (!currentQuestion?.question) {
      return [];
    }

    const lines = currentQuestion.question.split('\n');
    return lines.map((line, i) => {
      const parts = parsedBlanks.lineParts[i] || [line];
      return {
        line,
        parts,
        hasBlank: parts.length > 1,
      };
    });
  }, [currentQuestion?.question, parsedBlanks]);

  const blankLineIndexes = useMemo(() => (
    lineMeta.reduce((acc, meta, index) => {
      if (meta.hasBlank) {
        acc.push(index);
      }
      return acc;
    }, [])
  ), [lineMeta]);

  const highlightedLines = useMemo(() => {
    if (isComputerMap) {
      return [];
    }

    return lineMeta.map((meta) => (
      meta.hasBlank ? null : renderHighlightedText(meta.line)
    ));
  }, [isComputerMap, lineMeta]);

  
  const getFilledQuestion = (questionText, answers) => {
    if (!questionText || !Array.isArray(answers) || answers.length === 0) {
      return questionText;
    }
    // Use smart parsing to get the same blank positions used for rendering
    const { lineParts } = parseQuestionBlanks(questionText, answers);
    let answerIndex = 0;
    const filledLines = lineParts.map((parts) => {
      let lineResult = '';
      for (let i = 0; i < parts.length; i++) {
        lineResult += parts[i];
        if (i < parts.length - 1) {
          if (answerIndex < answers.length) {
            lineResult += answers[answerIndex];
            answerIndex++;
          }
        }
      }
      return lineResult;
    });
    return filledLines.join('\n');
  };

  useEffect(() => {
    if (!isComputerMap || !currentQuestion?.id || typeof currentQuestion?.question !== 'string') {
      return;
    }

    if (currentQuestion.question.includes('_')) {
      computerQuestionTemplateRef.current[currentQuestion.id] = currentQuestion.question;
    }
  }, [isComputerMap, currentQuestion?.id, currentQuestion?.question]);

  const displayQuestion = useMemo(() => {
    if (isComputerMap) {
      return computerQuestionTemplateRef.current[currentQuestion?.id] || currentQuestion?.question;
    }

    return isAnswerCorrect
      ? getFilledQuestion(currentQuestion?.question, currentQuestion?.correctAnswer)
      : currentQuestion?.question;
  }, [
    isComputerMap,
    isAnswerCorrect,
    currentQuestion?.id,
    currentQuestion?.question,
    currentQuestion?.correctAnswer,
    getFilledQuestion,
  ]);

  // FIX: Storing volatile data in a ref prevents unnecessary rerenders from hijacking the scroll view
  const latestDataRef = useRef({ currentQuestion, selectedAnswers });
  useEffect(() => {
    latestDataRef.current = { currentQuestion, selectedAnswers };
  }, [currentQuestion, selectedAnswers]);

  useEffect(() => {
    if (!currentChallengeId) return;
    
    const challengeType = currentQuestion?.challenge_type;
    if (challengeType === 'fill in the blank' || challengeType === 'code with guide') {
      const timeoutId = setTimeout(() => {
        if (Date.now() - lastUserScrollRef.current < 300) {
          return;
        }
        scrollToNextBlank(
          scrollViewRef, 
          blankRefs, 
          latestDataRef.current.currentQuestion, 
          latestDataRef.current.selectedAnswers, 
          selectedBlankIndex
        );
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
    // Only triggers scroll strictly on question swap or explicit blank change
  }, [currentChallengeId, selectedBlankIndex]);

  useEffect(() => {
    if (!currentChallengeId || activeTab !== 'code') {
      return;
    }

    const challengeType = currentQuestion?.challenge_type;
    if (challengeType === 'fill in the blank' || challengeType === 'code with guide') {
      const timeoutId = setTimeout(() => {
        scrollToNextBlank(
          scrollViewRef,
          blankRefs,
          latestDataRef.current.currentQuestion,
          latestDataRef.current.selectedAnswers,
          selectedBlankIndex
        );
      }, 120);

      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, currentChallengeId, selectedBlankIndex, currentQuestion?.challenge_type]);

  const handleUserScroll = useCallback(() => {
    lastUserScrollRef.current = Date.now();
  }, []);

  const handleTabChange = useCallback((tabName) => {
    if (onTabChange) {
      onTabChange(tabName);
    }
  }, [onTabChange]);

  const renderSyntaxHighlightedLine = useCallback((line, lineIndex) => {
    if (!line || typeof line !== 'string') {
      return <Text style={styles.codeText}></Text>;
    }
    const meta = lineMeta[lineIndex];
    const parts = meta?.parts || splitLineIntoBlanks(line);
    const blanksBeforeCurrent = cumulativeBlankCounts[lineIndex] || 0;

    // ✅ When answer is correct, render the filled line as plain text (no blank boxes)
    if (isAnswerCorrect && !isComputerMap) {
      return (
        <Text style={styles.codeLineTextWrapper}>
          <Text style={styles.codeText}>{renderHighlightedText(line)}</Text>
        </Text>
      );
    }

    if (!isComputerMap && !(meta?.hasBlank)) {
      const highlighted = highlightedLines[lineIndex];
      return (
        <Text style={styles.codeLineTextWrapper}>
          <Text style={styles.codeText}>{highlighted || line}</Text>
        </Text>
      );
    }

    if (isComputerMap) {
      const textContent = parts.join('').trim();
      
      return (
        <View style={styles.codeLineContainerBookCol} key={`line-${lineIndex}`}>
          {textContent ? (
            <Text style={styles.codeTextBook}>{textContent}</Text>
          ) : null}
          
          {parts.length > 1 && (
            <View style={styles.blanksRowContainer}>
              {parts.map((_, partIndex) => {
                const isLastPart = partIndex === parts.length - 1;
                if (isLastPart) return null; 
                
                const globalBlankIndex = blanksBeforeCurrent + partIndex;
                let isWrong = false;
                let isCorrectBlank = false;
                
                if ((canProceed && isAnswerCorrect === false) || (isAnswerCorrect && isComputerMap)) {
                  const selectedValueIndex = selectedAnswers[globalBlankIndex];
                  const selectedValue = selectedValueIndex != null ? options[selectedValueIndex] : null;
                  const correctValue = correctAnswersList?.[globalBlankIndex];
                  
                  if (selectedValue !== correctValue && !isAnswerCorrect) {
                    isWrong = true;
                  } else if (selectedValue != null || isAnswerCorrect) {
                    isCorrectBlank = true;
                  }
                }

                const valueToDisplay = isAnswerCorrect 
                  ? correctAnswersList?.[globalBlankIndex] 
                  : (selectedAnswers?.[globalBlankIndex] != null ? options?.[selectedAnswers[globalBlankIndex]] : '_');

                return (
                  <Pressable 
                    key={`blank-${globalBlankIndex}`}
                    onPress={(e) => {
                      e.stopPropagation();
                      soundManager.playBlankTapSound(1.0);
                      if (onBlankPress) onBlankPress(globalBlankIndex);
                    }}
                    ref={(ref) => {
                      if (ref) blankRefs.current[globalBlankIndex] = ref;
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    style={[
                      styles.codeBlankContainer,
                      styles.codeBlankBook,
                      globalBlankIndex === selectedBlankIndex && styles.currentBlankBook,
                      isCorrectBlank && styles.correctBlank,
                      isWrong && styles.wrongBlank,
                    ]}
                  >
                    <Text 
                      style={styles.codeBlankTextBook}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true} 
                      minimumFontScale={0.4}
                    >
                      {valueToDisplay}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      );
    }
    
    const renderedParts = parts.map((part, partIndex) => {
      const globalBlankIndex = blanksBeforeCurrent + partIndex;
      const isLastPart = partIndex === parts.length - 1;

      let isWrong = false;
      let isCorrectBlank = false;
      
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
            <React.Fragment>
              {!isComputerMap && <Text>{"\u200B"}</Text>}
              
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
                  !isComputerMap && {
                    transform: [{ translateY: gameScale(4) }],
                    maxWidth: '90%',
                  },
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

              {!isComputerMap && <Text>{"\u200B"}</Text>}
            </React.Fragment>
          )}
        </React.Fragment>
      );
    });

    if (isComputerMap) {
      return (
        <View style={styles.codeLineContainer}>
          {renderedParts}
        </View>
      );
    }

    return (
      <Text style={styles.codeLineTextWrapper}>
        {renderedParts}
      </Text>
    );
  }, [
    cumulativeBlankCounts,
    canProceed,
    isAnswerCorrect,
    selectedAnswers,
    selectedBlankIndex,
    options,
    correctAnswersList,
    onBlankPress,
    isComputerMap,
    highlightedLines,
    lineMeta,
  ]);

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
              isCorrect={isAnswerCorrect} 
              submissionResult={submissionResult}
              reviewGuide={reviewGuide}
              showOutputInScreenPlay={showOutputInScreenPlay}
              onOutputToggle={onOutputToggle}
              shouldDelayAnimation={isPvpMode}
            />
        ) : (currentQuestion.challenge_type === 'fill in the blank' || 
          currentQuestion.challenge_type === 'code with guide' || 
          currentQuestion.challenge_type === 'multiple choice') ? (
          <CodeEditor 
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
            isCorrect={isAnswerCorrect}
            submissionResult={submissionResult}
            reviewGuide={reviewGuide}
            showOutputInScreenPlay={showOutputInScreenPlay}
            onOutputToggle={onOutputToggle}
            showExpectedInScreenPlay={showExpectedInScreenPlay}
            onExpectedToggle={onExpectedToggle}
            previewMode={previewMode}
            onPreviewModeToggle={onPreviewModeToggle}
            blankLineIndexes={blankLineIndexes}
            onUserScroll={handleUserScroll}
            shouldDelayAnimation={isPvpMode}
            isLevelCompletionModalVisible={isLevelCompletionModalVisible}
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
  return (
    prev.currentQuestion?.id === next.currentQuestion?.id &&
    prev.activeTab === next.activeTab && 
    prev.isAnswerCorrect === next.isAnswerCorrect &&
    prev.canProceed === next.canProceed &&
    prev.selectedBlankIndex === next.selectedBlankIndex &&
    prev.selectedAnswers === next.selectedAnswers && 
    prev.submissionResult === next.submissionResult &&
    prev.reviewGuide === next.reviewGuide &&
    prev.showOutputInScreenPlay === next.showOutputInScreenPlay
    && prev.showExpectedInScreenPlay === next.showExpectedInScreenPlay
    && prev.previewMode === next.previewMode
    && prev.isLevelCompletionModalVisible === next.isLevelCompletionModalVisible
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
   codeLineContainerBookCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: gameScale(15), 
  },
  blanksRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
    gap: gameScale(2),
    marginTop: gameScale(8),
  },
  codeLineTextWrapper: {
    lineHeight: gameScale(25), 
    textAlignVertical: 'center',
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
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(12),
    shadowOpacity: 0.3,
    borderBottomWidth: gameScale(4),
    flexShrink: 1,
    flexGrow: 0,
    maxWidth: '48%',
    minWidth: gameScale(52),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: gameScale(4),
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
    paddingHorizontal: gameScale(10),
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