import React from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Image} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');



export default function GameQuestions({ 
  currentQuestion, 
  selectedAnswers, 
  getBlankIndex 
}) {
  
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
    <View style={styles.documentContainer}>

      {/* Paper lines background (optional) */}
      <View style={styles.paperLines}>
        {Array.from({ length: 10 }, (_, i) => (
          <View key={i} style={styles.paperLine} />
        ))}
      </View>

      {/* Question Content */}
      <Text style={styles.documentQuestion}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <View style={styles.documentBlank}>
                <Text style={styles.documentBlankText}>
                  {selectedAnswers[index] || '______'}
                </Text>
              </View>
            )}
          </React.Fragment>
        ))}
      </Text>
    </View>
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
  backgroundColor: '#1e1e1e',
  borderRadius: 12,
  margin: 5,
  overflow: 'hidden',
  
  borderTopWidth: 2,
  borderTopColor: '#4a4a4a',
  borderLeftWidth: 2,
  borderLeftColor: '#3a3a3a',
  borderBottomWidth: 4,
  borderBottomColor: '#0a0a0a',
  borderRightWidth: 3,
  borderRightColor: '#1a1a1a',
  
  shadowColor: '#000',
  shadowOffset: { width: 3, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 16,
  },

  
  editorHeader: {
  backgroundColor: '#2d2d30',
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 8,
  
  // 3D header effect
  borderBottomWidth: 2,
  borderBottomColor: '#1a1a1a',
  borderTopWidth: 1,
  borderTopColor: '#505050',
  
  // Header shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 8,
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
  
  // 3D button effect
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.3)',
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(0, 0, 0, 0.5)',
  
  // Button shadow
  shadowColor: '#000',
  shadowOffset: { width: 1, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 2,
  elevation: 4,
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
  
  // Inset effect for code area
  borderTopWidth: 1,
  borderTopColor: '#0a0a0a',
  borderLeftWidth: 1,
  borderLeftColor: '#0a0a0a',
  
  // Inner shadow effect
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 2,
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
  borderRightWidth: 2,
  borderRightColor: '#1a1a1a',
  minWidth: 50,
  alignItems: 'center',
  
  // 3D line number area
  borderTopWidth: 1,
  borderTopColor: '#3a3a3a',
  borderLeftWidth: 1,
  borderLeftColor: '#2a2a2a',
  
  // Line number shadow
  shadowColor: '#000',
  shadowOffset: { width: 1, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 3,
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
  borderRadius: 6,
  paddingHorizontal: 8,
  marginHorizontal: 2,
  minWidth: 60,
  
  // 3D blank effect
  borderTopWidth: 1,
  borderTopColor: '#4da6ff',
  borderLeftWidth: 1,
  borderLeftColor: '#1177bb',
  borderBottomWidth: 2,
  borderBottomColor: '#003d82',
  borderRightWidth: 2,
  borderRightColor: '#0066cc',
  
  // Blank shadow
  shadowColor: '#000',
  shadowOffset: { width: 1, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 3,
  elevation: 6,
  },
  
  codeBlankText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  documentContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    
    // Paper-like borders
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    borderBottomWidth: 2,
    borderBottomColor: '#d0d0d0',
    borderRightWidth: 2,
    borderRightColor: '#d0d0d0',
  },

  // Question text styling
  documentQuestion: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '500',
    color: '#202124',
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'System', 
  },

  // Blank styling for multiple choice
  documentBlank: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
    minWidth: 80,
    textAlign: 'center',
  },

  documentBlankText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: '#1a73e8',
    textAlign: 'center',
  },

  paperLines: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },

  paperLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 23,
  },
});