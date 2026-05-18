import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { gameScale } from '../../Components/Responsiveness/gameResponsive';
import { soundManager } from '../Actual Game/Sounds/UniversalSoundManager';

const TUTORIAL_STEPS = [
  // --- PART 1: ScreenPlay ---
  {
    key: 'playerStats',
    title: 'Player Stats',
    body: 'Meet your character on the left! Here you can check your current health, coins, and available skills.',
  },
  {
    key: 'enemyStats',
    title: 'Enemy Stats',
    body: "On the right is the bug you are fighting. Keep a close eye on its health bar here!",
  },
  {
    key: 'combatAlerts',
    title: 'Combat Alerts',
    body: '🟢 If the border turns green, you nailed the answer and attack the bug. \n🔴 If it turns red, oops! The bug strikes back at you.',
  },

  // --- PART 2: GameQuestions ---
  {
    key: 'codeEditor',
    title: 'Code Editor',
    body: 'Tap the blue blanks to insert your code! \nThe yellow blank highlights your currently selected space.',
  },
  {
    key: 'guideTab',
    title: 'Guide Tab',
    body: 'Click the Guide tab to see what to do and what to expect on this screen.',
  },
  {
    key: 'outputTab',
    title: 'Output Tab',
    body: 'Check here to see the live result of the code you just wrote!',
  },
  {
    key: 'expectedOutput',
    title: 'Expected Output',
    body: "This is your target goal! Your Output must match this exactly. \n(Note: Just matching isn't enough; your code syntax must also be perfectly correct!)",
  },
  {
    key: 'optionsMenu',
    title: 'Options Menu (⋮)',
    body: 'Tap the three dots to enable "Show Output on Screen." This lets you easily view your code and your output at the exact same time!',
  },

  // --- PART 3: ThirdGrid ---
  {
    key: 'keyboard',
    title: 'Keyboard',
    body: 'Type your answers here! Keys turn black when pressed, and gray out once all your blanks are completely filled.',
  },
  {
    key: 'attackCard',
    title: 'Attack Card',
    body: 'This shows the skill and damage your character will unleash if your code is correct!',
  },
  {
    key: 'clearButton',
    title: 'Clear',
    body: '🧹 Made a mistake? Instantly reset your blanks so you can try again!',
  },
  {
    key: 'potionButton',
    title: 'Potion',
    body: '🧪 Need a boost? Consume items here for special game effects!',
  },
  {
    key: 'runButton',
    title: 'Run',
    body: '▶️ Ready to strike? Execute your code to finalize your attack!',
  },
];

const TutorialOverlay = ({
  visible = false,
  onClose = () => {},
  
  // Base Layouts
  screenPlayLayout = null,
  gameQuestionsLayout = null,
  thirdGridLayout = null,

  // Specific Component Layouts
  playerStatsLayout = null,
  enemyStatsLayout = null,
  combatAlertsLayout = null,
  
  codeEditorLayout = null,
  guideTabLayout = null,
  outputTabLayout = null,
  expectedOutputLayout = null,
  optionsMenuLayout = null,
  
  keyboardLayout = null,
  attackCardLayout = null,
  clearButtonLayout = null,
  potionButtonLayout = null,
  runButtonLayout = null,

  thirdGridHeight = 0,
  shouldHideThirdGrid = false,
  screenWidth,
  screenHeight,
}) => {
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setTutorialStep(0);
    }
  }, [visible]);

  const handleAdvance = useCallback(() => {
    soundManager.playUniversalTap();
    setTutorialStep((currentStep) => {
      const nextStep = currentStep + 1;
      if (nextStep >= TUTORIAL_STEPS.length) {
        onClose();
        return 0;
      }
      return nextStep;
    });
  }, [onClose]);

  const tutorialStepData = TUTORIAL_STEPS[tutorialStep];

  const tutorialFocusRect = useMemo(() => {
    if (!visible || !tutorialStepData) {
      return null;
    }

    const isBottomButton = ['clearButton', 'potionButton', 'runButton'].includes(tutorialStepData.key);

    const p1Height = gameScale(844 * 0.38); 
    const p2Y = p1Height;
    const p3Height = shouldHideThirdGrid ? 0 : (thirdGridHeight || gameScale(844 * 0.22));
    const p2Height = Math.max(0, screenHeight - p1Height - p3Height);
    const p3Y = p1Height + p2Height;

    const staticMockLayouts = {
      playerStats: { x: gameScale(10), y: gameScale(20), width: screenWidth * 0.4, height: p1Height * 0.9 },
      enemyStats: { x: screenWidth * 0.55, y: gameScale(20), width: screenWidth * 0.4, height: p1Height * 0.9 },
      combatAlerts: { x: 0, y: 0, width: screenWidth, height: p1Height },

      codeEditor: { x: gameScale(10), y: p2Y + gameScale(10), width: screenWidth - gameScale(20), height: p2Height * 0.9 },
      guideTab: { x: gameScale(80), y: p2Y + p2Height * 0.05, width: screenWidth * 0.10, height: gameScale(20) },
      outputTab: { x: gameScale(215), y: p2Y + p2Height * 0.05, width: screenWidth * 0.10, height: gameScale(20) },
      expectedOutput:  { x: gameScale(270), y: p2Y + p2Height * 0.05, width: screenWidth * 0.13, height: gameScale(20) },
      optionsMenu: { x: screenWidth - gameScale(50), y: p2Y + gameScale(10), width: gameScale(40), height: gameScale(40) },

      keyboard: { x: 0, y: p3Y + gameScale(35), width: screenWidth, height: p3Height * gameScale(6) },
      attackCard: { x: gameScale(300), y: p3Y + p3Height * -0.15, width: screenWidth * 0.25, height: p3Height * 0.3 },
      
      clearButton: { x: gameScale(42), bottom: gameScale(23), width: gameScale(78), height: gameScale(30) },
      potionButton: { x: gameScale(158), bottom: gameScale(23), width: gameScale(78), height: gameScale(30) },
      runButton: { x: gameScale(284), bottom: gameScale(23), width: gameScale(78), height: gameScale(30) },
    };

    const layoutMap = {
      playerStats: playerStatsLayout || staticMockLayouts.playerStats,
      enemyStats: enemyStatsLayout || staticMockLayouts.enemyStats,
      combatAlerts: combatAlertsLayout || staticMockLayouts.combatAlerts,

      codeEditor: codeEditorLayout || staticMockLayouts.codeEditor,
      guideTab: guideTabLayout || staticMockLayouts.guideTab,
      outputTab: outputTabLayout || staticMockLayouts.outputTab,
      expectedOutput: expectedOutputLayout || staticMockLayouts.expectedOutput,
      optionsMenu: optionsMenuLayout || staticMockLayouts.optionsMenu,

      keyboard: keyboardLayout || staticMockLayouts.keyboard,
      attackCard: attackCardLayout || staticMockLayouts.attackCard,
      clearButton: clearButtonLayout || staticMockLayouts.clearButton,
      potionButton: potionButtonLayout || staticMockLayouts.potionButton,
      runButton: runButtonLayout || staticMockLayouts.runButton,
    };

    const baseLayout = layoutMap[tutorialStepData.key];
    if (!baseLayout) return null;

    const padding = gameScale(6);
    const x = Math.max(0, baseLayout.x - padding);
    const width = Math.min(screenWidth - x, baseLayout.width + padding * 2);

    if (isBottomButton) {
      const bottom = Math.max(0, baseLayout.bottom - padding);
      const height = baseLayout.height + padding * 2;
      return { isBottom: true, x, bottom, width, height };
    } 
    
    const y = Math.max(0, baseLayout.y - padding);
    const height = Math.min(screenHeight - y, baseLayout.height + padding * 2);
    return { isBottom: false, x, y, width, height };

  }, [
    visible, tutorialStepData, shouldHideThirdGrid, thirdGridHeight,
    screenHeight, screenWidth, playerStatsLayout, enemyStatsLayout, combatAlertsLayout,
    codeEditorLayout, guideTabLayout, outputTabLayout, expectedOutputLayout, optionsMenuLayout,
    keyboardLayout, attackCardLayout, clearButtonLayout, potionButtonLayout, runButtonLayout
  ]);

  // Dynamic Card & Pointer Placement Fix
  const placementData = useMemo(() => {
    if (!tutorialFocusRect) {
      return { wrapperStyle: { display: 'none' }, cardStyle: {}, pointerStyle: {} };
    }

    const cardMargin = gameScale(16);
    const pointerHalfWidth = gameScale(10);
    const spacing = gameScale(16); // Gap between highlighted rect and card

    const focusCenterX = tutorialFocusRect.x + (tutorialFocusRect.width / 2);
    
    // Position Pointer Horizontally relative to the Card
    let pointerLeft = focusCenterX - cardMargin - pointerHalfWidth;
    const maxPointerLeft = screenWidth - (cardMargin * 2) - (pointerHalfWidth * 2) - gameScale(12);
    pointerLeft = Math.max(gameScale(12), Math.min(pointerLeft, maxPointerLeft));

    let wrapperStyle = {
      position: 'absolute',
      left: 0,
      right: 0,
      width: '100%',
      height: 0,
      zIndex: 10,
    };
    
    let cardStyle = {
      position: 'absolute',
      left: cardMargin,
      right: cardMargin,
    };

    let isCardAbove = false;

    // Anchor Wrapper Logic - guarantees the card NEVER overlaps the focus box vertically
    if (tutorialFocusRect.isBottom) {
      isCardAbove = true;
      wrapperStyle.bottom = tutorialFocusRect.bottom + tutorialFocusRect.height;
      cardStyle.bottom = spacing;
    } else {
      if (tutorialFocusRect.y > screenHeight * 0.5) {
        isCardAbove = true;
        wrapperStyle.top = tutorialFocusRect.y;
        cardStyle.bottom = spacing;
      } else {
        isCardAbove = false;
        wrapperStyle.top = tutorialFocusRect.y + tutorialFocusRect.height;
        cardStyle.top = spacing;
      }
    }

    let pointerStyle = { left: pointerLeft };

    if (isCardAbove) {
      // Points DOWN to Focus Area
      pointerStyle = {
        ...pointerStyle,
        bottom: -gameScale(16), 
        borderTopColor: '#CBD5E1',
        borderTopWidth: gameScale(12),
        borderLeftWidth: pointerHalfWidth,
        borderRightWidth: pointerHalfWidth,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
      };
    } else {
      // Points UP to Focus Area
      pointerStyle = {
        ...pointerStyle,
        top: -gameScale(11), 
        borderBottomColor: '#FFFFFF',
        borderBottomWidth: gameScale(12),
        borderLeftWidth: pointerHalfWidth,
        borderRightWidth: pointerHalfWidth,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
      };
    }

    return { wrapperStyle, cardStyle, pointerStyle };
  }, [tutorialFocusRect, screenHeight, screenWidth]);

  const hasTutorialHighlight = Boolean(
    tutorialFocusRect && tutorialFocusRect.width > 0 && tutorialFocusRect.height > 0
  );

  if (!visible || !tutorialStepData) {
    return null;
  }

  return (
    <Pressable style={styles.tutorialOverlay} onPress={handleAdvance}>
      {hasTutorialHighlight ? (
        tutorialFocusRect.isBottom ? (
          /* ABSOLUTE BOTTOM LOGIC DRAWING */
          <>
            <View style={[styles.tutorialOverlayBlock, { top: 0, left: 0, right: 0, bottom: tutorialFocusRect.bottom + tutorialFocusRect.height }]} />
            <View style={[styles.tutorialOverlayBlock, { bottom: 0, left: 0, right: 0, height: tutorialFocusRect.bottom }]} />
            <View style={[styles.tutorialOverlayBlock, { bottom: tutorialFocusRect.bottom, left: 0, width: tutorialFocusRect.x, height: tutorialFocusRect.height }]} />
            <View style={[styles.tutorialOverlayBlock, { bottom: tutorialFocusRect.bottom, left: tutorialFocusRect.x + tutorialFocusRect.width, right: 0, height: tutorialFocusRect.height }]} />
            <View style={[styles.tutorialHighlight, { bottom: tutorialFocusRect.bottom, left: tutorialFocusRect.x, width: tutorialFocusRect.width, height: tutorialFocusRect.height }]} />
          </>
        ) : (
          /* STANDARD TOP-DOWN LOGIC DRAWING */
          <>
            <View style={[styles.tutorialOverlayBlock, { top: 0, left: 0, right: 0, height: tutorialFocusRect.y }]} />
            <View style={[styles.tutorialOverlayBlock, { top: tutorialFocusRect.y + tutorialFocusRect.height, left: 0, right: 0, bottom: 0 }]} />
            <View style={[styles.tutorialOverlayBlock, { top: tutorialFocusRect.y, left: 0, width: tutorialFocusRect.x, height: tutorialFocusRect.height }]} />
            <View style={[styles.tutorialOverlayBlock, { top: tutorialFocusRect.y, left: tutorialFocusRect.x + tutorialFocusRect.width, right: 0, height: tutorialFocusRect.height }]} />
            <View style={[styles.tutorialHighlight, { top: tutorialFocusRect.y, left: tutorialFocusRect.x, width: tutorialFocusRect.width, height: tutorialFocusRect.height }]} />
          </>
        )
      ) : (
        <View style={[styles.tutorialOverlayBlock, StyleSheet.absoluteFillObject]} />
      )}

      {/* Tutorial Card Wrapper (Stops ANY vertical overlapping) */}
      <View style={placementData.wrapperStyle}>
        <View style={[styles.tutorialCard, placementData.cardStyle]}>
          
          {/* Dynamic Pointing Triangle */}
          {hasTutorialHighlight && (
            <View style={[styles.pointer, placementData.pointerStyle]} />
          )}

          <Text style={styles.tutorialTitle}>{tutorialStepData.title}</Text>
          <Text style={styles.tutorialBody}>{tutorialStepData.body}</Text>
          <Text style={styles.tutorialHint}>
            Tap anywhere to continue ({tutorialStep + 1}/{TUTORIAL_STEPS.length})
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tutorialOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100500,
    elevation: 100500,
  },
  tutorialOverlayBlock: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  tutorialHighlight: {
    position: 'absolute',
    borderWidth: gameScale(3),
    borderColor: '#22d3ee',
    borderRadius: gameScale(10),
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: gameScale(16),
    padding: gameScale(16),
    borderWidth: gameScale(1),
    borderColor: '#E2E8F0',
    borderBottomWidth: gameScale(6),
    borderBottomColor: '#CBD5E1', 
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 2,
  },
  tutorialTitle: {
    color: '#0F172A',
    fontSize: gameScale(16),
    fontFamily: 'Grobold',
    marginBottom: gameScale(8),
    textAlign: 'left',
  },
  tutorialBody: {
    color: '#334155',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    lineHeight: gameScale(18),
  },
  tutorialHint: {
    color: '#0284C7',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(10),
    textAlign: 'right',
  },
});

export default TutorialOverlay;