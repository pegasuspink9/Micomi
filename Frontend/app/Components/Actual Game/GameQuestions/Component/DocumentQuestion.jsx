import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const DocumentQuestion = ({ currentQuestion, selectedAnswers }) => {
  const questionText = currentQuestion.question;
  const parts = questionText.split('_');

  return (
    <View style={styles.documentContainer}>
      {/* Document Header - similar to editor header */}
      <View style={styles.documentHeader}>
        <View style={styles.windowControls}>
          <View style={[styles.windowButton, { backgroundColor: '#ff5f56' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#ffbd2e' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#27ca3f' }]} />
        </View>
        <Text style={styles.fileName}>question.txt</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Document Content */}
      <View style={styles.contentContainer}>
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
    </View>
  );
};

// Styles matching CodeEditor's approach
const styles = StyleSheet.create({
  documentContainer: {
    backgroundColor: '#1e1e1e32',
    borderRadius: 12,
    margin: 5, // Same margin as CodeEditor
    overflow: 'hidden',
    
    // Same border styling as CodeEditor
    borderTopWidth: 2,
    borderTopColor: '#4a4a4a',
    borderLeftWidth: 2,
    borderLeftColor: '#3a3a3a',
    borderBottomWidth: 4,
    borderBottomColor: '#0a0a0a',
    borderRightWidth: 3,
    borderRightColor: '#1a1a1a',
    
    // Same shadow as CodeEditor
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
  },

  // Header matching CodeEditor's editorHeader
  documentHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#505050',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },

  // Window controls matching CodeEditor
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  windowButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    
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

  // Content container similar to codeContainer
  contentContainer: {
    backgroundColor: '#000d2f99',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: SCREEN_HEIGHT * 0.15, // Minimum height for content
    
    borderTopWidth: 1,
    borderTopColor: '#0a0a0a',
    borderLeftWidth: 1,
    borderLeftColor: '#0a0a0a',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  documentQuestion: {
    fontSize: 16,
    fontWeight: '400',
    color: '#cccccc', // Matching code editor text color
    lineHeight: 24,
    fontFamily: 'monospace', // Consistent with code editor
    zIndex: 1,
  },

  documentBlank: {
    backgroundColor: '#264f78', // VS Code selection color
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a73e8',
    minWidth: 80,
    marginHorizontal: 4,
  },

  documentBlankText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
  },

  paperLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingLeft: 16,
    opacity: 0.1,
  },

  paperLine: {
    height: 1,
    backgroundColor: '#cccccc',
    marginBottom: 23,
  },
});

export default DocumentQuestion;