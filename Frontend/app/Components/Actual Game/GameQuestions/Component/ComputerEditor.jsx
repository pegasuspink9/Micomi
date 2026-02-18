import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Keyboard, Animated } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';
import Guide from '../Output/Guide';
import FileViewer from '../Output/FileViewer';

const ComputerEditor = ({
  currentQuestion,
  selectedAnswers,
  getBlankIndex,
  scrollViewRef,
  blankRefs,
  renderSyntaxHighlightedLine,
  onTabChange,
  activeTab: externalActiveTab
}) => {
  const [activeTab, setActiveTab] = useState('code');
  const [hasAnimated, setHasAnimated] = useState(false); 
  const lineAnimations = useRef([]);
  const [tabsDisabled, setTabsDisabled] = useState(false); 
  
  const codeText = useMemo(() => currentQuestion.question || '', [currentQuestion.question]);
  const lines = useMemo(() => codeText.split('\n'), [codeText]);

  // Bookworm Inspired Tab Details
  const codeTabDetails = useMemo(() => {
    return { long: 'Question', short: 'Question' };
  }, []);

  const fileTabs = useMemo(() => [
    { key: 'computer_file', short: 'Manuscript', long: 'Ancient Manuscript' },
  ], []);

  useEffect(() => {
    setTabsDisabled(true); 
    const timer = setTimeout(() => {
      setTabsDisabled(false);
    }, 2000); 
    return () => clearTimeout(timer); 
  }, []);

  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab, activeTab]);

  const handleTabChange = useCallback((tabName) => {
    if (tabsDisabled) return;
    setActiveTab(tabName);
    if (onTabChange) {
      onTabChange(tabName);
    }
  }, [onTabChange, tabsDisabled]); 

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'guide':
         return <Guide currentQuestion={currentQuestion} />;

      case 'code':
        return (
          <ScrollView
            ref={scrollViewRef}
            style={styles.bookContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {lines.map((line, lineIndex) => {
              if (!lineAnimations.current[lineIndex]) {
                lineAnimations.current[lineIndex] = {
                  opacity: new Animated.Value(0),
                  translateY: new Animated.Value(gameScale(10)),
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
                  <View style={styles.bookLine}>
                    <View style={styles.lineContent}>
                      {renderSyntaxHighlightedLine(line, lineIndex)}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        );
      case 'computer_file':
        return <FileViewer fileContent={currentQuestion.computer_file} />;
      default:
        return null;
    }
  }, [activeTab, lines, renderSyntaxHighlightedLine, currentQuestion, scrollViewRef]);

  useEffect(() => {
    if (!hasAnimated && activeTab === 'code' && lines && lines.length > 0) {
      lineAnimations.current.forEach(anim => {
        if (anim) {
          anim.opacity.setValue(0);
          anim.translateY.setValue(gameScale(10));
        }
      });

      const anims = lineAnimations.current.slice(0, lines.length).map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            delay: index * 50, 
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 300,
            delay: index * 50, 
            useNativeDriver: true,
          }),
        ])
      );

      Animated.stagger(20, anims).start(() => { 
        setHasAnimated(true); 
      });
    }
  }, [activeTab, lines, hasAnimated]);

  return (
    <View style={styles.bookEditorWrapper}>
      <View style={styles.bookHeader}>
        <View style={styles.spineShadow} />
        <View style={styles.tabsContainer}>
           {currentQuestion?.guide && (
            <Pressable
              onPress={() => handleTabChange('guide')}
              style={[
                styles.bookTab,
                activeTab === 'guide' && styles.bookTabActive,
                tabsDisabled && { opacity: 0.5 } 
              ]}
              disabled={tabsDisabled} 
            >
              <Text style={[styles.bookTabText, activeTab === 'guide' && styles.bookTabTextActive]}>
                Guide
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => handleTabChange('code')}
            style={[
              styles.bookTab,
              activeTab === 'code' && styles.bookTabActive,
              tabsDisabled && { opacity: 0.5 } 
            ]}
            disabled={tabsDisabled} 
          >
            <Text style={[styles.bookTabText, activeTab === 'code' && styles.bookTabTextActive]}>
              {activeTab === 'code' ? codeTabDetails.long : codeTabDetails.short}
            </Text>
          </Pressable>

           {currentQuestion?.computer_file != null && (
            <Pressable
              onPress={() => handleTabChange('computer_file')}
              style={[
                styles.bookTab,
                activeTab === 'computer_file' && styles.bookTabActive,
                tabsDisabled && { opacity: 0.5 } 
              ]}
              disabled={tabsDisabled} 
            >
              <Text style={[styles.bookTabText, activeTab === 'computer_file' && styles.bookTabTextActive]}>
                {currentQuestion.computer_file_name || (activeTab === 'computer_file' ? 'Manuscript' : 'Doc')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.pageArea}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
   bookEditorWrapper: {
    backgroundColor: '#000000', // Deep navy blue cover
    borderRadius: gameScale(15), 
    flex: 1, 
    width: '100%',
    overflow: 'hidden',
    borderLeftWidth: gameScale(8), // Thick spine
    borderLeftColor: '#0d1b2a', // Darker spine
    borderRightWidth: gameScale(2),
    borderRightColor: '#244a7d',
    borderBottomWidth: gameScale(6),
    borderBottomColor: '#09121d',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(4), height: gameScale(8) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(12),
    elevation: gameScale(20),
  },

 bookHeader: {
    backgroundColor: '#0d253f', // Darker blue header
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: gameScale(12),
    paddingTop: gameScale(10),
    borderBottomWidth: gameScale(2),
    borderBottomColor: '#4dabf7', // Blue separator
  },

  spineShadow: {
    width: gameScale(4),
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },

   tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: gameScale(4), 
    flex: 1, 
  },


   bookTab: {
    backgroundColor: '#244a7d', // Muted blue for inactive
    paddingVertical: gameScale(8),
    paddingHorizontal: gameScale(12),
    marginRight: gameScale(4),
    borderTopLeftRadius: gameScale(8),
    borderTopRightRadius: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: '#1e3a5f',
    minWidth: gameScale(60),
  },

  bookTabActive: {
    backgroundColor: '#0e639c', // Active game blue
    borderBottomColor: '#0e639c',
    marginBottom: gameScale(-2),
    borderWidth: gameScale(2),
    borderColor: '#4dabf7', // Glowing blue border
    elevation: gameScale(3),
    zIndex: 10,
  },

  bookTabText: {
    color: '#a0c4ff',
    fontSize: gameScale(12), // Slightly bigger tab text
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },

  bookTabTextActive: {
    color: '#ffffff',
    fontFamily: 'DynaPuff',
  },


  pageArea: {
    flex: 1,
    backgroundColor: '#ffecb3', // Dark brownish background
    borderTopWidth: gameScale(1),
    borderTopColor: '#3d2b1d',
  },

  bookContainer: {
    backgroundColor: 'transparent',
    paddingVertical: gameScale(16),
  },

  bookLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: gameScale(30), // Increased height for bigger text
    paddingVertical: gameScale(4),
  },

    pageNumberContainer: {
    minWidth: gameScale(35),
    alignItems: 'center',
    borderRightWidth: gameScale(1),
    borderRightColor: 'rgba(253, 250, 240, 0.1)', // Adjusted for dark theme
  },

  pageNumber: {
    color: '#8b5a2b',
    fontSize: gameScale(12),
    fontFamily: 'GoldenAgeDark',
    opacity: 0.6,
  },

  lineContent: {
    flex: 1,
    paddingHorizontal: gameScale(16), // More padding without line numbers
  },

   scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: gameScale(100),
  },
});

export default React.memo(ComputerEditor);