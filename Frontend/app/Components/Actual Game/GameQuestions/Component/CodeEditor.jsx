import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable, Keyboard } from 'react-native';
import Output from '../Output/Output';
import ExpectedOutput from '../Output/ExpectedOutput';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const CodeEditor = ({
  currentQuestion,
  selectedAnswers,
  getBlankIndex,
  scrollViewRef,
  blankRefs,
  renderSyntaxHighlightedLine,
  userOutput = "",
  expectedOutput = "",
  isCorrect = null,
  onTabChange,
  activeTab: externalActiveTab
}) => {
  const [activeTab, setActiveTab] = useState('code');
  const codeText = currentQuestion.question || '';
  const lines = codeText.split('\n');

  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
      if (externalActiveTab === 'output' || externalActiveTab === 'expected') {
        Keyboard.dismiss();
      }
    }
  }, [externalActiveTab]);

  const handleTabChange = (tabName) => {
    if (tabName === 'output' || tabName === 'expected') {
      Keyboard.dismiss();
    }
    setActiveTab(tabName);
    
    if (onTabChange) {
      onTabChange(tabName);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'code':
        return (
          <ScrollView
            ref={scrollViewRef}
            style={styles.codeContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {lines.map((line, lineIndex) => (
              <View key={lineIndex} style={styles.codeLine}>
                <View style={styles.lineNumberContainer}>
                  <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
                </View>
                <View style={styles.lineContent}>
                  {renderSyntaxHighlightedLine(line, lineIndex)}
                </View>
              </View>
            ))}
          </ScrollView>
        );

      case 'output':
        return (
          <View style={styles.outputContainer}>
            <Output 
              currentQuestion={currentQuestion}
              selectedAnswers={selectedAnswers}
              actualResult={userOutput}
              isCorrect={isCorrect}
              showLiveHTML={true}
              style={styles.tabOutput}
           />
          </View>
        );

      case 'expected':
        return (
          <View style={styles.outputContainer}>
            <ExpectedOutput 
              currentQuestion={currentQuestion}
              style={styles.tabOutput}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.editorContainer}>
      <View style={styles.editorHeader}>
        <View style={styles.windowControls}>
          <View style={[styles.windowButton, { backgroundColor: '#ff5f56' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#ffbd2e' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#27ca3f' }]} />
        </View>

        {/* Updated Web-like Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => handleTabChange('code')}
            style={[
              styles.webTab,
              activeTab === 'code' && styles.webTabActive,
              styles.webTabFirst
            ]}
          >
            <Text style={[
              styles.webTabText, 
              activeTab === 'code' && styles.webTabTextActive
            ]}>
              index.html
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange('output')}
            style={[
              styles.webTab,
              activeTab === 'output' && styles.webTabActive
            ]}
          >
            <Text style={[
              styles.webTabText, 
              activeTab === 'output' && styles.webTabTextActive
            ]}>
              Output
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange('expected')}
            style={[
              styles.webTab,
              activeTab === 'expected' && styles.webTabActive,
              styles.webTabLast
            ]}
          >
            <Text style={[
              styles.webTabText, 
              activeTab === 'expected' && styles.webTabTextActive
            ]}>
              Expected Output
            </Text>
          </Pressable>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Content with seamless connection */}
      <View style={styles.contentArea}>
        {renderTabContent()}
      </View>
    </View>
  );
};

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
    alignItems: 'flex-end', // Align tabs to bottom of header
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 0, // Remove bottom padding for seamless tabs
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
    marginBottom: 8, // Add space from tabs
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

  // Web-like Tab Container
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 12,
    height: 32, // Fixed height for tabs
  },

  // Web-like Tab Styles
  webTab: {
    backgroundColor: '#3c3c3c',
    paddingHorizontal: 5,
    paddingVertical: 8,
    marginRight: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderRightColor: '#555',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for inactive tabs
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  
  webTabActive: {
    backgroundColor: '#000d2f99', // Match content background
    borderTopColor: '#1177bb',
    borderLeftColor: '#1177bb',
    borderRightColor: '#1177bb',
    // Remove shadow for active tab
    shadowOpacity: 0,
    elevation: 3,
    zIndex: 10,
    // Make active tab slightly taller
    marginBottom: -2,
  },

  webTabFirst: {
    marginLeft: 0,
  },

  webTabLast: {
    marginRight: 0,
  },

  webTabText: {
    color: '#d1d5d9',
    fontSize: SCREEN_WIDTH * 0.025,
    fontFamily: 'DynaPuff',
    fontWeight: '500',
  },

  webTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  headerSpacer: {
    flex: 1,
  },

  // Content area with seamless connection to active tab
  contentArea: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },

  codeContainer: {
    backgroundColor: '#000d2f99',
    paddingVertical: 12,
    maxHeight: SCREEN_HEIGHT * 0.30,
    borderTopWidth: 0, // Remove top border for seamless connection
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
    paddingHorizontal: 12,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  outputContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.30,
  },
  outputHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  outputTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  outputContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  outputScrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  browserViewport: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  outputText: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
    fontFamily: 'System',
  },
});

export default CodeEditor;