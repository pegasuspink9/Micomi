import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, Text, ActivityIndicator, TouchableOpacity, ScrollView, Animated } from "react-native";
import { StatusBar } from 'expo-status-bar';
import ScreenPlay from '../app/Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../app/Components/Actual Game/GameQuestions/GameQuestions';
import Output from './Components/Actual Game/GameQuestions/Output/Output';
import ThirdGrid from '../app/Components/Actual Game/Third Grid/thirdGrid';
import Card from '../app/Components/Actual Game/Card/Card';
import { useGameData } from './hooks/useGameData';
import { usePvpGameData } from './hooks/usePvpGameData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CombatVSModal from './Components/Actual Game/Game Display Entrance/GameDisplayEntrance';
import GameOverModal from './Components/GameOver And Win/GameOver';
import LevelCompletionModal from './Components/GameOver And Win/LevelCompletionModal';
import { soundManager } from './Components/Actual Game/Sounds/UniversalSoundManager';
import { gameScale } from './Components/Responsiveness/gameResponsive';
import GamePauseModal from '../app/Components/Actual Game/Screen Play/Pauses/GamePauseModal';
import DialogueOverlay from './Components/Actual Game/Dialogue/DialogueOverlay';
import MainLoading from './Components/Actual Game/Loading/MainLoading';
import Micomic from './Micomic';

export default function GamePlay() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse parameters from Expo Router
  const rawLevelId = Number.parseInt(params.levelId, 10);
  const levelId = Number.isFinite(rawLevelId) ? rawLevelId : null;
  const matchId = typeof params.matchId === 'string' ? params.matchId : null;
  const isPvpMode = params.mode === 'pvp' || Boolean(matchId);
  const levelData = params.levelData ? JSON.parse(params.levelData) : null;

  const [thirdGridHeight, setThirdGridHeight] = useState(gameScale(844 * 0.10));
  //  Simplified card state - only track current image URL
  const [showAttackCard, setShowAttackCard] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState(null);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);


  const [showDialogue, setShowDialogue] = useState(false);

  console.log('🎮 GamePlay component mounted with:', { 
    levelId, 
    matchId,
    mode: isPvpMode ? 'pvp' : 'pve',
    levelData: levelData ? 'Loaded' : 'None',
    rawParams: params
  });

  // Game state
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [borderColor, setBorderColor] = useState('white');
  const [activeGameTab, setActiveGameTab] = useState('code');
  const [showOutputInScreenPlay, setShowOutputInScreenPlay] = useState(false);
  const outputAutoShowTimerRef = useRef(null);
  const [selectedBlankIndex, setSelectedBlankIndex] = useState(0); 
  const [showVSModal, setShowVSModal] = useState(false);
  const [showMicomic, setShowMicomic] = useState(false);
  const hasFinishedMicomic = useRef(false);
  const [showGameplay, setShowGameplay] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoadingNextLevel, setIsLoadingNextLevel] = useState(false); 
  const [cardDisplaySequence, setCardDisplaySequence] = useState('modal');
  const [completionRewards, setCompletionRewards] = useState(null);
  
  const [runButtonClicked, setRunButtonClicked] = useState(false);
  const [showRunButton, setShowRunButton] = useState(true);

  const [showLevelCompletionModal, setShowLevelCompletionModal] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false); 
  const [messageText, setMessageText] = useState('');
  const gameOverTimeoutRef = useRef(null);
  const hasTriggeredGameOver = useRef(false);
  const hasTriggeredLevelCompletion = useRef(false);
  const hasShownVSModalRef = useRef(false);
  const lastPvpCardChallengeIdRef = useRef(null);
  const lastSubmissionKey = useRef(null); 
  const lastPlayedAudioKey = useRef(null);
  const messageDelayTimeoutRef = useRef(null);

  const levelCompletionTimeoutRef = useRef(null);
  const vsWatchdogTimeoutRef = useRef(null);
  const pvpFallbackRetryCountRef = useRef(0);

  const pveGameData = useGameData(levelId, { disabled: isPvpMode });
  const pvpGameData = usePvpGameData(matchId, { disabled: !isPvpMode });

  const activeGameData = isPvpMode ? pvpGameData : pveGameData;


  useEffect(() => {
    return () => {
      if (outputAutoShowTimerRef.current) {
        clearTimeout(outputAutoShowTimerRef.current);
      }
    };
  }, []);

  const handleRunPressForOutput = useCallback(() => {
    // Only trigger this sequence if the output is actually showing
    if (showOutputInScreenPlay) {
      console.log('🏃 Run pressed: Hiding output overlay immediately for 5 seconds');

      // 1. Hide immediately
      setShowOutputInScreenPlay(false);

      // Clear any pending timer just in case rapid clicks happen
      if (outputAutoShowTimerRef.current) {
        clearTimeout(outputAutoShowTimerRef.current);
      }

      // 2. Set timer to show it back after 5 seconds
      outputAutoShowTimerRef.current = setTimeout(() => {
        console.log('⏰ 5 seconds passed: Re-showing output overlay');
        setShowOutputInScreenPlay(true);
        outputAutoShowTimerRef.current = null;
      }, 6000);
    }
  }, [showOutputInScreenPlay]);


  const {
    gameState,   
    loading, 
    error, 
    submitting,
    sendingPvpMessage = false,
    refetchGameData,
    retryLevel,
    enterNextLevel, 
    submitAnswer,
    sendPvpMatchMessage = async () => ({ success: false, error: 'PvP chat is unavailable' }),
    waitingForAnimation, 
    onAnimationComplete,
    animationsLoading, 
    animationProgress,
    downloadProgress,
    individualAnimationProgress,
    canProceed,
    reviewGuide = null,
    handleProceed,
    autoProceedCountdown = null,
    challengeStallCountdown = null,

    potions,
    selectedPotion,
    loadingPotions,
    usingPotion,
    usePotion,
    selectPotion,
    clearSelectedPotion,
    liveSync = null,
    resolvedMatchId = null,
    chatReactionEvent = 0,
    surrenderMatch = async () => ({ success: false, error: 'PvP surrender is unavailable' }),
  } = activeGameData;

  const dialogueData = useMemo(() => gameState?.dialogue, [gameState?.dialogue]);

   useEffect(() => {
    const bgmUrl = gameState?.gameplay_audio;

    if (showGameplay && bgmUrl && !showLevelCompletion && !showLevelCompletionModal) {
      soundManager.playBackgroundMusic(bgmUrl);
    }
  }, [gameState?.gameplay_audio, showGameplay, showLevelCompletion, showLevelCompletionModal]);

  const currentChallenge = gameState?.currentChallenge;
  const submissionResult = gameState?.submissionResult;
  const hasTerminalPvpResult = useMemo(() => {
    const status = gameState?.submissionResult?.fightResult?.status;
    return status === 'won' || status === 'lost';
  }, [gameState?.submissionResult?.fightResult?.status]);

  const surrenderPvpOnExit = useCallback(async (reason = 'manual_exit') => {
    if (!isPvpMode || hasTerminalPvpResult) {
      return;
    }

    try {
      await surrenderMatch({ reason });
    } catch (surrenderError) {
      console.warn('Failed to surrender PvP match on exit:', surrenderError);
    }
  }, [hasTerminalPvpResult, isPvpMode, surrenderMatch]);

  const resolvedSubmissionIsCorrect = useMemo(() => {
    if (typeof submissionResult?.isCorrect === 'boolean') {
      return submissionResult.isCorrect;
    }

    if (typeof submissionResult?.is_correct === 'boolean') {
      return submissionResult.is_correct;
    }

    return null;
  }, [submissionResult?.isCorrect, submissionResult?.is_correct]);
  const [characterRunState, setCharacterRunState] = useState(false);

  useEffect(() => {
    if (!isPvpMode) {
      return;
    }

    if (resolvedSubmissionIsCorrect !== null) {
      setBorderColor(resolvedSubmissionIsCorrect ? 'correct' : 'incorrect');
      return;
    }

    if (!submissionResult) {
      setBorderColor('white');
    }
  }, [isPvpMode, resolvedSubmissionIsCorrect, submissionResult]);

  const canRenderVsModal = useMemo(() => {
    return Boolean(
      gameState?.selectedCharacter?.character_name &&
      gameState?.enemy?.enemy_name &&
      gameState?.versus_background
    );
  }, [gameState?.selectedCharacter?.character_name, gameState?.enemy?.enemy_name, gameState?.versus_background]);

  useEffect(() => {
    if (!isPvpMode) {
      return;
    }

    // Continue flow should always replay VS intro before gameplay.
    hasShownVSModalRef.current = false;
    lastPvpCardChallengeIdRef.current = null;
    hasFinishedMicomic.current = true;
    setShowMicomic(false);
    setShowVSModal(false);
    setShowGameplay(false);
    setShowDialogue(false);
  }, [isPvpMode, matchId]);
  
  //  Get character attack card from gameState
  const characterAttackCard = gameState?.card?.character_attack_card;
  const cardType = gameState?.card?.card_type;
  const characterDamageCard = gameState?.card?.character_damage_card;

  const [isInRunMode, setIsInRunMode] = useState(false);
  const fadeOutAnimRef = useRef(new Animated.Value(1)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isInRunMode) {
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 2000, 
        useNativeDriver: true,
      }).start(() => {
        fadeOutAnim.setValue(1);
        setIsInRunMode(false);
      });
    }
  }, [isInRunMode, fadeOutAnim]);

  //  SINGLE effect to handle card display on image change
  useEffect(() => {
    const currentChallengeId =
      currentChallenge?.id === null || currentChallenge?.id === undefined
        ? null
        : String(currentChallenge.id);

    console.log('📸 Checking card display:', {
      currentCard: characterAttackCard,
      previousCard: previousImageUrl,
      currentChallengeId,
      showGameplay: showGameplay,
      canProceed,
      isPvpMode,
    });

    if (!characterAttackCard || !showGameplay || showVSModal || showDialogue) {
      return;
    }

    if (isPvpMode) {
      if (!currentChallengeId || canProceed) {
        return;
      }

      // PvP rule: only show the card modal once after the challenge actually advances.
      if (lastPvpCardChallengeIdRef.current === currentChallengeId) {
        return;
      }

      console.log('📸 PvP challenge advanced - showing card for new challenge id');
      setCardDisplaySequence('modal');
      setShowAttackCard(true);
      setPreviousImageUrl(characterAttackCard);
      lastPvpCardChallengeIdRef.current = currentChallengeId;
      return;
    }

    // PvE rule: display when a new card image arrives.
    if (characterAttackCard !== previousImageUrl) {
      console.log('📸 NEW CARD DETECTED - Showing card');
      setCardDisplaySequence('modal');
      setShowAttackCard(true);
      setPreviousImageUrl(characterAttackCard);
    }
  }, [
    canProceed,
    characterAttackCard,
    currentChallenge?.id,
    isPvpMode,
    previousImageUrl,
    showDialogue,
    showGameplay,
    showVSModal,
  ]);

  useEffect(() => {
    const submission = gameState?.submissionResult;

    if (messageDelayTimeoutRef.current) {
      clearTimeout(messageDelayTimeoutRef.current);
      messageDelayTimeoutRef.current = null;
    }

    // If there's no submission or message, ensure the message is hidden.
    if (!submission || !submission.message) {
      setIsMessageVisible(false);
      return;
    }

    const audioUrl = submission.audio?.[0] || '';

    // Create a unique key for the submission event to prevent re-triggering on re-renders.
    const submissionKey = [
      currentChallenge?.id || 'none',
      submission?.reason || 'none',
      submission?.acceptedForAttack ?? submission?.accepted_for_attack ?? 'na',
      submission?.isCorrect ?? submission?.is_correct ?? 'na',
      submission?.fightResult?.status || 'none',
      submission?.fightResult?.character?.character_health ?? 'na',
      submission?.fightResult?.enemy?.enemy_health ?? 'na',
      submission?.message || '',
      audioUrl,
    ].join('|');

    // If we've already processed this exact submission, do nothing.
    if (lastSubmissionKey.current === submissionKey) {
      return;
    }
    lastSubmissionKey.current = submissionKey;

     if (!submission?.message) {
      setIsMessageVisible(false);
      return;
    }

    // This function will be called to trigger the message animation.
     const showMessage = () => {
      console.log('🎬 Sync: Setting message text and triggering visibility');
      setMessageText(submission.message); 
      setIsMessageVisible(true);
    }; 

    // Hide any previous message before starting the new sequence.
    setIsMessageVisible(false);
    
    // Use a short timeout to allow the UI to register the "hide" before we "show" again.
    messageDelayTimeoutRef.current = setTimeout(() => {
      if (audioUrl) {
        console.log('🔊 Sync: Playing sound, message will show on playback start.');
        soundManager.playSequentialMessage([audioUrl], showMessage);
      } else {
        console.log('💬 Sync: No sound, showing message immediately.');
        showMessage(); // If no sound, trigger the message directly.
      }
      messageDelayTimeoutRef.current = null;
    }, 1000);

    return () => {
      if (messageDelayTimeoutRef.current) {
        clearTimeout(messageDelayTimeoutRef.current);
        messageDelayTimeoutRef.current = null;
      }
    };

  }, [gameState?.submissionResult, currentChallenge?.id]);



  const handleCharacterRun = useCallback(() => {
    console.log('🏃 Character run triggered');
  
    setRunButtonClicked(true);
    setIsInRunMode(true);
    setShowRunButton(false);
    
    // Trigger the character run animation
    setCharacterRunState(true);
    
    // Set a single timer that ends the run animation and immediately shows the modal.
    levelCompletionTimeoutRef.current = setTimeout(() => {
      console.log('🏃 Character run animation completed, now showing modal.');
      setCharacterRunState(false);
      setIsInRunMode(false);
      setShowLevelCompletionModal(true);
    }, 1000); 
  }, []);
  


  useEffect(() => {
  if (isRetrying || isLoadingNextLevel) {

    if (levelCompletionTimeoutRef.current) {
      clearTimeout(levelCompletionTimeoutRef.current);
      levelCompletionTimeoutRef.current = null;
    }

    setIsInRunMode(false);
    setShowLevelCompletion(false);
    setShowLevelCompletionModal(false);
    setRunButtonClicked(false);
    setShowRunButton(false);
  }
  }, [isRetrying, isLoadingNextLevel]);

  const handleCloseAttackCard = useCallback(() => {
    console.log('📸 Closing modal card - transitioning to grid display');
    setShowAttackCard(false);
    setCardDisplaySequence('grid'); 
  }, []);

  useEffect(() => {
  if (isRetrying || isLoadingNextLevel) {
    console.log('📸 Resetting card display sequence');
    setPreviousImageUrl(null);
    setShowAttackCard(false);
    setCardDisplaySequence('none');
  }
}, [isRetrying, isLoadingNextLevel]);
  
  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);
  const maxAnswers = currentChallenge ? (currentChallenge.question?.match(/_/g) || []).length : 0;

   useEffect(() => {
    if (currentChallenge) {
      console.log('🔄 Refreshing challenge UI:', { 
        challengeId: currentChallenge.id, 
        attemptId: gameState?.attemptId 
      });
      
      setSelectedAnswers(new Array(maxAnswers).fill(null));
      setBorderColor('white');
      setActiveGameTab('code');
      setSelectedBlankIndex(0);
    }
  }, [currentChallenge?.id, maxAnswers, gameState?.attemptId]);   

  useEffect(() => {
    if (!currentChallenge || loading || animationsLoading || hasShownVSModalRef.current) {
      return;
    }

    if (isPvpMode) {
      console.log('⚔️ PvP continue flow - showing VS modal before gameplay');
      setShowMicomic(false);
      setShowGameplay(false);
      setShowVSModal(true);
      hasShownVSModalRef.current = true;
      return;
    }

    // Check if this level has comic lessons and we haven't shown them yet
    const hasLessons = gameState?.lessons?.lessons?.length > 0;

    if (hasLessons && !hasFinishedMicomic.current) {
      console.log('📖 Level has lessons, showing Micomic first');
      setShowMicomic(true);
      setShowVSModal(false);
      setShowGameplay(false);
    } else {
      console.log('⚔️ No lessons or already seen, showing VS modal');
      setShowVSModal(true);
      setShowGameplay(false);
      hasShownVSModalRef.current = true;
    }
  }, [isPvpMode, currentChallenge?.id, loading, animationsLoading, gameState?.lessons]);

  useEffect(() => {
    if (
      !isPvpMode ||
      !currentChallenge ||
      loading ||
      animationsLoading ||
      showVSModal ||
      showGameplay ||
      !hasShownVSModalRef.current
    ) {
      return;
    }

    // Safety net: if resumed flow falls into no-screen state, replay VS modal.
    setShowVSModal(true);
  }, [isPvpMode, currentChallenge?.id, loading, animationsLoading, showVSModal, showGameplay]);

  useEffect(() => {
    if (!showVSModal) {
      if (vsWatchdogTimeoutRef.current) {
        clearTimeout(vsWatchdogTimeoutRef.current);
        vsWatchdogTimeoutRef.current = null;
      }
      return;
    }

    if (vsWatchdogTimeoutRef.current) {
      clearTimeout(vsWatchdogTimeoutRef.current);
    }

    // If VS never completes (e.g., missing/failed background), continue to gameplay.
    vsWatchdogTimeoutRef.current = setTimeout(() => {
      setShowVSModal(false);
      setShowGameplay(true);
    }, 7000);

    return () => {
      if (vsWatchdogTimeoutRef.current) {
        clearTimeout(vsWatchdogTimeoutRef.current);
        vsWatchdogTimeoutRef.current = null;
      }
    };
  }, [showVSModal]);

  useEffect(() => {
    if (!isPvpMode || loading || animationsLoading || currentChallenge || error) {
      pvpFallbackRetryCountRef.current = 0;
      return;
    }

    if (pvpFallbackRetryCountRef.current >= 3) {
      return;
    }

    const retryTimer = setTimeout(() => {
      pvpFallbackRetryCountRef.current += 1;
      refetchGameData();
    }, 1200);

    return () => {
      clearTimeout(retryTimer);
    };
  }, [isPvpMode, loading, animationsLoading, currentChallenge, error, refetchGameData]);

  const handleMicomicComplete = useCallback(() => {
    console.log('📖 Micomic finished, transitioning to VS Modal');
    hasFinishedMicomic.current = true;
    setShowMicomic(false);
    
    // Trigger the next step in the sequence
    setShowVSModal(true);
    hasShownVSModalRef.current = true;
  }, []);

  // useEffect(() => {
  //   if (currentChallenge && !loading && !animationsLoading && (isRetrying || isLoadingNextLevel)) {
  //     console.log(' Level data loaded successfully');
  //     setIsRetrying(false);
  //     setIsLoadingNextLevel(false);
  //     setShowGameOver(false);
  //     setShowLevelCompletion(false);
  //     hasTriggeredGameOver.current = false;
  //     hasTriggeredLevelCompletion.current = false;
  //     hasShownVSModalRef.current = false;
      
  //     if (gameOverTimeoutRef.current) {
  //       clearTimeout(gameOverTimeoutRef.current);
  //       gameOverTimeoutRef.current = null;
  //     }
  //   }
  // }, [currentChallenge?.id, loading, animationsLoading, isRetrying, isLoadingNextLevel]);

    useEffect(() => {
    if (currentChallenge && !loading && !animationsLoading) {
       if (hasTriggeredGameOver.current && !showGameOver) hasTriggeredGameOver.current = false;
    }
  }, [currentChallenge?.id, loading, animationsLoading, showGameOver]);

  


  const handlePotionPress = useCallback((potion) => {
    if (selectedPotion && selectedPotion.id === potion.id) {
      clearSelectedPotion();
      setBorderColor('white');
      console.log('🧪 Potion deselected:', potion.name);
    } else {
      selectPotion(potion);
      console.log('🧪 Potion selected:', potion.name);
    }
  }, [selectedPotion, clearSelectedPotion, selectPotion]);

   const handleVSComplete = useCallback(() => {
    console.log('handleVSComplete called, setting showVSModal to false');
    setShowVSModal(false);
    
    setShowGameplay(true);

    if (gameState?.dialogue?.script && gameState.dialogue.script.length > 0) {
      setShowDialogue(true);
    } else {
      setShowDialogue(false); 
    }
  }, [gameState?.dialogue]);

  const handleDialogueComplete = useCallback(() => {
    console.log('Dialogue finished');
    setShowDialogue(false);
    setShowGameplay(true);
  }, []);


  const handleGameTabChange = useCallback((tabName) => {
    setActiveGameTab(tabName);
    if (selectedPotion) {
      clearSelectedPotion();
    }
  }, [selectedPotion, clearSelectedPotion]);

  const handleOutputToggle = useCallback(() => {
    setShowOutputInScreenPlay((current) => !current);
  }, []);

  
    const handleBlankSelect = useCallback((blankIndex) => {
    console.log('🎯 Blank selected in GamePlay:', blankIndex);
    
    //  ADDED: Toggle logic for the blank itself
    // If clicking the blank that is ALREADY selected, clear its answer
    if (selectedBlankIndex === blankIndex) {
      setSelectedAnswers(prev => {
        // Only clear if it actually has a value
        if (prev && prev[blankIndex] !== null) {
          const newArr = [...prev];
          newArr[blankIndex] = null;
          return newArr;
        }
        return prev;
      });
    }

    setSelectedBlankIndex(blankIndex);
  }, [selectedBlankIndex]);

   const interactiveTabs = ['code']; 
  const interactiveChallengeTypes = ['fill in the blank', 'code with guide', 'multiple choice'];

  const isInteractiveTabActive = interactiveTabs.includes(activeGameTab);
  const isInteractiveChallenge = currentChallenge && interactiveChallengeTypes.includes(currentChallenge.challenge_type);
  
  const shouldHideThirdGrid = !isInteractiveTabActive || !isInteractiveChallenge;


  
  const handleEnemyComplete = useCallback(() => {
    setSelectedAnswers(new Array(maxAnswers).fill(null));
    setBorderColor('white'); 
    setActiveGameTab('code');
    setSelectedBlankIndex(0);
  }, [maxAnswers]);


  useEffect(() => {
    const submissionResult = gameState?.submissionResult;
    const fightResult = submissionResult?.fightResult;
    
    console.log('💀 Game Over Check:', {
      status: fightResult?.status, 
      characterHealth: fightResult?.character?.character_health,
      showGameOver: showGameOver,
      hasTriggered: hasTriggeredGameOver.current,
      isRetrying: isRetrying,
      waitingForAnimation: waitingForAnimation,
      canProceed: canProceed,
      runButtonClicked: runButtonClicked
    });
    
    if (fightResult?.status === 'lost' &&
        fightResult?.character?.character_health === 0 &&
        !hasTriggeredGameOver.current && 
        !showGameOverModal && 
        !isRetrying &&
        !waitingForAnimation) { 
      
      console.log('💀 Character died - all animations complete, showing GameOver modal');
      hasTriggeredGameOver.current = true;

      const characterName = fightResult?.character?.character_name || 'Character';
      const enemyName = fightResult?.enemy?.enemy_name || 'Enemy';

      setCompletionRewards({
        ...(submissionResult?.completionRewards || {}),
        feedbackMessage: submissionResult?.completionRewards?.feedbackMessage || `${characterName} was defeated!`,
        coinsEarned: submissionResult?.completionRewards?.coinsEarned || 0,
        currentTotalPoints:
          submissionResult?.completionRewards?.currentTotalPoints ||
          submissionResult?.completionRewards?.totalPointsEarned || 0,
        currentExpPoints:
          submissionResult?.completionRewards?.currentExpPoints ||
          submissionResult?.completionRewards?.totalExpPointsEarned || 0,
        stars: submissionResult?.completionRewards?.stars || 0,
        rankProgress: submissionResult?.completionRewards?.rankProgress || null,
        isVictory: false,
      });


      setShowGameOver(true);
      
       gameOverTimeoutRef.current = setTimeout(() => {
        console.log('💀 Showing GameOver modal after delay');
        setShowGameOverModal(true);
      }, 500);
    }
  }, [gameState?.submissionResult?.fightResult, showGameOver, isRetrying, waitingForAnimation]);

  useEffect(() => {
    if (isRetrying) {
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      setShowGameOver(false);
      setShowGameOverModal(false);
    }
  }, [isRetrying]);

  useEffect(() => {
    const submissionResult = gameState?.submissionResult;
    const fightResult = submissionResult?.fightResult;
    
    console.log('🎉 Level Completion Check:', {
      status: fightResult?.status, 
      enemyHealth: fightResult?.enemy?.enemy_health,
      canProceed: canProceed,
      showLevelCompletion: showLevelCompletion,
      isLoadingNextLevel: isLoadingNextLevel,
      waitingForAnimation: waitingForAnimation,
      runButtonClicked: runButtonClicked,
      showRunButton: showRunButton,
      isRetrying: isRetrying
    });

    // Show completion buttons when enemy is defeated
    if (fightResult?.status === 'won' &&
        fightResult?.enemy?.enemy_health === 0 &&
        !hasTriggeredLevelCompletion.current && 
        !showLevelCompletion && 
        !isLoadingNextLevel &&
        !waitingForAnimation &&
        !canProceed &&
        !isRetrying
      ) {
      
      console.log('🎉 Level completed - showing completion buttons');
      hasTriggeredLevelCompletion.current = true;

      setCompletionRewards({
        ...(submissionResult?.completionRewards || {}),
        feedbackMessage: submissionResult?.completionRewards?.feedbackMessage || 'Congratulations!',
        coinsEarned: submissionResult?.completionRewards?.coinsEarned || 0,
        currentTotalPoints:
          submissionResult?.completionRewards?.currentTotalPoints ||
          submissionResult?.completionRewards?.totalPointsEarned || 0,
        currentExpPoints:
          submissionResult?.completionRewards?.currentExpPoints ||
          submissionResult?.completionRewards?.totalExpPointsEarned || 0,
        stars: submissionResult?.completionRewards?.stars || 0,
        rankProgress: submissionResult?.completionRewards?.rankProgress || null,
        isVictory: true,
      });

      setShowLevelCompletion(true);
      setShowRunButton(true);
      setRunButtonClicked(false);
    
    }
  }, [gameState?.submissionResult?.fightResult, showLevelCompletion, isLoadingNextLevel, waitingForAnimation, canProceed, isRetrying]);

  useEffect(() => {
    if (!isPvpMode) {
      return;
    }

    const pvpRewards = gameState?.submissionResult?.completionRewards;
    if (!pvpRewards) {
      return;
    }

    const fightStatus = gameState?.submissionResult?.fightResult?.status;
    setCompletionRewards({
      ...(pvpRewards || {}),
      feedbackMessage: pvpRewards?.feedbackMessage || 'Congratulations!',
      coinsEarned: pvpRewards?.coinsEarned || 0,
      currentTotalPoints:
        pvpRewards?.currentTotalPoints ||
        pvpRewards?.totalPointsEarned ||
        0,
      currentExpPoints:
        pvpRewards?.currentExpPoints ||
        pvpRewards?.totalExpPointsEarned ||
        0,
      stars: pvpRewards?.stars || 0,
      rankProgress: pvpRewards?.rankProgress || null,
      isVictory:
        typeof pvpRewards?.isVictory === 'boolean'
          ? pvpRewards.isVictory
          : fightStatus === 'won',
    });
  }, [
    isPvpMode,
    gameState?.submissionResult?.completionRewards,
    gameState?.submissionResult?.fightResult?.status,
  ]);

   useEffect(() => {
    if (runButtonClicked && !showRunButton && showLevelCompletion) {
      console.log('🎉 Modal should show now');
    }
  }, [runButtonClicked, showRunButton, showLevelCompletion]);

  const handleAnimationComplete = useCallback(() => {
    console.log('🎬 All animation sequences completed');
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  const handleRetry = useCallback(async () => {
    console.log('🔄 Retrying level - calling entryLevel API to reset data...');
    
       
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    
    setShowGameOver(false);
    setShowGameOverModal(false);
    setShowVSModal(false);
    setShowGameplay(false);
    setShowLevelCompletion(false);
    setShowLevelCompletionModal(false);
    setShowOutputInScreenPlay(false);
    
    setIsRetrying(true);

    setRunButtonClicked(false);
    setShowRunButton(false); 
    

    hasTriggeredGameOver.current = false;
    hasTriggeredLevelCompletion.current = false;
    hasShownVSModalRef.current = false;

    setSelectedAnswers([]); 
    setBorderColor('white');
    setActiveGameTab('code');
    setSelectedBlankIndex(0);
    setCardDisplaySequence('modal');
    

    try{
      if (isPvpMode) {
        await refetchGameData();
      } else {
        await retryLevel();
      }
    } catch (error) {
      console.error('❌ Failed to retry level:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isPvpMode, refetchGameData, retryLevel]);

  const handleNextLevel = useCallback(async () => {
    if (isPvpMode) {
      return;
    }

    const nextLevelId = gameState?.submissionResult?.nextLevel?.level_id;
    
    if (!nextLevelId) {
      console.error('❌ No next level ID available');
      return;
    }

    console.log(`🚀 Loading next level: ${nextLevelId}`);
    
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    
    setIsLoadingNextLevel(true);
    setShowVSModal(false); 
    setShowLevelCompletion(false); 
    setShowGameplay(false);
    setShowOutputInScreenPlay(false);
    hasTriggeredLevelCompletion.current = false;
    hasShownVSModalRef.current = false;
    soundManager.stopAllSounds();
    
    try {
      await enterNextLevel(nextLevelId);
      console.log(' Next level loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load next level:', error);
      setIsLoadingNextLevel(false);
    } finally {
      setIsLoadingNextLevel(false);
    }
  }, [isPvpMode, gameState?.submissionResult?.nextLevel?.level_id, enterNextLevel]);

  const handleHome = useCallback(async () => {
    console.log('🏠 Going home...');

    await surrenderPvpOnExit('pause_or_home_exit');
    
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }

    if (levelCompletionTimeoutRef.current) {
      clearTimeout(levelCompletionTimeoutRef.current);
      levelCompletionTimeoutRef.current = null;
    }
    
    soundManager.stopAllSounds();
    setShowGameOver(false);
    setShowGameOverModal(false);
    setShowLevelCompletion(false); 
    setIsRetrying(false);
    setIsLoadingNextLevel(false);
    setShowOutputInScreenPlay(false);
    setRunButtonClicked(false);
    setShowRunButton(true);
    hasTriggeredGameOver.current = false;
    hasTriggeredLevelCompletion.current = false;

    router.back();
  }, [router, surrenderPvpOnExit]);

    useEffect(() => {
    return () => {
      if (levelCompletionTimeoutRef.current) {
        clearTimeout(levelCompletionTimeoutRef.current);
        levelCompletionTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }

      if (vsWatchdogTimeoutRef.current) {
        clearTimeout(vsWatchdogTimeoutRef.current);
        vsWatchdogTimeoutRef.current = null;
      }

     soundManager.stopAllSounds();
    };
  }, []);

  const handlePausePress = useCallback(() => {
    setShowPauseModal(true);
  }, []);

  const handleResume = useCallback(() => {
    setShowPauseModal(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        soundManager.stopBackgroundMusic();
      } else if (gameState?.gameplay_audio) {
        soundManager.playBackgroundMusic(gameState.gameplay_audio);
      }
      return newMuted;
    });
  }, [gameState?.gameplay_audio]);
  

  const handleAllowEnemyCompletion = useCallback((allowCompletionFn) => {
    allowEnemyCompletionRef.current = allowCompletionFn;
  }, []);

  const handleSetCorrectAnswer = useCallback((setCorrectAnswerFn) => {
    setCorrectAnswerRef.current = setCorrectAnswerFn;
  }, []);

  const getBlankIndex = useCallback((lineIndex, partIndex) => {
    let blankIndex = 0;
    const lines = currentChallenge?.question?.split('\n') || [];
    for (let i = 0; i < lineIndex; i++) {
      blankIndex += (lines[i].match(/_/g) || []).length;
    }
    blankIndex += partIndex;
    return blankIndex;
  }, [currentChallenge?.question]);

  const handleExitGame = useCallback(async () => {
    console.log('🚪 Exiting game...');

    await surrenderPvpOnExit('explicit_exit');

    router.back();
  }, [router, surrenderPvpOnExit]);

  const memoizedSetSelectedAnswers = useCallback((answers) => {
    setSelectedAnswers(answers);
  }, []);

  
  const memoizedOptions = useMemo(() => currentChallenge?.options || [], [currentChallenge?.options]);


    const handleAutoHideOutput = useCallback(() => {
    console.log('🕒 Auto-hiding screenplay output overlay');
    setShowOutputInScreenPlay(false);
  }, []);

  
  const outputView = (
    <Output
      currentQuestion={currentChallenge}
      selectedAnswers={selectedAnswers}
      actualResult={gameState?.submissionResult?.message || gameState?.submissionResult?.reason || ''}
      isCorrect={resolvedSubmissionIsCorrect}
      showLiveHTML={true}
      options={memoizedOptions}
      displayMode="overlay"
      runButtonClicked={runButtonClicked}
      onAutoHide={handleAutoHideOutput}
    />
  );

  // COMBINED LOADING STATE: Used to trigger the MainLoading entrance/exit
  const showLoadingScreen = loading || animationsLoading || isLoadingNextLevel || isRetrying;
  const showPvpSyncFallback =
    isPvpMode &&
    !showLoadingScreen &&
    !showMicomic &&
    (!showVSModal || (showVSModal && !canRenderVsModal)) &&
    !showGameplay;

  // Extract the specific loading text/progress bars to a variable
  // We will render this ON TOP of the MainLoading doors
  const loadingProgressOverlay = (
      <View style={[styles.container, styles.centerContent, { position: 'absolute', width: '100%', height: '100%', zIndex: 100000, backgroundColor: 'transparent' }]}>

        {isRetrying ? (
          <Text style={styles.loadingText}></Text>
        ) : isLoadingNextLevel ? (
          <Text style={styles.loadingText}></Text>
        ) : loading ? (
          <Text style={styles.loadingText}></Text>
        ) : (
          <View style={styles.downloadContainer}>
            <Text style={styles.loadingText}>Downloading animations...</Text>
            
            {downloadProgress.total > 0 && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>
                  Overall Progress: {downloadProgress.loaded}/{downloadProgress.total}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.round(downloadProgress.progress * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(downloadProgress.progress * 100)}%
                </Text>
              </View>
            )}
            
            {individualAnimationProgress.url && (
              <View style={styles.progressSection}>
                <Text style={styles.currentAnimationText}>
                  Downloading: ...{individualAnimationProgress.url}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.round(individualAnimationProgress.progress * 100)}%`,
                        backgroundColor: '#4dabf7' 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(individualAnimationProgress.progress * 100)}%
                </Text>
              </View>
            )}
            
            {downloadProgress.currentUrl && (
              <Text style={styles.currentUrlText}>
                Current: ...{downloadProgress.currentUrl}
              </Text>
            )}
            
            <Text style={styles.downloadHint}>
              📥 Downloading animations for smooth gameplay...
            </Text>
          </View>
        )}
      </View>
  );


  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchGameData}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitGame}>
          <Text style={styles.exitText}>Exit Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {showMicomic && (
        <View style={StyleSheet.absoluteFill}>
          <Micomic 
            isComponent={true} 
            manualGameState={gameState} 
            onComplete={handleMicomicComplete} 
          />
        </View>
      )}

      {showVSModal && (
        canRenderVsModal ? (
          <CombatVSModal
            visible={showVSModal}
            onComplete={handleVSComplete}
            selectedCharacter={gameState?.selectedCharacter}
            enemy={gameState?.enemy}
            versusBackground={gameState?.versus_background}
            versusAudio={gameState?.versus_audio}
            isPvpMode={isPvpMode}
          />
        ) : (
          <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator size="large" color="#9fd8ff" />
            <Text style={styles.pvpFallbackTitle}>Preparing Combat VS</Text>
            <Text style={styles.pvpFallbackSubtitle}>Loading latest match visuals...</Text>
          </View>
        )
      )}

      {showGameplay && (
      <ImageBackground 
        source={require('./gamebackgroundmain.png')}
        style={styles.container}
      >
        {currentChallenge ? (
          <View style={styles.gameLayoutContainer}>
            {isPvpMode ? null : null}

            <View style={styles.screenPlayContainer}>
              <ScreenPlay 
                gameState={gameState}
                isPaused={false}
                borderColor={borderColor}
                characterRunState={characterRunState}
                onEnemyComplete={handleEnemyComplete}
                currentQuestionIndex={0}
                onAllowEnemyCompletion={handleAllowEnemyCompletion}
                onSetCorrectAnswer={handleSetCorrectAnswer}
                onSubmissionAnimationComplete={handleAnimationComplete}
                isInRunMode={isInRunMode}
                fadeOutAnim={fadeOutAnim}
                isMessageVisible={isMessageVisible}
                messageText={messageText}
                onPausePress={handlePausePress}
                setBorderColor={setBorderColor}
                isPvpMode={isPvpMode}
                pvpReactionEvent={chatReactionEvent}
              />

              {showOutputInScreenPlay && (
                <View style={styles.screenPlayOverlay} pointerEvents="box-none">
                  <View style={styles.screenPlayOutputContainer}>
                    {outputView}
                  </View>
                </View>
              )}
            </View>

            <GameQuestions 
              currentQuestion={currentChallenge}
              selectedAnswers={selectedAnswers}
                getBlankIndex={getBlankIndex}
                onTabChange={handleGameTabChange}
                activeTab={activeGameTab}
                selectedBlankIndex={selectedBlankIndex}
                onBlankPress={handleBlankSelect} 
                isAnswerCorrect={resolvedSubmissionIsCorrect}
                canProceed={canProceed}
                submissionResult={gameState?.submissionResult}
                reviewGuide={reviewGuide}
                showOutputInScreenPlay={showOutputInScreenPlay}
                onOutputToggle={handleOutputToggle}
            />

            <View 
              style={[
                styles.thirdGridContainer, 
                { 
                  height: thirdGridHeight,
                  display: shouldHideThirdGrid ? 'none' : 'flex',
                }
              ]}
            >
              <ThirdGrid 
                currentQuestion={currentChallenge}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={memoizedSetSelectedAnswers}
                currentQuestionIndex={0}
                setCurrentQuestionIndex={() => {}}
                setBorderColor={setBorderColor}
                setCorrectAnswerRef={setCorrectAnswerRef}
                getBlankIndex={getBlankIndex}
                challengeData={currentChallenge}
                gameState={gameState}
                submitAnswer={submitAnswer}
                submitting={submitting}
                selectedBlankIndex={selectedBlankIndex} 
                potions={potions}
                selectedPotion={selectedPotion}
                onPotionPress={handlePotionPress}
                loadingPotions={loadingPotions}
                usingPotion={usingPotion}
                setThirdGridHeight={setThirdGridHeight}
                usePotion={usePotion}
                cardImageUrl={characterAttackCard}
                cardDamage={characterDamageCard}
                cardDisplaySequence={cardDisplaySequence}
                canProceed={canProceed}
                onProceed={handleProceed}
                isAutoProceed={isPvpMode && canProceed}
                autoProceedCountdown={isPvpMode ? autoProceedCountdown : null}
                pvpChallengeCountdown={isPvpMode ? challengeStallCountdown : null}
                forceAutoProceedUi={
                  isPvpMode &&
                  resolvedSubmissionIsCorrect === true &&
                  waitingForAnimation &&
                  !canProceed
                }
                isLevelComplete={showLevelCompletion}
                showRunButton={showRunButton}
                onCharacterRun={handleCharacterRun}
                onHome={handleHome}
                onRetry={handleRetry}
                onNextLevel={handleNextLevel}
                hasNextLevel={!isPvpMode && !!gameState?.submissionResult?.nextLevel}
                fadeOutAnim={fadeOutAnim}
                isInRunMode={isInRunMode}
                setSelectedBlankIndex={setSelectedBlankIndex}
                options={memoizedOptions}
                isPvpMode={isPvpMode}
                pvpMatchId={resolvedMatchId || matchId || null}
                onSendPvpMessage={sendPvpMatchMessage}
                sendingPvpMessage={sendingPvpMessage}
                onRunPressHideOutput={handleRunPressForOutput}
              />
            </View>

            <DialogueOverlay 
              visible={showDialogue}
              dialogueData={gameState?.dialogue}
              onComplete={handleDialogueComplete}
            />
           



          <GameOverModal
            visible={!isPvpMode && showGameOverModal}
            onRetry={handleRetry}
            onHome={handleHome}
           characterName={gameState?.submissionResult?.fightResult?.character?.character_name || 'Character'}
            enemyName={gameState?.submissionResult?.fightResult?.enemy?.enemy_name || 'Enemy'}
            isRetrying={isRetrying} 
            completionRewards={completionRewards}
            defeatAudioUrl={gameState?.submissionResult?.is_victory_audio}
            defeatImageUrl={gameState?.submissionResult?.is_victory_image} 
          />
            
          <LevelCompletionModal
              visible={
                isPvpMode
                  ? (showGameOverModal || (showLevelCompletionModal && runButtonClicked && !showRunButton))
                  : (showLevelCompletionModal && runButtonClicked && !showRunButton)
              }
              onRetry={handleRetry}
              onHome={handleHome}
              onNextLevel={handleNextLevel}
              completionRewards={completionRewards}
              nextLevel={!isPvpMode && !!gameState?.submissionResult?.nextLevel}
              isLoading={isLoadingNextLevel}
              victoryAudioUrl={gameState?.submissionResult?.is_victory_audio}
              victoryImageUrl={gameState?.submissionResult?.is_victory_image} 
              isPvpMode={isPvpMode}
          />
        
          </View>
        ) : (
          <View style={styles.pvpFallbackContainer}>
            <ActivityIndicator size="large" color="#9fd8ff" />
            <Text style={styles.pvpFallbackTitle}>Syncing Match State</Text>
            <Text style={styles.pvpFallbackSubtitle}>Loading latest challenge from server...</Text>
          </View>
        )}
      </ImageBackground>
      )}

      {showPvpSyncFallback && (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#9fd8ff" />
          <Text style={styles.pvpFallbackTitle}>Reconnecting Match</Text>
          <Text style={styles.pvpFallbackSubtitle}>Preparing Combat VS and challenge state...</Text>
        </View>
      )}

      <Card
        visible={showAttackCard}
        imageUrl={characterAttackCard}
        cardType={cardType}
        damage={characterDamageCard}
        onClose={handleCloseAttackCard}
        autoClose={true}
        autoCloseDuration={10000}
      />

      <GamePauseModal 
        visible={showPauseModal}
        onResume={handleResume}
        onBack={handleHome}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      <MainLoading visible={showLoadingScreen} />
      {showLoadingScreen && loadingProgressOverlay}

    </>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 0,
  },
  
  gameLayoutContainer: {
    flex: 1,
    flexDirection: 'column',
  },

  screenPlayContainer: {
    height: gameScale(844 * 0.38), 
    position: 'relative',
  },

  screenPlayOutputContainer: {
    flex: 1,
    minHeight: 0,
  },

  screenPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 1000,
  },

  pvpFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 16, 34, 0.72)',
    paddingHorizontal: gameScale(20),
  },

  pvpFallbackTitle: {
    marginTop: gameScale(12),
    color: '#E8F6FF',
    fontSize: gameScale(16),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },

  pvpFallbackSubtitle: {
    marginTop: gameScale(6),
    color: '#CDE9FF',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },

  gameQuestionsContainer: {
    flex: 1,
    minHeight: 0,
  },

   gameQuestionsContainerExpanded: {
    maxHeight: gameScale(844 * 0.75), 
  },

  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)' 
  },
  
  loadingText: { 
    color: '#fff', 
    fontSize: gameScale(18), 
    marginTop: gameScale(10), 
    fontWeight: '600' 
  },
  
  errorText: { 
    color: '#ff6b6b', 
    fontSize: gameScale(18), 
    textAlign: 'center', 
    marginHorizontal: gameScale(20), 
    fontWeight: '600' 
  },
  
  retryText: { 
    color: '#fff', 
    fontSize: gameScale(16), 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  
  exitText: { 
    color: '#fff', 
    fontSize: gameScale(16), 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  
  retryButton: {
    backgroundColor: '#4dabf7',
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(10),
    borderRadius: gameScale(10),
    marginTop: gameScale(15),
  },
  
  exitButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(10),
    borderRadius: gameScale(10),
    marginTop: gameScale(10),
  },

  exitGameButton: {
    position: 'absolute',
    top: gameScale(20), 
    left: gameScale(20),
    width: gameScale(40),
    height: gameScale(40),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: gameScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: gameScale(1),
    borderColor: '#4dabf7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: gameScale(5),
  },
  
  exitGameText: {
    color: '#fff',
    fontSize: gameScale(20),
    fontWeight: 'bold',
  },

  // Debug styles
  debugToggle: { 
    position: 'absolute', 
    top: gameScale(20),
    right: gameScale(10), 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    paddingHorizontal: gameScale(12), 
    paddingVertical: gameScale(8), 
    borderRadius: gameScale(20), 
    borderWidth: gameScale(1), 
    borderColor: '#4dabf7',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: gameScale(5),
  },
  debugToggleText: { 
    color: '#4dabf7', 
    fontSize: gameScale(12), 
    fontWeight: 'bold' 
  },
  debugPanel: { 
    position: 'absolute', 
    top: gameScale(20),
    left: gameScale(10), 
    right: gameScale(10), 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(10) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(20),
    elevation: gameScale(20),
    bottom: gameScale(100), 
    backgroundColor: 'rgba(0,0,0,0.95)', 
    borderRadius: gameScale(10), 
    borderWidth: gameScale(1), 
    borderColor: '#4dabf7' 
  },
  debugHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: gameScale(12), 
    borderBottomWidth: gameScale(1), 
    borderBottomColor: '#333' 
  },
  debugTitle: { 
    color: '#fff', 
    fontSize: gameScale(16), 
    fontWeight: 'bold' 
  },
  debugClose: { 
    padding: gameScale(4) 
  },
  debugCloseText: { 
    color: '#ff6b6b', 
    fontSize: gameScale(16), 
    fontWeight: 'bold' 
  },
  debugScrollView: { 
    flex: 1, 
    padding: gameScale(12) 
  },
  debugText: { 
    color: '#fff', 
    fontSize: gameScale(12), 
    lineHeight: gameScale(18) 
  },

  progressContainer: {
    marginTop: gameScale(20),
    alignItems: 'center',
    width: '80%',
  },
  
  progressBar: {
    width: '100%',
    height: gameScale(8),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: gameScale(4),
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: gameScale(4),
  },
  
  progressText: {
    color: '#fff',
    fontSize: gameScale(14),
    marginTop: gameScale(8),
    textAlign: 'center',
  },

   downloadContainer: {
    alignItems: 'center',
    width: '90%',
    paddingHorizontal: gameScale(20),
  },
  
  progressSection: {
    marginTop: gameScale(20),
    alignItems: 'center',
    width: '100%',
  },
  
  progressLabel: {
    color: '#fff',
    fontSize: gameScale(16),
    fontWeight: 'bold',
    marginBottom: gameScale(8),
    textAlign: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: gameScale(12),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: gameScale(6),
    overflow: 'hidden',
    marginBottom: gameScale(8),
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: gameScale(6),
  },
  
  progressPercentage: {
    color: '#fff',
    fontSize: gameScale(14),
    fontWeight: 'bold',
  },
  
  currentAnimationText: {
    color: '#4dabf7',
    fontSize: gameScale(12),
    marginBottom: gameScale(4),
    textAlign: 'center',
  },
  
  currentUrlText: {
    color: '#ffeb3b',
    fontSize: gameScale(10),
    marginTop: gameScale(8),
    textAlign: 'center',
  },
  
  downloadHint: {
    color: '#fff',
    fontSize: gameScale(14),
    marginTop: gameScale(16),
    textAlign: 'center',
    opacity: 0.8,
  },
});