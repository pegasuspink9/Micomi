import React from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const secondGrid = {
    backgroundColor: 'rgba(12, 21, 103, 1)',
};

export default function GameQuestions({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex 
}) {
  
  // Function to render code with blanks (with special code styling)
  const renderCodeWithBlanks = () => {
    const codeText = currentQuestion.question;
    const lines = codeText.split('\n');
    
    return (
      <View style={styles.editorContainer}>
        {/* Editor Header */}
        <View style={styles.editorHeader}>
          <View style={styles.windowControls}>
            <View style={[styles.windowButton, { backgroundColor: '#ff5f56' }]} />
            <View style={[styles.windowButton, { backgroundColor: '#ffbd2e' }]} />
            <View style={[styles.windowButton, { backgroundColor: '#27ca3f' }]} />
          </View>
          <Text style={styles.fileName}>index.html</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Code Content */}
        <View style={styles.codeContainer}>
          {lines.map((line, lineIndex) => (
            <View key={lineIndex} style={styles.codeLine}>
              {/* Line Number */}
              <View style={styles.lineNumberContainer}>
                <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
              </View>
              
              {/* Code Content */}
              <View style={styles.lineContent}>
                {renderSyntaxHighlightedLine(line, lineIndex)}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSyntaxHighlightedLine = (line, lineIndex) => {
    const parts = line.split('_');
    
    return (
      <Text style={styles.codeText}>
        {parts.map((part, partIndex) => (
          <React.Fragment key={partIndex}>
            {renderHighlightedText(part)}
            {partIndex < parts.length - 1 && (
              <View style={styles.codeBlankContainer}>
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

  // Function to highlight HTML syntax
  const renderHighlightedText = (text) => {
    // HTML syntax highlighting patterns
    const htmlPatterns = [
      { pattern: /(<\/?[^>]+>)/g, style: styles.htmlTag },
      { pattern: /(<!DOCTYPE[^>]*>)/g, style: styles.doctype },
      { pattern: /(\w+)(?==)/g, style: styles.attribute },
      { pattern: /(".*?")/g, style: styles.string },
      { pattern: /(=)/g, style: styles.operator },
    ];
    
    let segments = [{ text, style: styles.defaultText }];
    
    htmlPatterns.forEach(({ pattern, style }) => {
      segments = segments.flatMap(segment => {
        if (segment.style === styles.defaultText) {
          return segment.text.split(pattern).map((part, index) => ({
            text: part,
            style: pattern.test(part) ? style : styles.defaultText
          }));
        }
        return segment;
      });
    });
    
    return segments.map((segment, index) => (
      <Text key={index} style={segment.style}>
        {segment.text}
      </Text>
    ));
  };

  const getDynamicQuestionText = () => {
    const questionText = currentQuestion.question;
    const parts = questionText.split('_');
    
    return (
      <Text style={styles.gridText}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <View style={[styles.blankContainer]}>
                <Text style={styles.blankStyle}>
                  {selectedAnswers[index] || ''}
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
          {currentQuestion.questionType === 'code-blanks' ? renderCodeWithBlanks() : getDynamicQuestionText()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  secondGrid: {
    flexShrink: 1,
    maxHeight: SCREEN_HEIGHT * 0.28,
    backgroundColor: secondGrid.backgroundColor,
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
  
  gridText: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: 'bold',
    color: '#fff',
    padding: SCREEN_WIDTH * 0.05,
  },
  
  blankContainer: {
    position: 'absolute',
    textDecorationLine: 'underline',
    textDecorationColor: '#f39c12',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SCREEN_WIDTH * 0.01,
    marginTop: SCREEN_HEIGHT * 0.01,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: SCREEN_WIDTH * 0.01,
  },
  
  blankStyle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
    color: '#f39c12',
    fontFamily: 'monospace',
  },

  // Editor Styles
  editorContainer: {
    backgroundColor: '#1e1e1eff',
    borderRadius: 8,
    margin: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3c3c3c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  
  editorHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3c',
  },
  
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  windowButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  
  fileName: {
    color: '#cccccc',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 12,
    fontFamily: 'monospace',
  },
  
  headerSpacer: {
    flex: 1,
  },
  
  codeContainer: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 12,
    flex: 1,
  },
  
  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 20,
    paddingVertical: 2,
  },
  
  lineNumberContainer: {
    backgroundColor: '#252526',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: '#3c3c3c',
    minWidth: 50,
    alignItems: 'center',
  },
  
  lineNumber: {
    color: '#858585',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '400',
  },
  
  lineContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  
  codeText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  
  // Syntax Highlighting Colors
  htmlTag: {
    color: '#569cd6',
    fontFamily: 'monospace',
  },
  
  doctype: {
    color: '#808080',
    fontFamily: 'monospace',
  },
  
  attribute: {
    color: '#9cdcfe',
    fontFamily: 'monospace',
  },
  
  string: {
    color: '#ce9178',
    fontFamily: 'monospace',
  },
  
  operator: {
    color: '#d4d4d4',
    fontFamily: 'monospace',
  },
  
  defaultText: {
    color: '#d4d4d4',
    fontFamily: 'monospace',
  },
  
  codeBlankContainer: {
    backgroundColor: '#0e639c',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#1177bb',
    minWidth: 60,
  },
  
  codeBlankText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});