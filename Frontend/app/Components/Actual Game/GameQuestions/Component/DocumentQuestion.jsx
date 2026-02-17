import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const DocumentQuestion = ({ currentQuestion, selectedAnswers }) => {
  const questionText = currentQuestion.question || '';
  const parts = questionText.split('_');

  return (
    <View style={styles.documentContainer}>
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
    borderRadius: gameScale(12),
    margin: gameScale(5), // Same margin as CodeEditor
    overflow: 'hidden',
    flex: 1,
    
    // Same border styling as CodeEditor
    borderTopWidth: gameScale(2),
    borderTopColor: '#4a4a4a',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#3a3a3a',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#0a0a0a',
    borderRightWidth: gameScale(3),
    borderRightColor: '#1a1a1a',
    
    // Same shadow as CodeEditor
    shadowColor: '#000',
    shadowOffset: { width: gameScale(3), height: gameScale(6) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(12),
    elevation: gameScale(16),
  },

  // Header matching CodeEditor's editorHeader
  documentHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(8),
    
    borderBottomWidth: gameScale(2),
    borderBottomColor: '#1a1a1a',
    borderTopWidth: gameScale(1),
    borderTopColor: '#505050',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: gameScale(8),
  },

  // Window controls matching CodeEditor
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  windowButton: {
    width: gameScale(12),
    height: gameScale(12),
    borderRadius: gameScale(6),
    marginRight: gameScale(8),
    
    borderTopWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: gameScale(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(2) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(2),
    elevation: gameScale(4),
  },
  
  fileName: {
    color: '#cccccc',
    fontSize: gameScale(13),
    fontWeight: '500',
    marginLeft: gameScale(12),
    fontFamily: 'monospace',
  },
  
  headerSpacer: {
    flex: 1,
  },

  // Content container similar to codeContainer
  contentContainer: {
    backgroundColor: '#000d2f99',
    paddingVertical: gameScale(12),
    paddingHorizontal: gameScale(16),
    minHeight: gameScale(844 * 0.15), // Minimum height for content
    
    borderTopWidth: gameScale(1),
    borderTopColor: '#0a0a0a',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#0a0a0a',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(-2) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(4),
    elevation: gameScale(2),
  },

  documentQuestion: {
    fontSize: gameScale(16),
    fontWeight: '400',
    color: '#cccccc', // Matching code editor text color
    lineHeight: gameScale(24),
    fontFamily: 'monospace', // Consistent with code editor
    zIndex: 1,
  },

  documentBlank: {
    backgroundColor: '#264f78', // VS Code selection color
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(2),
    borderRadius: gameScale(4),
    borderWidth: gameScale(1),
    borderColor: '#1a73e8',
    minWidth: gameScale(80),
    marginHorizontal: gameScale(4),
  },

  documentBlankText: {
    fontSize: gameScale(14),
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
    paddingTop: gameScale(12),
    paddingLeft: gameScale(16),
    opacity: 0.1,
  },

  paperLine: {
    height: gameScale(1),
    backgroundColor: '#cccccc',
    marginBottom: gameScale(23),
  },
});

export default DocumentQuestion;