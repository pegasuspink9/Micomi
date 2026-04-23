import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import GridContainer from './components/GridContainer';
import AnswerGrid from './components/AnswerGrid';
import GameButton from './components/GameButtons';
import PotionGrid from './components/Potions/Potions';
import PvpChatInputBox from './components/Potions/PvpChatInputBox';
import { gameScale, BASE_HEIGHT } from '../../Responsiveness/gameResponsive';
import { soundManager } from '../Sounds/UniversalSoundManager';

import { 
  getMaxAnswers,
  createAnswerSelectHandler,
  createNextQuestionHandler,
  createCheckAnswerHandler,
  checkAnswer,
  setBorderColor
} from './utils/answerLogic';

const CHALLENGE_TIMER_FALLBACK_SECONDS = 300;

const ThirdGrid = ({ 
  currentQuestion, 
  selectedAnswers = [],
  setSelectedAnswers,
  currentQuestionIndex = 0,
  setCurrentQuestionIndex,
  questionsData,
  setBorderColor,
  setCorrectAnswerRef,
  challengeData,
  gameState,
  submitAnswer,
  submitting = false,
  onCorrectAnswer,
  potions = [],
  selectedPotion = null, 
  onPotionPress, 
  loadingPotions = false,
  usingPotion = false,
  setThirdGridHeight,
  selectedBlankIndex = 0, 
  usePotion,
  cardImageUrl,
  cardDamage,
  cardDisplaySequence,
  canProceed = false,
  onProceed = null,
  isAutoProceed = false,
  autoProceedCountdown = null,
  forceAutoProceedUi = false,
  isLevelComplete = false,
  showRunButton = true,
  onRetry = null,
  onHome = null,
  onNextLevel = null,
  hasNextLevel = false,
  onCharacterRun = null, 
  fadeOutAnim = null,
  isInRunMode = false,
  setSelectedBlankIndex,
  isPvpMode = false,
  pvpMatchId = null,
  onSendPvpMessage = null,
  sendingPvpMessage = false,
  pvpChallengeCountdown = null,
}) => {

  if (!currentQuestion) {
    console.warn('No currentQuestion provided to ThirdGrid');
    return null;
  }
  
  const maxAnswers = useMemo(() => getMaxAnswers(currentQuestion), [currentQuestion]);
  const isFillInTheBlank = (currentQuestion.type || currentQuestion.challenge_type) === 'fill in the blank';
  const options = useMemo(() => currentQuestion.options || [], [currentQuestion.options]);

  const enemyAttackType = useMemo(() => 
    gameState?.submissionResult?.fightResult?.enemy?.enemy_attack_type ?? 
    gameState?.enemy?.enemy_attack_type,
    [
      gameState?.submissionResult?.fightResult?.enemy?.enemy_attack_type, 
      gameState?.enemy?.enemy_attack_type
    ]
  );
  
  const isSpecialAttack = useMemo(() => {
    const isSpecial = enemyAttackType === 'special attack' || enemyAttackType === 'special skill';
    
    console.log('🎯 ThirdGrid Special Attack Detection:', {
      enemyAttackType,
      isSpecialAttack: isSpecial,
    });
    
    return isSpecial;
  }, [enemyAttackType]); 


  const getPotionBorderColor = (potionName) => {
    switch (potionName) {
      case "Gino's Blood": return 'rgba(130, 0, 0, 1)';
      case "Leon's Fury": return 'rgba(223, 190, 0, 1)';
      case 'Ryron’s Sight': return 'rgba(8, 120, 66, 1)';
      case 'ShiShi’s Frost': return 'rgba(1, 184, 201, 1)';
      default: return 'white';
    }
  };

  const handleAnswerSelect = useMemo(() => 
  createAnswerSelectHandler(
    currentQuestion, 
    selectedAnswers, 
    setSelectedAnswers,
    selectedBlankIndex,
    setSelectedBlankIndex 
  ), [currentQuestion, selectedAnswers, setSelectedAnswers, selectedBlankIndex, setSelectedBlankIndex]);

  const handleCheckAnswer = useMemo(() => 
    createCheckAnswerHandler(
      currentQuestion,
      selectedAnswers,
      setBorderColor,
      setCorrectAnswerRef,
      submitAnswer,
      onCorrectAnswer,
      options
    ), [currentQuestion, selectedAnswers, setBorderColor, setCorrectAnswerRef, submitAnswer, onCorrectAnswer, options]
  );

  const [showPotions, setShowPotions] = useState(false);
  const [runDisabled, setRunDisabled] = useState(false);
  const [potionUsed, setPotionUsed] = useState(false);
  const [isPvpChatActive, setIsPvpChatActive] = useState(false);

  useEffect(() => {
    if (!showPotions || !isPvpMode) {
      setIsPvpChatActive(false);
    }
  }, [isPvpMode, showPotions]);
  
  const togglePotions = useCallback(() => {
    soundManager.playGameButtonTapSound();
    setShowPotions(!showPotions);
  }, [showPotions]);

  const centerButtonTitle = useMemo(() => {
    if (isPvpMode) {
      return showPotions ? 'Answers' : 'Chat';
    }

    return showPotions ? 'Keyboard' : 'Potions';
  }, [isPvpMode, showPotions]);

  const runButtonTitle = useMemo(() => {
    if (usingPotion) return "Using...";
    if (selectedPotion) return "Activate"; 
    if (submitting) return "Running";
    return "Run";
  }, [usingPotion, selectedPotion, submitting]);

  const runButtonVariant = useMemo(() => selectedPotion ? "info" : "primary", [selectedPotion]);

  const runButtonDisabled = useMemo(() => {
    const hasSelectedAnswer = selectedAnswers.some(answer => answer != null);
    
    if (submitting || usingPotion || runDisabled) return true;
    
    // If potion is selected, button should be ENABLED (return false)
    if (selectedPotion) return false;

    // If no potion, button requires an answer
    return !hasSelectedAnswer;
  }, [submitting, usingPotion, runDisabled, selectedPotion, selectedAnswers]);


  useEffect(() => {
    setPotionUsed(false);
  }, [currentQuestion?.id]);

  const handleRunPress = useCallback(() => {
    soundManager.playGameButtonTapSound();
    setRunDisabled(true); 
    if (selectedPotion) {
      setPotionUsed(true); 
      usePotion(selectedPotion.player_potion_id);
      setBorderColor(getPotionBorderColor(selectedPotion.name)); 
    } else {
      handleCheckAnswer();
    }
    setTimeout(() => {
      setRunDisabled(false);
    }, 5000);
  }, [selectedPotion, usePotion, handleCheckAnswer, setBorderColor]);

  const handleClearAll = useCallback(() => {
    soundManager.playGameButtonTapSound();
    setSelectedAnswers([]); 
    setSelectedBlankIndex(0);
  }, [setSelectedAnswers, setSelectedBlankIndex]);

  // --- DYNAMIC HEIGHT LOGIC ---
  const [contentHeight, setContentHeight] = useState(0);

  const onContentLayout = useCallback((event) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height + gameScale(20)); 
  }, []);

  const isManualProceedMode = canProceed && !isLevelComplete && !isAutoProceed;
  const isAutoProceedMode =
    !isLevelComplete &&
    (Boolean(forceAutoProceedUi) || (canProceed && isAutoProceed));
  const shouldShowProceedState = isManualProceedMode || isAutoProceedMode;
  const hasActivePvpTimer =
    typeof pvpChallengeCountdown === 'number' && Number.isFinite(pvpChallengeCountdown);
  const formattedPvpTimer = useMemo(() => {
    const countdown = hasActivePvpTimer
      ? Math.max(0, pvpChallengeCountdown)
      : CHALLENGE_TIMER_FALLBACK_SECONDS;

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [hasActivePvpTimer, pvpChallengeCountdown]);

  const dynamicHeight = useMemo(() => {
    if (shouldShowProceedState || isLevelComplete) {
      return gameScale(BASE_HEIGHT * 0.12);
    }
    return contentHeight > 0 ? contentHeight : 'auto';
  }, [contentHeight, isLevelComplete, shouldShowProceedState]);

  useEffect(() => {
    if (setThirdGridHeight) {
      setThirdGridHeight(dynamicHeight);
    }
  }, [dynamicHeight, setThirdGridHeight]);

  // Helper variable to decide if content should be shown at all
  const showContent = !shouldShowProceedState && !isLevelComplete;
  const shouldDisableOverlayButtons = isPvpMode && showPotions && isPvpChatActive;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isCrtiticalTime = isPvpMode && hasActivePvpTimer && pvpChallengeCountdown <= 30;

  useEffect(() => {
    let pulse;
    if (isCrtiticalTime) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => pulse?.stop();
  }, [isCrtiticalTime]);

  
  return (
    <GridContainer
      key={`grid-v2-${currentQuestion?.id}-${shouldShowProceedState}-${isAutoProceedMode}`}
      mainHeight={dynamicHeight}
      cardImageUrl={cardImageUrl}
      showCardInGrid={cardDisplaySequence === 'grid'}
      isProceedMode={isManualProceedMode}
      isAutoProceedMode={isAutoProceedMode}
      autoProceedCountdown={autoProceedCountdown}
      onProceed={onProceed}
      cardDamage={cardDamage}
      isLevelComplete={isLevelComplete} 
      showRunButton={showRunButton}
      onRetry={onRetry} 
      onHome={onHome}
      onNextLevel={onNextLevel}
      hasNextLevel={hasNextLevel}
      onRun={onCharacterRun}
      fadeOutAnim={fadeOutAnim}
      isInRunMode={isInRunMode}
      isSpecialAttack={isSpecialAttack}
      pvpTimerComponent={
        isPvpMode && hasActivePvpTimer ? (
          <View style={styles.pvpTimerFrame}>
            <View style={styles.pvpTimerInner}>
              <Animated.Text 
                style={[
                  styles.pvpTimerValue,
                  isCrtiticalTime && styles.pvpTimerValueCritical,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                {formattedPvpTimer}
              </Animated.Text>
            </View>
          </View>
        ) : null
      }
      lowerChildren={
        <View
          style={styles.overlayButtons}
          pointerEvents={shouldDisableOverlayButtons ? 'none' : 'box-none'}
        >
          {shouldShowProceedState ? (
            <View />
          ) : (
            <>
              <GameButton 
                title={runButtonTitle}
                position="right"
                variant={runButtonVariant}
                onPress={handleRunPress}
                disabled={runButtonDisabled}
              />
              <GameButton 
                title={centerButtonTitle}
                position="center"
                variant="secondary"
                onPress={togglePotions}
                disabled={submitting || usingPotion}
              />
              <GameButton 
                title="Clear"
                position="left"
                variant="danger"
                onPress={handleClearAll}
                disabled={submitting || usingPotion}
              />
            </>
          )}
        </View>
      }
    >
      <View 
        onLayout={onContentLayout} 
        style={[
            styles.gridContentWrapper, 
            { minHeight: gameScale(80) } 
        ]}
      >
        {showContent && (
          <>
            {/* POTIONS VIEW */}
            <View style={{ display: showPotions ? 'flex' : 'none', width: '100%' }}>
              {isPvpMode ? (
                <PvpChatInputBox
                  matchId={pvpMatchId}
                  disabled={submitting || usingPotion || sendingPvpMessage}
                  sending={sendingPvpMessage}
                  onSendMessage={onSendPvpMessage}
                  onInputActivityChange={setIsPvpChatActive}
                />
              ) : (
                <PotionGrid 
                  potions={potions}
                  onPotionPress={onPotionPress} 
                  selectedPotion={selectedPotion} 
                  loadingPotions={loadingPotions}
                  potionUsed={potionUsed} 
                  currentQuestionId={currentQuestion.id} 
                />
              )}
            </View>

            {/* ANSWERS VIEW */}
            <View style={{ display: !showPotions ? 'flex' : 'none', width: '100%' }}>
              <AnswerGrid
                key={`answer-grid-${currentQuestion.id}`}
                options={options}
                selectedAnswers={selectedAnswers}
                maxAnswers={maxAnswers}
                onAnswerSelect={handleAnswerSelect}
                isFillInTheBlank={isFillInTheBlank}
                selectedBlankIndex={selectedBlankIndex} 
                currentQuestionId={currentQuestion.id}
                isSpecialAttack={isSpecialAttack}
              />
            </View>
          </>
        )}
      </View>
    </GridContainer>
  );
};

const styles = StyleSheet.create({
  gridContentWrapper: {
    width: '100%',
    flexGrow: 1,
    paddingBottom: gameScale(10), 
  },
  overlayButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    justifyContent: 'center', 
  },
  pvpTimerFrame: {
    alignSelf: 'flex-start',
    borderRadius: gameScale(10),
    backgroundColor: '#b4bdc6ff',
    borderTopWidth: gameScale(2),
    borderTopColor: '#2c5282',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#2c5282',
    borderBottomWidth: gameScale(3),
    borderBottomColor: '#2c5282',
    borderRightWidth: gameScale(3),
    borderRightColor: '#2c5282',
    minWidth: gameScale(78),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: gameScale(4),
    },
    shadowOpacity: 0.25,
    shadowRadius: gameScale(6),
    elevation: gameScale(8),
  },
  pvpTimerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: gameScale(8),
    backgroundColor: '#052a53ff',
    paddingVertical: gameScale(4),
    paddingHorizontal: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: 'rgba(135, 206, 235, 0.45)',
  },
  pvpTimerLabel: {
    color: 'rgba(194, 225, 255, 0.85)',
    fontSize: gameScale(8),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },
  pvpTimerValue: {
    marginTop: gameScale(1),
    color: '#ffffff',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },
  pvpTimerValueCritical: {
    color: '#ff4444',
  }
});


const areArraysEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

// Memo comparison
export default React.memo(ThirdGrid, (prev, next) => {
    const potionEqual = prev.selectedPotion?.id === next.selectedPotion?.id;
    const answersEqual = areArraysEqual(prev.selectedAnswers, next.selectedAnswers);

    // Check if the attack type changed
    const prevAttackType = prev.gameState?.submissionResult?.fightResult?.enemy?.enemy_attack_type ?? 
                          prev.gameState?.enemy?.enemy_attack_type;
    const nextAttackType = next.gameState?.submissionResult?.fightResult?.enemy?.enemy_attack_type ?? 
                          next.gameState?.enemy?.enemy_attack_type;
    
    const attackTypeEqual = prevAttackType === nextAttackType;

    return (
      potionEqual &&
      answersEqual &&
      attackTypeEqual && // Add this check
      prev.currentQuestion?.id === next.currentQuestion?.id &&
      prev.submitting === next.submitting &&
      prev.currentQuestionIndex === next.currentQuestionIndex &&
      prev.canProceed === next.canProceed &&
      prev.isAutoProceed === next.isAutoProceed &&
      prev.autoProceedCountdown === next.autoProceedCountdown &&
      prev.forceAutoProceedUi === next.forceAutoProceedUi &&
      prev.showRunButton === next.showRunButton &&
      prev.isInRunMode === next.isInRunMode &&
      prev.selectedBlankIndex === next.selectedBlankIndex &&
      prev.usingPotion === next.usingPotion &&
      prev.isLevelComplete === next.isLevelComplete &&
      prev.cardImageUrl === next.cardImageUrl &&
      prev.cardDamage === next.cardDamage &&
      prev.cardDisplaySequence === next.cardDisplaySequence &&
      prev.isPvpMode === next.isPvpMode &&
      prev.pvpMatchId === next.pvpMatchId &&
      prev.sendingPvpMessage === next.sendingPvpMessage &&
      prev.pvpChallengeCountdown === next.pvpChallengeCountdown
    );
});