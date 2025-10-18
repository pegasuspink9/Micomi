import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Keyboard } from 'react-native';
import Output from '../Output/Output';
import ExpectedOutput from '../Output/ExpectedOutput';
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  scaleFont,
  RESPONSIVE 
} from '../../../Responsiveness/gameResponsive';

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
  
  // ✅ Memoize code text and lines
  const codeText = useMemo(() => currentQuestion.question || '', [currentQuestion.question]);
  const lines = useMemo(() => codeText.split('\n'), [codeText]);

  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
      if (externalActiveTab === 'output' || externalActiveTab === 'expected') {
        Keyboard.dismiss();
      }
    }
  }, [externalActiveTab, activeTab]);

  // ✅ Memoize tab change handler
  const handleTabChange = useCallback((tabName) => {
    if (tabName === 'output' || tabName === 'expected') {
      Keyboard.dismiss();
    }
    setActiveTab(tabName);
    
    if (onTabChange) {
      onTabChange(tabName);
    }
  }, [onTabChange]);


  const options = currentQuestion?.options || [];

  const renderTabContent = useCallback(() => {
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
              options={options}
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
  }, [activeTab, lines, renderSyntaxHighlightedLine, currentQuestion, selectedAnswers, userOutput, isCorrect, scrollViewRef]);

  // ✅ Memoize tab press handlers
  const handleCodeTabPress = useCallback(() => handleTabChange('code'), [handleTabChange]);
  const handleOutputTabPress = useCallback(() => handleTabChange('output'), [handleTabChange]);
  const handleExpectedTabPress = useCallback(() => handleTabChange('expected'), [handleTabChange]);

  return (
    <View style={styles.editorContainer}>
      <View style={styles.editorHeader}>
        <View style={styles.windowControls}>
          <View style={[styles.windowButton, { backgroundColor: '#ff5f56' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#ffbd2e' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#27ca3f' }]} />
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            onPress={handleCodeTabPress}
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
            onPress={handleOutputTabPress}
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
            onPress={handleExpectedTabPress}
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

      <View style={styles.contentArea}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  editorContainer: {
    backgroundColor: '#1e1e1e32',
    borderRadius: RESPONSIVE.borderRadius.lg, 
    flex: 1, 
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: scale(2), // ✅ Responsive
    borderTopColor: '#4a4a4a',
    borderLeftWidth: scale(2), // ✅ Responsive
    borderLeftColor: '#3a3a3a',
    borderBottomWidth: scale(4), // ✅ Responsive
    borderBottomColor: '#0a0a0a',
    borderRightWidth: scale(3), // ✅ Responsive
    borderRightColor: '#1a1a1a',
    ...RESPONSIVE.shadow.heavy, // ✅ Responsive shadow
    minHeight: 0, 
  },

  editorHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: RESPONSIVE.margin.md, // ✅ Responsive
    paddingTop: RESPONSIVE.margin.sm, // ✅ Responsive
    paddingBottom: 0,
    borderTopWidth: scale(1), // ✅ Responsive
    borderTopColor: '#505050',
    ...RESPONSIVE.shadow.medium, // ✅ Responsive shadow
  },

  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE.margin.sm, // ✅ Responsive
  },

  windowButton: {
    width: scale(12), // ✅ Responsive
    height: scale(12), // ✅ Responsive
    borderRadius: scale(6), // ✅ Responsive
    marginRight: RESPONSIVE.margin.sm, // ✅ Responsive
    borderTopWidth: scale(1), // ✅ Responsive
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: scale(1), // ✅ Responsive
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: scale(1), height: scale(2) }, // ✅ Responsive
    shadowOpacity: 0.4,
    shadowRadius: scale(2), // ✅ Responsive
    elevation: 4,
  },

  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: RESPONSIVE.margin.md, // ✅ Responsive
    height: scale(32), // ✅ Responsive
  },

  webTab: {
    backgroundColor: '#3c3c3c',
    paddingHorizontal: scale(12), // ✅ Responsive
    paddingVertical: RESPONSIVE.margin.sm, // ✅ Responsive
    marginRight: scale(2), // ✅ Responsive
    borderTopLeftRadius: RESPONSIVE.borderRadius.sm, // ✅ Responsive
    borderTopRightRadius: RESPONSIVE.borderRadius.sm, // ✅ Responsive
    borderTopWidth: scale(1), // ✅ Responsive
    borderLeftWidth: scale(1), // ✅ Responsive
    borderRightWidth: scale(1), // ✅ Responsive
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderRightColor: '#555',
    minWidth: scaleWidth(80), // ✅ Responsive
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(-1) }, // ✅ Responsive
    shadowOpacity: 0.2,
    shadowRadius: scale(2), // ✅ Responsive
    elevation: 1,
  },
  
  webTabActive: {
    backgroundColor: '#000d2f99',
    borderTopColor: '#1177bb',
    borderLeftColor: '#1177bb',
    borderRightColor: '#1177bb',
    shadowOpacity: 0,
    elevation: 3,
    zIndex: 10,
    marginBottom: scale(-2), // ✅ Responsive
  },

  webTabFirst: {
    marginLeft: 0,
  },

  webTabLast: {
    marginRight: 0,
  },

  webTabText: {
    color: '#d1d5d9',
    fontSize: 10, // ✅ Responsive
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

  contentArea: {
    flex: 1,
    borderTopWidth: scale(1), // ✅ Responsive
    borderTopColor: '#1a1a1a',
    minHeight: 0,
  },

  codeContainer: {
    backgroundColor: '#000d2f99',
    paddingVertical: RESPONSIVE.margin.md, // ✅ Responsive
    borderTopWidth: 0,
    borderLeftWidth: scale(1), // ✅ Responsive
    borderLeftColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(-2) }, // ✅ Responsive
    shadowOpacity: 0.2,
    shadowRadius: scale(4), // ✅ Responsive
    elevation: 2,
  },

  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: scale(20), // ✅ Responsive
    paddingVertical: scale(2), // ✅ Responsive
  },

  lineNumberContainer: {
    minWidth: scaleWidth(50), // ✅ Responsive
    alignItems: 'center',
    borderTopWidth: scale(1), // ✅ Responsive
    borderTopColor: '#3a3a3a',
    borderLeftWidth: scale(1), // ✅ Responsive
    borderLeftColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: scale(1), height: 0 }, // ✅ Responsive
    shadowOpacity: 0.3,
    shadowRadius: scale(2), // ✅ Responsive
    elevation: 3,
  },

  lineNumber: {
    color: '#ffffff7e',
    fontSize: RESPONSIVE.fontSize.xs, // ✅ Responsive
    fontFamily: 'monospace',
    fontWeight: '400',
  },

  lineContent: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md, // ✅ Responsive
  },

  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: scale(100), // ✅ Responsive
  },

  outputContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    maxHeight: scaleHeight(250), // ✅ Responsive
  },

  outputHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: RESPONSIVE.margin.lg, // ✅ Responsive
    paddingVertical: RESPONSIVE.margin.sm, // ✅ Responsive
    borderBottomWidth: scale(1), // ✅ Responsive
    borderBottomColor: '#e9ecef',
  },

  outputTitle: {
    fontSize: RESPONSIVE.fontSize.md, 
    fontWeight: '600',
    color: '#495057',
  },

  outputContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  outputScrollContent: {
    flexGrow: 1,
    padding: RESPONSIVE.margin.lg, // ✅ Responsive
  },

  browserViewport: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: scale(100), 
  },

});

export default React.memo(CodeEditor, (prevProps, nextProps) => {
  return (
    prevProps.currentQuestion?.question === nextProps.currentQuestion?.question &&
    JSON.stringify(prevProps.selectedAnswers) === JSON.stringify(nextProps.selectedAnswers) &&
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.userOutput === nextProps.userOutput &&
    prevProps.expectedOutput === nextProps.expectedOutput &&
    prevProps.isCorrect === nextProps.isCorrect &&
    prevProps.onTabChange === nextProps.onTabChange &&
    prevProps.renderSyntaxHighlightedLine === nextProps.renderSyntaxHighlightedLine
  );
});