import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const DocumentQuestion = ({ currentQuestion, selectedAnswers }) => {
  const questionText = currentQuestion.question;
  const parts = questionText.split('_');

  return (
    <View style={styles.documentContainer}>
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

// Styles kept within the component
const styles = StyleSheet.create({
  documentContainer: {
    backgroundColor: '#000000ff',
    borderRadius: SCREEN_WIDTH * 0.03,
    margin: SCREEN_WIDTH * 0.025,
    padding: SCREEN_WIDTH * 0.05,
    
    shadowColor: '#000',
    shadowOffset: { width: SCREEN_WIDTH * 0.02, height: SCREEN_WIDTH * 0.03 },
    shadowOpacity: 0.6,
    shadowRadius: SCREEN_WIDTH * 0.04,
    elevation: 25,
    
    borderTopWidth: 3,
    borderTopColor: '#ffffffb5', 
    borderLeftWidth: 3,
    borderLeftColor: '#ffffffb5', 
    borderBottomWidth: 8,
    borderBottomColor: '#ffffffb5', 
    borderRightWidth: 6,
    borderRightColor: '#ffffffb5', 
  },

  documentQuestion: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '500',
    color: '#ffffffff',
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'System', 
  },

  documentBlank: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    borderRadius: 4,
    borderBottomColor: '#1a73e8',
    minWidth: 80,
  },

  documentBlankText: {
    fontSize: SCREEN_WIDTH * 0.04,
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
    backgroundColor: '#ffffffff',
    marginBottom: 23,
  },
});

export default DocumentQuestion;