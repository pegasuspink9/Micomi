import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const CodeEditor = ({
  currentQuestion,
  selectedAnswers,
  getBlankIndex,
  scrollViewRef,
  blankRefs,
  renderSyntaxHighlightedLine
}) => {
  const [activeTab, setActiveTab] = useState('output'); 
  const codeText = currentQuestion.question || '';
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

        {/* Segmented tabs (Output / Expected Output) */}
        <View style={styles.tabsWrapper}>
          <Pressable
            onPress={() => setActiveTab('output')}
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'output' ? styles.tabActive : null,
              pressed ? styles.tabPressed : null
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'output' }}
            accessibilityLabel="Show output"
          >
            <Text style={[styles.tabText, activeTab === 'output' ? styles.tabTextActive : null]}>
              Output
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('expected')}
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'expected' ? styles.tabActive : null,
              pressed ? styles.tabPressed : null
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'expected' }}
            accessibilityLabel="Show expected output"
          >
            <Text style={[styles.tabText, activeTab === 'expected' ? styles.tabTextActive : null]}>
              Expected Output
            </Text>
          </Pressable>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Code Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.codeContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
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
      </ScrollView>
    </View>
  );
};

// Styles kept within the component
const styles = StyleSheet.create({
  editorContainer: {
    backgroundColor: '#1e1e1e32',
    borderRadius: 12,
    flex: 1,
    width: '100%',
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
    color: '#ffffffae',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 12,
    fontFamily: 'DynaPuff',
  },

  tabsWrapper: {
    flexDirection: 'row',
    marginLeft: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },

  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#404245',
  },

  tabActive: {
    backgroundColor: '#0e639c',
    borderColor: '#1177bb',
  },

  tabPressed: {
    opacity: 0.85,
  },

  tabText: {
    color: '#d1d5d9',
    fontSize: SCREEN_WIDTH * 0.025,
    fontFamily: 'DynaPuff',
    fontWeight: '500',
  },

  tabTextActive: {
    color: '#ffffff',
    fontFamily: 'DynaPuff',
  },

  headerSpacer: {
    flex: 1,
  },

  codeContainer: {
    backgroundColor: '#000d2f99',
    paddingVertical: 12,
    maxHeight: SCREEN_HEIGHT * 0.30,

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

  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 20,
    paddingVertical: 2,
  },

  lineNumberContainer: {
    minWidth: 50,
    alignItems: 'center',

    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    borderLeftWidth: 1,
    borderLeftColor: '#2a2a2a',

    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  lineNumber: {
    color: '#ffffff7e',
    fontSize: SCREEN_WIDTH * 0.032,
    fontFamily: 'monospace',
    fontWeight: '400',
  },

  lineContent: {
    flex: 1,
    paddingHorizontal: 12
    
  },

  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default CodeEditor;
