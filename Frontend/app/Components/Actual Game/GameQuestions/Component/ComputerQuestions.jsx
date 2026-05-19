import React, { useMemo } from 'react';
import { Text, View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { soundManager } from '../../Sounds/UniversalSoundManager';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Available width for blank boxes (accounting for padding on both sides)
const AVAILABLE_WIDTH = SCREEN_WIDTH - gameScale(64);

const ComputerQuestions = ({
  parts,
  blanksBeforeCurrent,
  lineIndex,
  selectedAnswers,
  options,
  canProceed,
  isAnswerCorrect,
  correctAnswersList,
  selectedBlankIndex,
  onBlankPress,
  blankRefs,
  isComputerMap,
}) => {
  const textContent = parts.join('').trim();
  const blankCount = parts.length - 1;

  // Calculate dynamic width for each blank based on its content length
  const blankDimensions = useMemo(() => {
    if (blankCount <= 0) return [];

    const dimensions = [];
    // Measure each blank's content to determine relative widths
    const contentLengths = [];

    for (let i = 0; i < blankCount; i++) {
      const globalIdx = blanksBeforeCurrent + i;
      // Get the longest possible text: either selected answer, correct answer, or placeholder
      const selectedValue = selectedAnswers?.[globalIdx] != null
        ? options?.[selectedAnswers[globalIdx]] || '_'
        : null;
      const correctValue = correctAnswersList?.[globalIdx] || '';
      // Use the longest text to size the box
      const displayText = selectedValue || correctValue || '_';
      contentLengths.push(Math.max(displayText.length, 1));
    }

    // Total character length across all blanks
    const totalChars = contentLengths.reduce((sum, len) => sum + len, 0);
    // Gap between blanks
    const gapSize = gameScale(4);
    const totalGaps = (blankCount - 1) * gapSize;
    const usableWidth = AVAILABLE_WIDTH - totalGaps;

    // Minimum width per blank
    const minWidth = gameScale(40);
    // Maximum width per blank (don't let a single blank dominate)
    const maxWidth = usableWidth * 0.7;

    for (let i = 0; i < blankCount; i++) {
      // Proportional width based on content length
      let width = (contentLengths[i] / totalChars) * usableWidth;
      // Clamp to min/max
      width = Math.max(minWidth, Math.min(maxWidth, width));
      
      // Adjust height slightly for longer content
      const height = gameScale(42);

      dimensions.push({ width, height });
    }

    // If total exceeds available, scale down proportionally
    const totalWidth = dimensions.reduce((sum, d) => sum + d.width, 0);
    if (totalWidth > usableWidth) {
      const scale = usableWidth / totalWidth;
      dimensions.forEach(d => {
        d.width = Math.max(minWidth * 0.8, d.width * scale);
      });
    }

    return dimensions;
  }, [blankCount, blanksBeforeCurrent, selectedAnswers, options, correctAnswersList]);

  return (
    <View style={styles.codeLineContainerBookCol} key={`line-${lineIndex}`}>
      {textContent ? (
        <Text style={styles.codeTextBook}>{textContent}</Text>
      ) : null}

      {blankCount > 0 && (
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

            const dims = blankDimensions[partIndex] || {};

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
                  {
                    width: dims.width,
                    height: dims.height,
                    maxWidth: undefined, // Override the old maxWidth
                    minWidth: undefined, // Override the old minWidth
                  },
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
};

const styles = StyleSheet.create({
  codeLineContainerBookCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: gameScale(15),
  },
  blanksRowContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap', // Single row — no wrapping
    width: '100%',
    justifyContent: 'flex-start',
    gap: gameScale(4),
    marginTop: gameScale(8),
  },
  codeTextBook: {
    color: '#000000',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(20),
    marginBottom: gameScale(10),
  },
  codeBlankContainer: {
    backgroundColor: '#0e639c',
    borderRadius: gameScale(6),
    paddingHorizontal: gameScale(6),
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
  codeBlankBook: {
    backgroundColor: '#d6c8a1',
    borderColor: '#8b5a2b',
    borderWidth: gameScale(2),
    borderRadius: gameScale(4),
    shadowColor: '#4a331d',
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(8),
    shadowOpacity: 0.3,
    borderBottomWidth: gameScale(4),
    flexShrink: 1,
    flexGrow: 0,
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
  correctBlank: {
    backgroundColor: '#4caf50',
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
  codeBlankTextBook: {
    color: '#000000',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(20),
    textAlign: 'center',
  },
});

export default React.memo(ComputerQuestions);
