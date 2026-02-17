import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Keyboard, Animated } from 'react-native';
import Output from '../Output/Output';
import ExpectedOutput from '../Output/ExpectedOutput';
import { 
 gameScale
} from '../../../Responsiveness/gameResponsive';
import Guide from '../Output/Guide';
import FileViewer from '../Output/FileViewer';

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
  // Initialize as false so the useEffect triggers the animation on mount
  const [hasAnimated, setHasAnimated] = useState(false); 
  const lineAnimations = useRef([]);
  const [tabsDisabled, setTabsDisabled] = useState(false); 
  
  const codeText = useMemo(() => currentQuestion.question || '', [currentQuestion.question]);
  const lines = useMemo(() => codeText.split('\n'), [codeText]);

    const codeTabDetails = useMemo(() => {
    const type = currentQuestion?.question_type?.toLowerCase();
    switch (type) {
      case 'html':
        return { long: 'index.html', short: 'HTML' };
      case 'css':
        return { long: 'style.css', short: 'CSS' };
      case 'javascript':
        return { long: 'script.js', short: 'JS' };
      default:
        return { long: 'index.html', short: 'File' }; 
    }
  }, [currentQuestion?.question_type]);


  const fileTabs = useMemo(() => [
    { key: 'html_file', short: 'HTML', long: 'index.html' },
    { key: 'css_file', short: 'CSS', long: 'styles.css' },
    { key: 'javascript_file', short: 'JS', long: 'script.js' },
    { key: 'computer_file', short: 'File', long: 'file.txt' },
  ], []);

  //  UPDATED: Only handle tab disabling here. 
  // We removed the setHasAnimated(false) logic because the key prop in parent handles component reset.
   useEffect(() => {
    setTabsDisabled(true); 
    const timer = setTimeout(() => {
      setTabsDisabled(false);
    }, 3000); 
    return () => clearTimeout(timer); 
  }, []);


  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
      if (externalActiveTab === 'output' || externalActiveTab === 'expected') {
        Keyboard.dismiss();
      }
    }
  }, [externalActiveTab, activeTab]);

  const handleTabChange = useCallback((tabName) => {
    if (tabsDisabled) return;

    if (tabName === 'output' || tabName === 'expected') {
      Keyboard.dismiss();
    }
    setActiveTab(tabName);
    
    if (onTabChange) {
      onTabChange(tabName);
    }
  }, [onTabChange, tabsDisabled]); 


  const options = currentQuestion?.options || [];

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'guide':
         return  <Guide currentQuestion={currentQuestion} />;

      case 'code':
        return (
          <ScrollView
            ref={scrollViewRef}
            style={styles.codeContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {lines.map((line, lineIndex) => {
              //  CRITICAL: Ensure new lines start with 0 opacity
              if (!lineAnimations.current[lineIndex]) {
                lineAnimations.current[lineIndex] = {
                  opacity: new Animated.Value(0),
                  translateY: new Animated.Value(gameScale(-20)),
                };
              }

              return (
                <Animated.View
                  key={lineIndex}
                  style={{
                    opacity: lineAnimations.current[lineIndex].opacity,
                    transform: [{ translateY: lineAnimations.current[lineIndex].translateY }],
                  }}
                >
                  <View style={styles.codeLine}>
                    <View style={styles.lineNumberContainer}>
                      <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
                    </View>
                    <View style={styles.lineContent}>
                      {renderSyntaxHighlightedLine(line, lineIndex)}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        );
       case 'css_file':
        return <FileViewer fileContent={currentQuestion.css_file} language="css" />;
      case 'javascript_file':
        return <FileViewer fileContent={currentQuestion.javascript_file} language="javascript" />;
      case 'html_file':
        return <FileViewer fileContent={currentQuestion.html_file} language="html" />;
      case 'computer_file':
        return <FileViewer fileContent={currentQuestion.computer_file} />;

        
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

 useEffect(() => {
    if (!hasAnimated && activeTab === 'code' && lines && lines.length > 0) {
      
      lineAnimations.current.forEach(anim => {
        if (anim) {
          anim.opacity.setValue(0);
          anim.translateY.setValue(gameScale(-20)); // Use gameScale for consistency
        }
      });

      const MAX_ANIMATION_TOTAL_DURATION = 2000; // Cap total animation at 3 seconds
      const BASE_LINE_OPACITY_DELAY = 90;
      const BASE_LINE_TRANSLATE_Y_DELAY = 50;
      const BASE_STAGGER_DELAY = 25;
      const INDIVIDUAL_ANIMATION_DURATION = 200;

      // Calculate the approximate total duration with original settings
      // This considers the last line's opacity animation to be the latest finishing point
      const originalTotalDuration = 
        (lines.length > 0 ? (lines.length - 1) * (BASE_STAGGER_DELAY + BASE_LINE_OPACITY_DELAY) : 0) 
        + INDIVIDUAL_ANIMATION_DURATION;

      let actualLineOpacityDelay = BASE_LINE_OPACITY_DELAY;
      let actualLineTranslateYDelay = BASE_LINE_TRANSLATE_Y_DELAY;
      let actualStaggerDelay = BASE_STAGGER_DELAY;

      if (originalTotalDuration > MAX_ANIMATION_TOTAL_DURATION && lines.length > 1) {
        const scaleFactor = MAX_ANIMATION_TOTAL_DURATION / originalTotalDuration;
        actualLineOpacityDelay = Math.max(1, Math.floor(BASE_LINE_OPACITY_DELAY * scaleFactor));
        actualLineTranslateYDelay = Math.max(1, Math.floor(BASE_LINE_TRANSLATE_Y_DELAY * scaleFactor));
        actualStaggerDelay = Math.max(1, Math.floor(BASE_STAGGER_DELAY * scaleFactor));
      } else if (lines.length === 1) {
        actualLineOpacityDelay = 0;
        actualLineTranslateYDelay = 0;
        actualStaggerDelay = 0;
      }
      
      const anims = lineAnimations.current.slice(0, lines.length).map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: INDIVIDUAL_ANIMATION_DURATION,
            delay: index * actualLineOpacityDelay, 
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: INDIVIDUAL_ANIMATION_DURATION,
            delay: index * actualLineTranslateYDelay, 
            useNativeDriver: true,
          }),
        ])
      );

      Animated.stagger(actualStaggerDelay, anims).start(() => { 
        setHasAnimated(true); 
      });
    }
  }, [activeTab, lines, hasAnimated]);


  const handleCodeTabPress = useCallback(() => handleTabChange('code'), [handleTabChange]);
  const handleOutputTabPress = useCallback(() => handleTabChange('output'), [handleTabChange]);
  const handleExpectedTabPress = useCallback(() => handleTabChange('expected'), [handleTabChange]);
  const handleGuideTabPress = useCallback(() => handleTabChange('guide'), [handleTabChange]);
  const handleFileTabPress = useCallback((fileName) => handleTabChange(fileName), [handleTabChange]);

  return (
    <View style={styles.editorContainer}>
      <View style={styles.editorHeader}>
        <View style={styles.windowControls}>
          <View style={[styles.windowButton, { backgroundColor: '#ff5f56' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#ffbd2e' }]} />
          <View style={[styles.windowButton, { backgroundColor: '#27ca3f' }]} />
        </View>

        <View style={styles.tabsContainer}>
           {currentQuestion?.guide && (
            <Pressable
              onPress={handleGuideTabPress}
              style={[
                styles.webTab,
                activeTab === 'guide' && styles.webTabActive,
                styles.webTabFirst,
                tabsDisabled && { opacity: 0.5 } 
              ]}
              disabled={tabsDisabled} 
            >
              <Text style={[
                styles.webTabText, 
                activeTab === 'guide' && styles.webTabTextActive
              ]}>
                Guide
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleCodeTabPress}
            style={[
              styles.webTab,
              activeTab === 'code' && styles.webTabActive,
              !currentQuestion?.guide && styles.webTabFirst,
              tabsDisabled && { opacity: 0.5 } 
            ]}
            disabled={tabsDisabled} 
          >
              <Text style={[
              styles.webTabText, 
              activeTab === 'code' && styles.webTabTextActive
            ]}>
              {activeTab === 'code' ? codeTabDetails.long : codeTabDetails.short}
            </Text>
          </Pressable>

           {fileTabs.map(tab => (
            currentQuestion?.[tab.key] != null && (
              <Pressable
                key={tab.key}
                onPress={() => handleFileTabPress(tab.key)}
                style={[
                  styles.webTab,
                  activeTab === tab.key && styles.webTabActive,
                  tabsDisabled && { opacity: 0.5 } 
                ]}
                disabled={tabsDisabled} 
              >
                <Text style={[styles.webTabText, activeTab === tab.key && styles.webTabTextActive]}>
                  {currentQuestion[`${tab.key}_name`] || (activeTab === tab.key ? tab.long : tab.short)}
                </Text>
              </Pressable>
            )
          ))}

          <Pressable
            onPress={handleOutputTabPress}
            style={[
              styles.webTab,
              activeTab === 'output' && styles.webTabActive,
              tabsDisabled && { opacity: 0.5 } 
            ]}
            disabled={tabsDisabled} 
          >
            <Text style={[
              styles.webTabText, 
              activeTab === 'output' && styles.webTabTextActive
            ]}>
              {activeTab === 'output' ? 'Output' : 'Output'} 
            </Text>
          </Pressable>

          <Pressable
            onPress={handleExpectedTabPress}
            style={[
              styles.webTab,
              activeTab === 'expected' && styles.webTabActive,
              styles.webTabLast,
              tabsDisabled && { opacity: 0.5 } 
            ]}
            disabled={tabsDisabled} 
          >
            <Text style={[
              styles.webTabText, 
              activeTab === 'expected' && styles.webTabTextActive
            ]}>
              {activeTab === 'expected' ? 'Expected Output' : 'Expected'} 
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
    borderRadius: gameScale(12), 
    flex: 1, 
    width: '100%',
    overflow: 'hidden',
    borderTopColor: '#4a4a4a',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#3a3a3a',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#0a0a0a',
    borderRightWidth: gameScale(1),
    borderRightColor: '#3a3a3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(8) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(12),
    elevation: gameScale(16),
    minHeight: 0, 
  },

  editorHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: gameScale(12),
    paddingTop: gameScale(8),
    paddingBottom: 0,
    borderTopWidth: gameScale(1),
    borderTopColor: '#505050',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(6),
    elevation: gameScale(8),
  },

  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: gameScale(8),
  },

  windowButton: {
    width: gameScale(10),
    height: gameScale(10),
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

  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: gameScale(10), 
    flex: 1, 
  },

  webTab: {
    backgroundColor: '#3c3c3c',
    paddingVertical: gameScale(7),
    paddingHorizontal: gameScale(4),
    marginRight: gameScale(2),
    borderTopLeftRadius: gameScale(6),
    borderTopRightRadius: gameScale(6),
    borderTopWidth: gameScale(1),
    borderLeftWidth: gameScale(1),
    borderRightWidth: gameScale(1),
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderRightColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(-1) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(2),
    elevation: gameScale(1),
    minWidth: gameScale(20),
  },

  webTabActive: {
    backgroundColor: '#000d2f99',
    borderTopColor: '#1177bb',
    borderLeftColor: '#1177bb',
    borderRightColor: '#1177bb',
    shadowOpacity: 0,
    elevation: gameScale(3),
    zIndex: 10,
    marginBottom: gameScale(-2),
    flex: 0,
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: gameScale(16),
  },

  webTabFirst: {
    marginLeft: 0,
  },

  webTabLast: {
    marginRight: 0,
  },

  webTabText: {
    color: '#d1d5d9',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    fontWeight: '500',
    flexShrink: 1,
  },

  webTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
    flexShrink: 0,
  },

  headerSpacer: {
    flex: 1,
  },

  contentArea: {
    flex: 1,
    borderTopWidth: gameScale(1),
    borderTopColor: '#1a1a1a',
    minHeight: 0,
  },

  codeContainer: {
    backgroundColor: '#000d2f99',
    paddingVertical: gameScale(12),
    borderTopWidth: 0,
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(-2) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(4),
    elevation: gameScale(2),
  },

  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: gameScale(20),
    paddingVertical: gameScale(2),
  },

  lineNumberContainer: {
    minWidth: gameScale(30),
    alignItems: 'center',
    paddingRight: gameScale(4),
    borderTopWidth: gameScale(1),
    borderTopColor: '#3a3a3a',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(2),
    elevation: gameScale(3),
  },

  lineNumber: {
    color: '#ffffff7e',
    fontSize: gameScale(12),
    fontFamily: 'monospace',
    fontWeight: '400',
  },

  lineContent: {
    flex: 1,
    paddingHorizontal: gameScale(12),
  },

  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: gameScale(100),
  },

  outputContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    maxHeight: gameScale(250),
  },

  outputHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: gameScale(16),
    paddingVertical: gameScale(8),
    borderBottomWidth: gameScale(1),
    borderBottomColor: '#e9ecef',
  },

  outputTitle: {
    fontSize: gameScale(14), 
    fontWeight: '600',
    color: '#495057',
  },

  outputContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  outputScrollContent: {
    flexGrow: 1,
    padding: gameScale(16),
  },

  browserViewport: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: gameScale(100),
  },

});

export default React.memo(CodeEditor, (prev, next) => {
  // Drastically reduce comparisons - JSON.stringify is a bottleneck on high-frequency UI updates
  if (prev.currentQuestion?.id !== next.currentQuestion?.id) return false;
  if (prev.activeTab !== next.activeTab) return false;
  if (prev.isCorrect !== next.isCorrect) return false;
  
  // Use length or shallow comparison for answers instead of deep stringify
  const prevAns = prev.selectedAnswers;
  const nextAns = next.selectedAnswers;
  if (prevAns !== nextAns) {
    if (prevAns?.length !== nextAns?.length) return false;
    // If they have same length, check only changed indexes if necessary, 
    // but usually a simple reference change is enough to trigger false here
    return false; 
  }

  return (
    prev.renderSyntaxHighlightedLine === next.renderSyntaxHighlightedLine &&
    prev.userOutput === next.userOutput &&
    prev.expectedOutput === next.expectedOutput
  );
});