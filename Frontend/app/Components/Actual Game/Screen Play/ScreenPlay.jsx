import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Animated, View, Modal, StyleSheet, Text} from 'react-native';
import enemiesData from '../GameData/Enemy Game Data/EnemyGameData';
import GameContainer from './components/GameContainer';
import GameBackground from './components/GameBackground';
import DogCharacter from './components/Character';
import EnemyCharacter from './components/EnemyCharacter';
import { processEnemyData } from './utils/gameStateHelper';
import Life from './components/Life';
import Coin from './components/Coin';
import Damage from './components/Damage';
import Message from './components/Message';
import FadeOutWrapper from './FadeOutWrapper/FadeOutWrapper';
import PauseButton from './Pauses/PauseButton';
import { gameScale } from '../../Responsiveness/gameResponsive';
import BonusRoundModal from './components/BonusRoundModal'; 
import SpecialSkillIcon from './components/SpecialSkillIcon';
import { soundManager } from '../Sounds/UniversalSoundManager';


const ScreenPlay = ({ 
  gameState,
  isPaused = false, 
  borderColor = 'white',
  characterRunState = false,
  onSubmissionAnimationComplete = null,
  isInRunMode = false,
  fadeOutAnim = null,
  isMessageVisible,
  messageText,
  onPausePress = null,
  setBorderColor,
  isPvpMode = false,
  pvpReactionEvent = 0,
}) => {
  const [attackingEnemies] = useState(new Set());
  const [totalCoins, setTotalCoins] = useState(0);
  const [characterAnimationState, setCharacterAnimationState] = useState('idle');
  const [isPlayingSubmissionAnimation, setIsPlayingSubmissionAnimation] = useState(false);
  const [isCharacterRunning, setIsCharacterRunning] = useState(false);
  const [victoryAnimationPhase, setVictoryAnimationPhase] = useState('idle'); 
  const victoryTimeoutRef = useRef(null);

  const [hasRunCompleted, setHasRunCompleted] = useState(false);
  const [isEnemyRunning, setIsEnemyRunning] = useState(false);
  
  const firstBonusShownRef = useRef(false); 
  const [showBonusRoundText, setShowBonusRoundText] = useState(false); 

  const lastPlayedEnemyAttackKey = useRef(null);

  const enemyRunTimeoutsRef = useRef({});
  const enemyRunSequenceStartedRef = useRef(false);
  const enemyFadeCompleteRef = useRef(false);
  const animationCompleteNotifiedRef = useRef(false); 
  const lastProcessedSubmissionIdRef = useRef(null); 
  const pvpAnimationTimeoutsRef = useRef([]);
  const idleAudioTimeoutsRef = useRef([]);
  const lastIdleAudioSequenceKeyRef = useRef(null);

  const clearIdleAudioTimeouts = useCallback(() => {
    idleAudioTimeoutsRef.current.forEach(clearTimeout);
    idleAudioTimeoutsRef.current = [];
  }, []);




  const characterAttackOverlay = useMemo(() => 
    gameState.submissionResult?.fightResult?.character?.character_attack_overlay || 
    gameState.selectedCharacter?.character_attack_overlay, 
    [gameState.submissionResult, gameState.selectedCharacter]
  );

  const enemyAttackOverlay = useMemo(() => 
    gameState.submissionResult?.fightResult?.enemy?.enemy_attack_overlay || 
    gameState.enemy?.enemy_attack_overlay,
    [gameState.submissionResult, gameState.enemy]
  );

   const enemyCurrentState = useMemo(() => 
    gameState.submissionResult?.fightResult?.enemy?.enemy_current_state || 
    gameState.enemy?.enemy_current_state,
    [gameState.submissionResult, gameState.enemy]
  );

  const characterCurrentState = useMemo(() => 
    gameState.submissionResult?.fightResult?.character?.character_current_state || 
    gameState.selectedCharacter?.character_current_state,
    [gameState.submissionResult, gameState.selectedCharacter]
  );


  const [activeCharReaction, setActiveCharReaction] = useState(null);
  const [activeEnemyReaction, setActiveEnemyReaction] = useState(null);
  const lastLiveReactionSignatureRef = useRef(null);
  const lastSubmissionReactionSignatureRef = useRef(null);
  const pvpSeenReactionIdentifiersRef = useRef(new Set());
  const pvpMaxSeenReactionNumericIdRef = useRef(null);

  const parsePvpReactionToken = useCallback((rawReaction) => {
    if (rawReaction === null || rawReaction === undefined) {
      return null;
    }

    const rawText = String(rawReaction).trim();
    if (!rawText) {
      return null;
    }

    // Supported inputs: "-2-Hi", "-2- Hi", "- 2 - Hi".
    const identifierMatch = rawText.match(/^\s*-\s*([^-]+?)\s*-\s*(.*)$/);
    if (!identifierMatch) {
      return {
        text: rawText,
        identifier: null,
        numericIdentifier: null,
      };
    }

    const identifier = identifierMatch[1]?.trim() || null;
    const payloadText = identifierMatch[2]?.trim() || rawText;
    const numericIdentifier = Number.parseInt(identifier || '', 10);

    return {
      text: payloadText,
      identifier,
      numericIdentifier: Number.isFinite(numericIdentifier) ? numericIdentifier : null,
    };
  }, []);

  useEffect(() => {
    if (!isPvpMode) {
      pvpSeenReactionIdentifiersRef.current = new Set();
      pvpMaxSeenReactionNumericIdRef.current = null;
      return;
    }

    // Reset per challenge so repeated IDs in new rounds are still displayable.
    pvpSeenReactionIdentifiersRef.current = new Set();
    pvpMaxSeenReactionNumericIdRef.current = null;
  }, [isPvpMode, gameState.currentChallenge?.id]);

  useEffect(() => {
    const submissionCharReaction =
      gameState.submissionResult?.fightResult?.character?.character_reaction;
    const submissionEnemyReaction =
      gameState.submissionResult?.fightResult?.enemy?.enemy_reaction;

    const liveCharReaction = gameState.selectedCharacter?.character_reaction ?? null;
    const liveEnemyReaction = gameState.enemy?.enemy_reaction ?? null;

    const sequenceTimeouts = [];
    if (!isPvpMode) {
      const hasSubmissionReaction = Boolean(submissionCharReaction || submissionEnemyReaction);
      const submissionReactionSignature = hasSubmissionReaction
        ? [
            gameState.currentChallenge?.id ?? 'none',
            gameState.submissionResult?.reason ?? 'none',
            gameState.submissionResult?.acceptedForAttack ??
              gameState.submissionResult?.accepted_for_attack ??
              'na',
            gameState.submissionResult?.isCorrect ?? gameState.submissionResult?.is_correct ?? 'na',
            submissionCharReaction || '',
            submissionEnemyReaction || '',
          ].join('|')
        : null;

      // Reset before replaying so identical text can show again in PvE.
      setActiveCharReaction(null);
      setActiveEnemyReaction(null);

      if (
        hasSubmissionReaction &&
        submissionReactionSignature !== lastSubmissionReactionSignatureRef.current
      ) {
        lastSubmissionReactionSignatureRef.current = submissionReactionSignature;

        const isCorrect =
          typeof gameState.submissionResult?.isCorrect === 'boolean'
            ? gameState.submissionResult.isCorrect
            : typeof gameState.submissionResult?.is_correct === 'boolean'
              ? gameState.submissionResult.is_correct
              : true;

        const startTimeout = setTimeout(() => {
          const firstText = isCorrect ? submissionCharReaction : submissionEnemyReaction;
          const secondText = isCorrect ? submissionEnemyReaction : submissionCharReaction;

          const setFirst = isCorrect ? setActiveCharReaction : setActiveEnemyReaction;
          const setSecond = isCorrect ? setActiveEnemyReaction : setActiveCharReaction;

          if (firstText) {
            setFirst(firstText);
          }

          const step2Timeout = setTimeout(() => {
            setFirst(null);

            if (secondText) {
              setSecond(secondText);
            }

            const step3Timeout = setTimeout(() => {
              setSecond(null);
            }, 5000);

            sequenceTimeouts.push(step3Timeout);
          }, 5000);

          sequenceTimeouts.push(step2Timeout);
        }, 4000);

        sequenceTimeouts.push(startTimeout);

        return () => {
          sequenceTimeouts.forEach(clearTimeout);
        };
      }

      if (!hasSubmissionReaction) {
        lastSubmissionReactionSignatureRef.current = null;
      }

      lastLiveReactionSignatureRef.current = null;
      return undefined;
    }

    // PvP path: identifier-driven reactions, not correctness-driven sequencing.
    const hasLiveReaction = Boolean(liveCharReaction || liveEnemyReaction);
    if (!hasLiveReaction) {
      lastLiveReactionSignatureRef.current = null;
      return undefined;
    }

    const liveSignature = [
      liveCharReaction || '',
      liveEnemyReaction || '',
      String(pvpReactionEvent),
    ].join('|');

    if (lastLiveReactionSignatureRef.current === liveSignature) {
      return undefined;
    }
    lastLiveReactionSignatureRef.current = liveSignature;

    const seenIdentifiers = pvpSeenReactionIdentifiersRef.current;

    const rawQueue = [
      { side: 'character', rawText: liveCharReaction, orderHint: 0 },
      { side: 'enemy', rawText: liveEnemyReaction, orderHint: 1 },
    ];

    const liveQueue = rawQueue
      .map((item) => {
        const parsed = parsePvpReactionToken(item.rawText);
        if (!parsed || !parsed.text) {
          return null;
        }

        return {
          ...item,
          text: parsed.text,
          identifier: parsed.identifier,
          numericIdentifier: parsed.numericIdentifier,
        };
      })
      .filter(Boolean)
      .filter((item) => {
        if (!item.identifier) {
          return true;
        }

        const identifierKey = String(item.identifier);
        if (seenIdentifiers.has(identifierKey)) {
          return false;
        }

        if (
          item.numericIdentifier !== null &&
          pvpMaxSeenReactionNumericIdRef.current !== null &&
          item.numericIdentifier <= pvpMaxSeenReactionNumericIdRef.current
        ) {
          return false;
        }

        seenIdentifiers.add(identifierKey);
        if (item.numericIdentifier !== null) {
          const nextMax =
            pvpMaxSeenReactionNumericIdRef.current === null
              ? item.numericIdentifier
              : Math.max(pvpMaxSeenReactionNumericIdRef.current, item.numericIdentifier);
          pvpMaxSeenReactionNumericIdRef.current = nextMax;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.numericIdentifier !== null && b.numericIdentifier !== null) {
          return a.numericIdentifier - b.numericIdentifier;
        }

        return a.orderHint - b.orderHint;
      });

    if (!liveQueue.length) {
      return undefined;
    }

    const playLiveReaction = (index) => {
      if (index >= liveQueue.length) {
        return;
      }

      const item = liveQueue[index];
      const showReaction = item.side === 'character' ? setActiveCharReaction : setActiveEnemyReaction;
      const clearReaction = item.side === 'character' ? setActiveCharReaction : setActiveEnemyReaction;

      showReaction(item.text);

      const hideTimeout = setTimeout(() => {
        clearReaction(null);

        if (index + 1 < liveQueue.length) {
          const nextTimeout = setTimeout(() => {
            playLiveReaction(index + 1);
          }, 160);
          sequenceTimeouts.push(nextTimeout);
        }
      }, 2600);

      sequenceTimeouts.push(hideTimeout);
    };

    const startLiveTimeout = setTimeout(() => {
      playLiveReaction(0);
    }, 80);

    sequenceTimeouts.push(startLiveTimeout);

    return () => {
      sequenceTimeouts.forEach(clearTimeout);
    };
  }, [
    gameState.currentChallenge?.id,
    gameState.submissionResult,
    gameState.selectedCharacter?.character_reaction,
    gameState.enemy?.enemy_reaction,
    isPvpMode,
    parsePvpReactionToken,
    pvpReactionEvent,
  ]);


  const enemies = useMemo(() => {
    return [{
      duration: 10000,
      image: gameState.enemy?.enemy_idle || '',
      attackImage: gameState.enemy?.enemy_attack || '',
    }];
  }, []);

  const [enemyAnimationStates, setEnemyAnimationStates] = useState(() =>
    enemies.map(() => 'idle')
  );

  const lastSubmissionKeyRef = useRef(null);
  
  const enemyPositions = useMemo(
    () => enemies.map(() => new Animated.Value(0)),
    [enemies.length]
  );

  const playerHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.character?.character_health
    ?? gameState.submissionResult?.levelStatus?.playerHealth
    ?? gameState.selectedCharacter?.current_health
    ?? gameState.selectedCharacter?.character_health
    ?? 0
  ), [gameState]);

  const playerMaxHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.character?.character_max_health
    ?? gameState.submissionResult?.levelStatus?.playerMaxHealth
    ?? gameState.selectedCharacter?.max_health
    ?? gameState.selectedCharacter?.character_max_health
    ?? playerHealth
  ), [gameState, playerHealth]);

  const enemyHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.enemy?.enemy_health ??
    gameState.submissionResult?.levelStatus?.enemyHealth ??
    gameState.submissionResult?.levelStatus?.enemy_health ??
    gameState.enemy?.enemy_health ??
    gameState.enemy?.enemy_max_health ??
    0
  ), [gameState]);

  const enemyMaxHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.enemy?.enemy_max_health ??
    gameState.submissionResult?.levelStatus?.enemyMaxHealth ??
    gameState.submissionResult?.levelStatus?.enemy_max_health ??
    gameState.enemy?.enemy_max_health ??
    gameState.enemy?.enemy_health ??
    enemyHealth
  ), [gameState, enemyHealth]);


  const playerAvatar = useMemo(() => (
    gameState.submissionResult?.fightResult?.character?.character_avatar ??
    gameState.selectedCharacter?.character_avatar ??
    gameState.avatar?.player ??
    null
  ), [gameState]);

  const enemyAvatar = useMemo(() => (
    gameState.submissionResult?.fightResult?.enemy?.enemy_avatar ??
    gameState.enemy?.enemy_avatar ??
    gameState.avatar?.enemy ??
    null
  ), [gameState]);

  const enemyAttackType = useMemo(() => 
    gameState.submissionResult?.fightResult?.enemy?.enemy_attack_type ?? 
    gameState.enemy?.enemy_attack_type,
    [gameState.submissionResult, gameState.enemy]
  );

  const characterName = useMemo(() => {
    return gameState.submissionResult?.fightResult?.character?.character_name ?? 
           gameState.selectedCharacter?.character_name ?? 
           '';
  }, [gameState.submissionResult, gameState.selectedCharacter]);

  const characterPlayerName = useMemo(() => {
    return gameState.submissionResult?.fightResult?.character?.player_name ??
      gameState.selectedCharacter?.player_name ??
      null;
  }, [gameState.submissionResult, gameState.selectedCharacter]);

   const characterAttackType = useMemo(() => 
    gameState.submissionResult?.fightResult?.character?.character_attack_type || 
    gameState.selectedCharacter?.character_attack_type,
    [gameState.submissionResult, gameState.selectedCharacter]
  );

  const enemyName = useMemo(() => {
    return gameState.submissionResult?.fightResult?.enemy?.enemy_name ?? 
           gameState.enemy?.enemy_name ??
            'Enemy';
  }, [gameState.submissionResult, gameState.enemy]);

  const enemyPlayerName = useMemo(() => {
    return gameState.submissionResult?.fightResult?.enemy?.player_name ??
      gameState.enemy?.player_name ??
      null;
  }, [gameState.submissionResult, gameState.enemy]);

  const characterSpecialSkill = useMemo(() => {
    const skill = gameState.submissionResult?.fightResult?.character?.special_skill ?? gameState.selectedCharacter?.special_skill;
    if (!skill || !skill.special_skill_image) return null;
    
    return skill;
  }, [gameState]);

  const enemySpecialSkill = useMemo(() => {
    const skill = gameState.submissionResult?.fightResult?.enemy?.special_skill ??
                 gameState.enemy?.special_skill;
    
    if (!skill || !skill.special_skill_image) return null;

    return skill;
  }, [gameState]);

  const characterAnimations = useMemo(() => {
    const base = gameState.selectedCharacter;
    const action = gameState.submissionResult?.fightResult?.character;
    
    return {
      character_idle: action?.character_idle ?? base?.character_idle,
      character_attack: action?.character_attack ?? base?.character_attack,
      character_hurt: action?.character_hurt ?? base?.character_hurt,
      character_run: action?.character_run ?? base?.character_run,
      character_dies: action?.character_dies ?? base?.character_dies,
      character_range_attack: action?.character_range_attack ?? base?.character_range_attack,
      character_is_range: action?.character_is_range ?? base?.character_is_range,
    };
  }, [gameState.submissionResult?.fightResult?.character, gameState.selectedCharacter]);

  const coinsEarned = useMemo(() => 
    gameState.submissionResult?.levelStatus?.coinsEarned ?? 0, 
    [gameState.submissionResult?.levelStatus?.coinsEarned]
  );

  const combatBackground = useMemo(() => gameState?.combat_background, [gameState?.combat_background]);

  const handleEnemyRun = useCallback(() => {
  if (enemyRunSequenceStartedRef.current) {
    console.log('🏃 Enemy run sequence already started, skipping duplicate');
    return;
  }

  console.log('💀 Character defeated - initiating enemy run sequence');
  enemyRunSequenceStartedRef.current = true;
  setIsEnemyRunning(true);
  animationCompleteNotifiedRef.current = false; 
  
  // Step 1: Enemy attacks (1.5 seconds)
  console.log('⚔️ Step 1: Enemy attacking');
  setEnemyAnimationStates(prev => prev.map(() => 'attack'));

  enemyRunTimeoutsRef.current.idle = setTimeout(() => {
    console.log('🦹 Step 2: Enemy attack complete - transitioning to idle');
    setEnemyAnimationStates(prev => prev.map(() => 'idle'));

    enemyRunTimeoutsRef.current.run = setTimeout(() => {
      console.log('🏃 Step 3: Enemy running away');
      setEnemyAnimationStates(prev => prev.map(() => 'run'));

      //  Wait for run animation + fade-out to complete (2.7s total)
      enemyRunTimeoutsRef.current.complete = setTimeout(() => {
        console.log('👻 Step 4: Enemy run + fade-out complete');

        if (animationCompleteNotifiedRef.current) {
          console.log('⚠️ Animation complete already notified, skipping duplicate');
          return;
        }

        animationCompleteNotifiedRef.current = true;
        setIsEnemyRunning(false);
        enemyFadeCompleteRef.current = true;

        if (onSubmissionAnimationComplete) {
          console.log('📤 Notifying animation complete');
          onSubmissionAnimationComplete();
        }

        // Clear all timeouts
        enemyRunTimeoutsRef.current = {};
      }, 4300); // 🐌 Slower: Increased from 3000ms to 3800ms specifically to match the new 2000ms run duration + buffer
    }, 1000);
  }, 1500);
}, [onSubmissionAnimationComplete]);

  useEffect(() => {
    return () => {
      if (enemyRunTimeoutsRef.current.idle) clearTimeout(enemyRunTimeoutsRef.current.idle);
      if (enemyRunTimeoutsRef.current.run) clearTimeout(enemyRunTimeoutsRef.current.run);
      if (enemyRunTimeoutsRef.current.complete) clearTimeout(enemyRunTimeoutsRef.current.complete);
      pvpAnimationTimeoutsRef.current.forEach(clearTimeout);
      pvpAnimationTimeoutsRef.current = [];
      enemyRunTimeoutsRef.current = {};
      clearIdleAudioTimeouts();
    };
  }, [clearIdleAudioTimeouts]);

  // ✅ NEW CALLBACK: When the BonusRoundModal finishes its hide animation
  const handleBonusModalHide = useCallback(() => {
    console.log('🎉 Bonus Round Modal finished hiding, resetting active state.');
    setShowBonusRoundText(false); // Reset the state that controls the modal's visibility
  }, []);


  useEffect(() => {
  const fightResult = gameState?.submissionResult?.fightResult;

  console.log('DEBUG: Bonus Modal Check', {
  firstBonusShownRefCurrent: firstBonusShownRef.current,
  showBonusRoundText: showBonusRoundText,
});

  // The BonusRoundModal component itself will handle the timers and fade animations.

  //  NEW: Create unique submission ID including timestamp to prevent duplicates
  const submissionId = fightResult ? 
    `${gameState?.currentChallenge?.id}-${fightResult.status}-${fightResult.character?.character_health}-${fightResult.enemy?.enemy_health}` 
    : null;

  console.log('🔍 Submission check:', {
    status: fightResult?.status,
    characterHealth: fightResult?.character?.character_health,
    enemyHealth: fightResult?.enemy?.enemy_health,
    submissionId: submissionId,
    lastProcessedId: lastProcessedSubmissionIdRef.current,
    hasRunStarted: enemyRunSequenceStartedRef.current,
    hasFadeComplete: enemyFadeCompleteRef.current,
  });

  if (fightResult?.status === 'lost' && 
      fightResult?.character?.character_health === 0 &&
      !enemyRunSequenceStartedRef.current &&
      !enemyFadeCompleteRef.current &&
      lastProcessedSubmissionIdRef.current !== submissionId) {

    console.log('💀 Lost status detected - starting enemy run sequence');
    lastProcessedSubmissionIdRef.current = submissionId;
    handleEnemyRun();
    return;
  }

   const isCorrect = gameState?.submissionResult?.isCorrect;

    if (fightResult?.status === 'won' && 
    fightResult?.enemy?.enemy_health === 0 &&
    victoryAnimationPhase === 'idle' && isCorrect === true) {
  
    console.log('🎉 Victory detected - starting celebration sequence');
    setVictoryAnimationPhase('celebrating');
    setCharacterAnimationState('idle');
    
    victoryTimeoutRef.current = setTimeout(() => {
      console.log('🏃 Celebration complete - character retreating');
      setVictoryAnimationPhase('waiting');
      
      // TRIGGER RUN STATE
      setCharacterAnimationState('run');
      setIsCharacterRunning(true);
      
      setIsPlayingSubmissionAnimation(true); 

      if (animationCompleteNotifiedRef.current) return;
      
      setTimeout(() => {
        animationCompleteNotifiedRef.current = true;
        if (onSubmissionAnimationComplete) {
          onSubmissionAnimationComplete();
        }
      }, 2500);
    }, 3000); 
   }
  
  return () => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
  };
  }, [
  gameState?.submissionResult?.fightResult?.status, 
  gameState?.submissionResult?.fightResult?.character?.character_health, 
  gameState?.submissionResult?.fightResult?.enemy?.enemy_health, 
  gameState?.currentChallenge?.id, 
  victoryAnimationPhase, 
  handleEnemyRun, 
  onSubmissionAnimationComplete, 
  gameState?.submissionResult?.isCorrect, 
  showBonusRoundText
]);

 useEffect(() => {
  console.log('Enemy health changed to:', enemyHealth);
  if (enemyHealth === 0 && 
      gameState.currentChallenge && 
      gameState.submissionResult?.fightResult?.enemy?.enemy_dies === null &&
      !firstBonusShownRef.current && 
      !showBonusRoundText) {
    console.log('🎉 Enemy defeated, next challenge exists - scheduling bonus modal');
    firstBonusShownRef.current = true;
    
    setTimeout(() => {
      setShowBonusRoundText(true);
    }, 5000); 
  }
}, [enemyHealth, gameState.currentChallenge, gameState.submissionResult?.fightResult?.enemy?.enemy_dies]);

 useEffect(() => {
    if (isEnemyRunning) {
      console.log('🏃 Enemy run in progress - blocking other animation changes');
    }
  }, [isEnemyRunning]);
  
  // Handle coin updates
  useEffect(() => {
    if (coinsEarned > 0) {
      setTotalCoins(prevTotal => {
        const newTotal = prevTotal + coinsEarned;
        console.log(`Coins earned: ${coinsEarned}, Total coins: ${newTotal}`);
        return newTotal;
      });
    }
  }, [coinsEarned]);

   useEffect(() => {
    const potionAudio = gameState.submissionResult?.use_potion_audio;
    if (potionAudio) {
      // Play using soundManager on 'ui' or 'combat' channel
      console.log('🧪 Playing potion audio:', potionAudio);
      soundManager.playCachedSound(potionAudio, 'ui', 1.0);
    }
  }, [gameState.submissionResult?.use_potion_audio]);

  useEffect(() => {
    const submission = gameState?.submissionResult;

    if (!submission || submission?.isPotionUsage) {
      return;
    }

    const fightResult = submission?.fightResult;
    if (!fightResult) {
      return;
    }

    const isCorrect =
      typeof submission?.isCorrect === 'boolean'
        ? submission.isCorrect
        : typeof submission?.is_correct === 'boolean'
          ? submission.is_correct
          : null;

    const acceptedForAttack =
      typeof submission?.acceptedForAttack === 'boolean'
        ? submission.acceptedForAttack
        : typeof submission?.accepted_for_attack === 'boolean'
          ? submission.accepted_for_attack
          : null;

    const attackerIsCharacter =
      isCorrect === true || (isCorrect === null && acceptedForAttack === true);
    const attackerIsEnemy =
      isCorrect === false || (isCorrect === null && acceptedForAttack === false);

    if (!attackerIsCharacter && !attackerIsEnemy) {
      return;
    }

    const submissionAudioKey = [
      gameState?.currentChallenge?.id ?? 'none',
      submission?.reason ?? 'none',
      submission?.acceptedForAttack ?? submission?.accepted_for_attack ?? 'na',
      submission?.isCorrect ?? submission?.is_correct ?? 'na',
      fightResult?.status ?? 'na',
      fightResult?.character?.character_health ?? 'na',
      fightResult?.enemy?.enemy_health ?? 'na',
      submission?.characterAttackAudio ?? submission?.character_attack_audio ?? 'none',
      submission?.enemyAttackAudio ?? submission?.enemy_attack_audio ?? 'none',
      submission?.characterIdleAudio ?? submission?.character_idle_audio ?? 'none',
      submission?.enemyIdleAudio ?? submission?.enemy_idle_audio ?? 'none',
    ].join('|');

    if (lastIdleAudioSequenceKeyRef.current === submissionAudioKey) {
      return;
    }

    lastIdleAudioSequenceKeyRef.current = submissionAudioKey;
    clearIdleAudioTimeouts();

    const characterAttackAudio =
      submission?.characterAttackAudio ?? submission?.character_attack_audio ?? null;
    const enemyAttackAudio = submission?.enemyAttackAudio ?? submission?.enemy_attack_audio ?? null;
    const characterIdleAudio = submission?.characterIdleAudio ?? submission?.character_idle_audio ?? null;
    const enemyIdleAudio = submission?.enemyIdleAudio ?? submission?.enemy_idle_audio ?? null;

    const firstIdleAudio = attackerIsCharacter ? characterIdleAudio : enemyIdleAudio;
    const secondIdleAudio = attackerIsCharacter ? enemyIdleAudio : characterIdleAudio;
    const attackerAttackAudio = attackerIsCharacter ? characterAttackAudio : enemyAttackAudio;

    const attackSoundStartDelayMs = attackerIsCharacter ? 1000 : 500;
    const idlePreDelayMs = 2000;
    const firstIdleDelayMs = attackSoundStartDelayMs + (attackerAttackAudio ? 900 : 120) + idlePreDelayMs;
    const secondIdleDelayMs = firstIdleDelayMs + (firstIdleAudio ? 1000 : 0);

    if (firstIdleAudio) {
      const firstTimeout = setTimeout(() => {
        soundManager.playCachedSound(firstIdleAudio, 'idle', 1.0);
      }, firstIdleDelayMs);
      idleAudioTimeoutsRef.current.push(firstTimeout);
    }

    if (secondIdleAudio) {
      const secondTimeout = setTimeout(() => {
        soundManager.playCachedSound(secondIdleAudio, 'idle', 1.0);
      }, secondIdleDelayMs);
      idleAudioTimeoutsRef.current.push(secondTimeout);
    }
  }, [clearIdleAudioTimeouts, gameState?.currentChallenge?.id, gameState?.submissionResult]);

  useEffect(() => {
  const submission = gameState.submissionResult;
  if (submission?.isCorrect === true && submission?.fightResult?.enemy?.enemy_health <= 0) {
    console.log('🎉 ENEMY DEFEATED! Setting enemy dies animation:', {
      enemyHealth: submission.fightResult.enemy.enemy_health,
      status: submission.fightResult.status,
      hasCompletionRewards: !!submission.completionRewards,
      hasNextLevel: !!submission.nextLevel
    });
  }
}, [gameState.submissionResult]);

    const damageThisSubmission = useMemo(() => 
      gameState.submissionResult?.isPotionUsage ? 0 : gameState.submissionResult?.fightResult?.character?.character_damage,
      [gameState.submissionResult]
    );

  const enemyDamageThisSubmission = useMemo(() => 
  gameState.submissionResult?.isPotionUsage ? 0 : gameState.submissionResult?.fightResult?.enemy?.enemy_damage,
  [gameState.submissionResult]
  );

  const [submissionSeq, setSubmissionSeq] = useState(0);
  
  useEffect(() => {
    if (gameState.submissionResult) {
      setSubmissionSeq(s => s + 1);
    }
  }, [gameState.submissionResult]);

  const handleCharacterAnimationComplete = useCallback((animationState) => {
  console.log(`🎬 Character ${animationState} animation completed`);
  
  const fightResult = gameState?.submissionResult?.fightResult;
  
  if (animationState === 'attack' && 
      fightResult?.status === 'won' && 
      fightResult?.enemy?.enemy_health === 0) {
    console.log('🎉 Character attack completed, enemy defeated - starting celebration');
    setCharacterAnimationState('idle');
    setIsPlayingSubmissionAnimation(false);
    return;
  }
  
  if (animationState === 'hurt') {
    const characterHealth = fightResult?.character?.character_health ?? playerHealth;
    
    if (characterHealth <= 0) {
      console.log('💀 Character hurt completed, health is 0 - transitioning to dies');
      setCharacterAnimationState('dies');
      return; 
    } else {
      console.log('🩸 Character hurt completed, still alive - returning to idle');
      setCharacterAnimationState('idle');
      setIsPlayingSubmissionAnimation(false);
      return;
    }
  }
  
  if (animationState === 'dies') {
    console.log('💀 Character dies animation completed - staying on last frame');
    setIsPlayingSubmissionAnimation(false);
    
    // Trigger game over after delay
    setTimeout(() => {
      if (onSubmissionAnimationComplete) {
        onSubmissionAnimationComplete();
      }
    }, 1000);
    return;
  }

  if (animationState === 'run') {
    console.log('🏃 Character run animation completed - character fading out, do not reset');
    setIsPlayingSubmissionAnimation(false);
    setIsCharacterRunning(false);
    setHasRunCompleted(true);
    // Notify completion but DON'T change state back to idle
    if (onSubmissionAnimationComplete) {
      onSubmissionAnimationComplete();
    }
    return;
  }
  
  if (animationState !== 'idle') {
    setCharacterAnimationState('idle');
    setIsPlayingSubmissionAnimation(false);
  }
}, [gameState?.submissionResult?.fightResult, playerHealth, onSubmissionAnimationComplete]);

  

  const handleEnemyAnimationComplete = useCallback((index) => {
  return (animationState) => {
    console.log(`🎬 Enemy ${index} ${animationState} animation completed`);
    
    const fightResult = gameState?.submissionResult?.fightResult;
    const isBonusRound = gameState.submissionResult?.isBonusRound ?? false;
    
    if (animationState === 'hurt') {
      const enemyHealth = fightResult?.enemy?.enemy_health ?? 0;
      const enemyDiesUrl = fightResult?.enemy?.enemy_dies || gameState?.enemy?.enemy_dies;

      // FIX: Use strict if/else if structure to prevent multiple triggers
      if (fightResult?.status === 'won' && enemyDiesUrl) {
        console.log('🎉 Fight won! Enemy hurt completed, transitioning to dies.');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'dies' : state));
        return;
      } else if (isBonusRound) {
        console.log(`🦹 Enemy is in bonus round, continuing 'hurt' loop.`);
        return;
      } else if (enemyDiesUrl && enemyHealth <= 0) {
        console.log('🦹 Enemy hurt completed, health is 0 - transitioning to dies');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'dies' : state));
        return;
      } else {
        console.log('🦹 Enemy hurt completed, still alive - returning to idle');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'idle' : state));
        return;
      }
    } 
    // The 'dies' animation is a terminal state. Its completion means the sequence is over.
    if (animationState === 'dies') {
      console.log('💀 Enemy dies animation completed. Unlocking submission state.');
      setIsPlayingSubmissionAnimation(false);
      return;
    }

    // After an enemy attacks, it returns to idle. The character's 'hurt' animation handles the state lock.
    if (animationState === 'attack') {
      console.log('🦹 Enemy attack completed - returning to idle');
      setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'idle' : state));
      return;
    }
  };
}, [gameState?.submissionResult]);


useEffect(() => {
  setVictoryAnimationPhase('idle');
  
  return () => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
  };
}, [gameState?.currentChallenge?.id]);



  useEffect(() => {
  if (characterRunState) {
    console.log('🏃 ScreenPlay detected run state - setting character animation');
    setCharacterAnimationState('run');
    setIsPlayingSubmissionAnimation(true);
    setIsCharacterRunning(true); 

    const runTimeout = setTimeout(() => {
      console.log('🏃 Run animation duration complete - returning to idle');
      setCharacterAnimationState('run');
      setIsPlayingSubmissionAnimation(false);
      setIsCharacterRunning(false); 
    }, 3700); // 🐌 Slower: Increased from 2400 to 3200 to match new run sequence duration
    
    return () => clearTimeout(runTimeout);
  }
  }, [characterRunState]);

  useEffect(() => {
  if (isPlayingSubmissionAnimation) {
    console.log(`Skipping animation change - submission animation in progress`);
    return;
  }

   if (hasRunCompleted) {
    console.log(`🏃 Run completed - preventing further animation changes`);
    return;
  }
 
  const submission = gameState.submissionResult;
   const submissionKey = submission && submission.fightResult ? 
    [
      gameState?.currentChallenge?.id ?? 'none',
      submission?.reason ?? 'none',
      submission?.acceptedForAttack ?? submission?.accepted_for_attack ?? 'na',
      submission?.isCorrect ?? 'na',
      submission?.fightResult?.status ?? 'na',
      submission?.fightResult?.character?.character_health ?? 'na',
      submission?.fightResult?.character?.character_current_state ?? 'na',
      submission?.fightResult?.enemy?.enemy_health ?? 'na',
      submission?.fightResult?.enemy?.enemy_current_state ?? 'na',
    ].join('|')
    : null;

   if (submission && submission.isPotionUsage) {
    console.log('🧪 Potion usage detected - skipping animations');
    return;
  }

  if (isPvpMode && submission && !submission.fightResult) {
    console.log('⏳ PvP waiting for authoritative fightResult before animating');
    return;
  }
  
  if (submission && lastSubmissionKeyRef.current !== submissionKey) {
    lastSubmissionKeyRef.current = submissionKey;

    if (isPvpMode) {
      pvpAnimationTimeoutsRef.current.forEach(clearTimeout);
      pvpAnimationTimeoutsRef.current = [];

      const cState = submission.fightResult?.character?.character_current_state || 'idle';
      const eState = submission.fightResult?.enemy?.enemy_current_state || 'idle';

      const mapState = (state) => {
        const normalizedState = String(state || 'idle').toLowerCase();
        if (normalizedState === 'attacking' || normalizedState === 'attack') return 'attack';
        if (normalizedState === 'hurt') return 'hurt';
        if (normalizedState === 'dead' || normalizedState === 'dying' || normalizedState === 'dies') return 'dies';
        return 'idle'; 
      };

      const finalCharAnim = mapState(cState);
      const finalEnemyAnim = mapState(eState);
      
      console.log(`⚔️ PvP Mode Sync: Character -> ${finalCharAnim}, Enemy -> ${finalEnemyAnim}`);
      
      const charHurtDelay = (finalEnemyAnim === 'attack' && finalCharAnim === 'hurt') ? 800 : 0;
      const enemyHurtDelay = (finalCharAnim === 'attack' && finalEnemyAnim === 'hurt') ? 800 : 0;

      if (charHurtDelay > 0) {
        setCharacterAnimationState('idle'); 
        const timeoutId = setTimeout(() => setCharacterAnimationState(finalCharAnim), charHurtDelay);
        pvpAnimationTimeoutsRef.current.push(timeoutId);
      } else {
        setCharacterAnimationState(finalCharAnim);
      }

      if (enemyHurtDelay > 0) {
        setEnemyAnimationStates(prev => prev.map(() => 'idle'));
        const timeoutId = setTimeout(() => setEnemyAnimationStates(prev => prev.map(() => finalEnemyAnim)), enemyHurtDelay);
        pvpAnimationTimeoutsRef.current.push(timeoutId);
      } else {
        setEnemyAnimationStates(prev => prev.map(() => finalEnemyAnim));
      }

      if (finalCharAnim !== 'idle' || finalEnemyAnim !== 'idle') {
        setIsPlayingSubmissionAnimation(true);
      } else {
        setIsPlayingSubmissionAnimation(false);
      }
      
      return;
    }

    if (submission.isCorrect === true) {
      //  Check if character has attack URL before attacking
      const attackUrl = Array.isArray(characterAnimations.character_attack)
        ? characterAnimations.character_attack.filter(url => url && typeof url === 'string')[0]
        : characterAnimations.character_attack;

      if (attackUrl) {
        console.log(`⚔️ Correct answer - character will attack`);
        setCharacterAnimationState('attack');
        setIsPlayingSubmissionAnimation(true); // Lock state during attack.
      } else {
        console.log(`⚔️ Correct answer but no attack animation available`);
        setCharacterAnimationState('idle');
      }
      
      // Delay the enemy's reaction to sync with the character's attack impact.
      const hurtDelay = 800; // 800ms delay.
      setTimeout(() => {
        console.log(`💥 Enemy reaction delayed by ${hurtDelay}ms`);
        setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
      }, hurtDelay);
      
    } else if (submission.isCorrect === false) {
      const enemyHealth = submission.fightResult?.enemy?.enemy_health ?? 0;
      const enemyDiesUrl = submission.fightResult?.enemy?.enemy_dies || gameState?.enemy?.enemy_dies;
      const fightStatus = submission.fightResult?.status;
      
      console.log(`❌ Wrong answer - enemy will counter attack`, {
        enemyHealth,
        fightStatus,
        enemyDiesUrl: !!enemyDiesUrl
      });
        if (fightStatus === 'won' && enemyDiesUrl && enemyHealth <= 0) {
        console.log(`🎉 Level won despite wrong answer! Initiating final blow sequence.`);
        setIsPlayingSubmissionAnimation(true);

        // 1. Trigger Character Attack (if available)
        const attackUrl = Array.isArray(characterAnimations.character_attack)
        ? characterAnimations.character_attack.filter(url => url && typeof url === 'string')[0]
        : characterAnimations.character_attack;

        if (attackUrl) {
           console.log(`⚔️ Character attacking for final blow`);
           setCharacterAnimationState('attack');
        } else {
           console.log(`⚔️ No attack animation, skipping to enemy reaction`);
        }
        
        // 2. Delay Enemy Hurt/Die to sync with attack
        const hurtDelay = attackUrl ? 800 : 0; // 800ms delay if attacking, immediate if not

        setTimeout(() => {
           console.log(`💥 Enemy taking final damage (delayed by ${hurtDelay}ms)`);
           // Set enemy to hurt first, then handleEnemyAnimationComplete will transition to dies
           setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
        }, hurtDelay);

        return;
      }
      
      // Normal Wrong Answer Flow: Enemy attacks
      console.log(`❌ Normal wrong answer flow - enemy attacking`);
      
      // Enemy begins their attack immediately.
      if (enemyHealth > 0) {
        setEnemyAnimationStates(prev => prev.map(() => 'attack'));
      } else {
        // If enemy is already defeated but no dies animation, return to idle
        setEnemyAnimationStates(prev => prev.map(() => 'idle'));
      }
      
      // Lock the game state to prevent other actions.
      setIsPlayingSubmissionAnimation(true);
      
      // Delay the character's reaction to sync with the enemy's attack impact.
      const hurtDelay = 800; // 800ms delay to match damage number appearance.
      setTimeout(() => {
        console.log(`💥 Character reaction delayed by ${hurtDelay}ms`);
        setCharacterAnimationState('hurt');
      }, hurtDelay);
    }
    return;
  }

  //  Only force dies if health is 0 AND dies animation is explicitly provided
  const characterDiesUrl = gameState.submissionResult?.fightResult?.character?.character_dies || 
                           gameState.selectedCharacter?.character_dies;
  
  if (playerHealth <= 0 && characterDiesUrl && characterAnimationState !== 'dies' && !isPlayingSubmissionAnimation) {
    console.log(`💀 Player health is 0 and dies animation available - transitioning to dies`);
    setCharacterAnimationState('dies');
    setIsPlayingSubmissionAnimation(true);
    return;
  }

  if (!submission && characterAnimationState !== 'idle' && playerHealth > 0 && !isPlayingSubmissionAnimation) {
    console.log(`🧘 No submission result - returning to idle`);
    setCharacterAnimationState('idle');
    setEnemyAnimationStates(enemies.map(() => 'idle'));
    lastSubmissionKeyRef.current = null;
  }
}, [gameState.submissionResult, gameState?.currentChallenge?.id, playerHealth, isPlayingSubmissionAnimation, enemies, characterAnimationState, gameState.selectedCharacter, characterAnimations.character_attack, isPvpMode]);

  useEffect(() => {
    if (__DEV__ && Math.random() < 0.1) { 
      console.log(`Character animations available:`, {
        idle: !!characterAnimations.character_idle,
        attack: !!characterAnimations.character_attack,
        hurt: !!characterAnimations.character_hurt,
        run: !!characterAnimations.character_run,
        dies: !!characterAnimations.character_dies,
      });
      console.log(`Current animation state: ${characterAnimationState}`);
      console.log(`Is playing submission animation: ${isPlayingSubmissionAnimation}`);
      console.log(`Player health: ${playerHealth}/${playerMaxHealth}`);
      console.log(`Enemy health: ${enemyHealth}/${enemyMaxHealth}`);
    }
  }, [characterAnimations, characterAnimationState, isPlayingSubmissionAnimation, playerHealth, playerMaxHealth, enemyHealth, enemyMaxHealth]);

  const enemyAnimations = useMemo(() => {
    const base = gameState.enemy;
    const action = gameState.submissionResult?.fightResult?.enemy;
  
    return {
      character_idle: action?.enemy_idle ?? base?.enemy_idle,
      character_attack: action?.enemy_attack ?? base?.enemy_attack,
      character_hurt: action?.enemy_hurt ?? base?.enemy_hurt,
      character_run: action?.enemy_run ?? base?.enemy_run,
      character_dies: action?.enemy_dies ?? base?.enemy_dies,
      enemy_idle: action?.enemy_idle ?? base?.enemy_idle,
      enemy_attack: action?.enemy_attack ?? base?.enemy_attack,
      enemy_hurt: action?.enemy_hurt ?? base?.enemy_hurt,
      enemy_run: action?.enemy_run ?? base?.enemy_run,
      enemy_dies: action?.enemy_dies ?? base?.enemy_dies,
    };
  }, [gameState.submissionResult?.fightResult?.enemy, gameState.enemy]);

  const enemyAnimationTriggerKey = useMemo(() => {
    const submission = gameState?.submissionResult;
    const fightResult = submission?.fightResult;

    if (!fightResult) {
      return `idle-${gameState?.currentChallenge?.id ?? 'none'}`;
    }

    return [
      gameState?.currentChallenge?.id ?? 'none',
      submission?.reason ?? 'none',
      submission?.acceptedForAttack ?? submission?.accepted_for_attack ?? 'na',
      fightResult?.status ?? 'na',
      fightResult?.character?.character_health ?? 'na',
      fightResult?.character?.character_current_state ?? 'na',
      fightResult?.enemy?.enemy_health ?? 'na',
      fightResult?.enemy?.enemy_current_state ?? 'na',
    ].join('|');
  }, [gameState?.currentChallenge?.id, gameState?.submissionResult]);

  return (
    <GameContainer borderColor={borderColor}   setBorderColor={setBorderColor}>
      <GameBackground 
        isPaused={isPaused} 
        isPvpMode={isPvpMode}
        combatBackground={combatBackground}
        characterCurrentState={characterCurrentState}
        characterAttackType={characterAttackType}
      >
        <DogCharacter 
          isPaused={isPaused} 
          characterAnimations={characterAnimations}
          currentState={characterAnimationState}
          onAnimationComplete={handleCharacterAnimationComplete}
          attackAudioUrl={gameState.submissionResult?.characterAttackAudio}
          isBonusRound={gameState.submissionResult?.isBonusRound ?? false}
          characterName={characterName}
          potionEffectUrl={gameState.submissionResult?.use_potion_effect}
          attackOverlayUrl={characterAttackOverlay} 
          statusState={characterCurrentState} // ✅ Passing character status
          enemyStatusState={enemyCurrentState} 
          hurtAudioUrl={gameState.submissionResult?.characterHurtAudio}
          reactionText={activeCharReaction}
        />

         {enemies.map((enemy, index) => {
          if (!enemyPositions[index] || isCharacterRunning) return null;
          
          const currentEnemyState = isCharacterRunning || hasRunCompleted 
            ? enemyAnimationStates[index] 
            : (enemyAnimationStates[index] || 'idle');
          return (
         <EnemyCharacter
              key={`enemy-${index}`}
              enemy={enemy}
              index={index}
              enemyPosition={enemyPositions[index]}
              isAttacking={attackingEnemies.has(index)}
              isPaused={isPaused || isCharacterRunning} 
              characterAnimations={enemyAnimations}
              enemyName={enemyName}
              currentState={currentEnemyState} 
              isBonusRound={gameState.submissionResult?.isBonusRound ?? false}
              fightStatus={gameState.submissionResult?.fightResult?.status}
              attackAudioUrl={gameState.submissionResult?.enemyAttackAudio}
              onAnimationComplete={handleEnemyAnimationComplete(index)}
              attackOverlayUrl={enemyAttackOverlay}
              enemyCurrentState={enemyCurrentState}
              reactionText={activeEnemyReaction}
              hurtAudioUrl={gameState.submissionResult?.enemyHurtAudio}
              matchCharacterStyle={isPvpMode}
              animationTriggerKey={enemyAnimationTriggerKey}
            />
          );
        })}

      <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode}>
        {isPvpMode && Boolean(characterPlayerName) && (
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              top: gameScale(-4),
              left: gameScale(42),
              maxWidth: gameScale(120),
              color: '#f8fcff',
              fontSize: gameScale(10),
              fontFamily: 'DynaPuff',
              textShadowColor: 'rgba(0, 0, 0, 0.7)',
              textShadowOffset: { width: gameScale(1), height: gameScale(1) },
              textShadowRadius: gameScale(2),
              zIndex: 50,
            }}
          >
            {characterPlayerName}
          </Text>
        )}

        <Life 
          health={playerHealth}
          maxHealth={playerMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`Player health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="left"
          avatarUrl={playerAvatar}
          isEnemy={false}
          borderColor="rgba(255, 255, 255, 0.8)"
          startDelay={1000}     // RENAMED: from healthDelay
          trigger={submissionSeq}
        />

        {characterSpecialSkill && (
          <SpecialSkillIcon 
            image={characterSpecialSkill.special_skill_image}
            description={characterSpecialSkill.special_skill_description}
            position="left"
            streak={characterSpecialSkill.streak}
          />
        )}

      </FadeOutWrapper>

      <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode}>
        <PauseButton onPress={onPausePress} />
      </FadeOutWrapper>


      <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode}>
        {isPvpMode && Boolean(enemyPlayerName) && (
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              top: gameScale(-4),
              right: gameScale(42),
              maxWidth: gameScale(120),
              color: '#f8fcff',
              fontSize: gameScale(10),
              fontFamily: 'DynaPuff',
              textAlign: 'right',
              textShadowColor: 'rgba(0, 0, 0, 0.7)',
              textShadowOffset: { width: gameScale(1), height: gameScale(1) },
              textShadowRadius: gameScale(2),
              zIndex: 50,
            }}
          >
            {enemyPlayerName}
          </Text>
        )}

        <Life 
          health={enemyHealth}
          maxHealth={enemyMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`Enemy health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="right"
          avatarUrl={enemyAvatar}
          isEnemy={true}
          flipEnemyAvatar={isPvpMode}
          borderColor="#ffffffff"
          startDelay={600}     
          trigger={submissionSeq}
        />
        
         {enemySpecialSkill && (
          <SpecialSkillIcon 
            image={enemySpecialSkill.special_skill_image}
            description={enemySpecialSkill.special_skill_description}
            position="right"
            streak={enemySpecialSkill.streak}
          />
        )}
      </FadeOutWrapper>
      
      <Damage
        incoming={damageThisSubmission}
        animated={true}
        startDelay={1000} 
        position="right"
        trigger={submissionSeq} 
        isBonusRound={gameState.submissionResult?.isBonusRound ?? false}
      />

      <Damage
        incoming={enemyDamageThisSubmission}
        animated={true}
        startDelay={600} 
        position="left" 
        trigger={submissionSeq} 
      />

      <Message
        message={messageText} 
        trigger={submissionSeq}
        duration={2400}
        visible={isMessageVisible}
      />

      {!isPvpMode && (
        <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode} style={{zIndex: -1}}>
          <Coin 
            coins={totalCoins}
            onCoinsChange={(newCoins) => console.log(`Total coins display updated: ${newCoins}`)}
            animated={true}
          />
        </FadeOutWrapper>
      )}
        
      {/* ✅ NEW: Render the BonusRoundModal component */}
      <BonusRoundModal 
        visible={showBonusRoundText} // ✅ Controlled by the new state
        message="Bonus Round!" 
        duration={3000} 
        onHide={handleBonusModalHide} 
      />

       
      </GameBackground>
    </GameContainer>
  );
};



export default React.memo(ScreenPlay, (prevProps, nextProps) => {
  if (prevProps.isPvpMode || nextProps.isPvpMode) {
    return false;
  }

  return (
    prevProps.gameState?.submissionResult?.isCorrect === nextProps.gameState?.submissionResult?.isCorrect &&
    prevProps.gameState?.selectedCharacter?.current_health === nextProps.gameState?.selectedCharacter?.current_health &&
    prevProps.gameState?.selectedCharacter?.max_health === nextProps.gameState?.selectedCharacter?.max_health &&
    prevProps.gameState?.enemy?.enemy_health === nextProps.gameState?.enemy?.enemy_health &&
    prevProps.gameState?.enemy?.enemy_max_health === nextProps.gameState?.enemy?.enemy_max_health &&
    (prevProps.gameState?.submissionResult?.fightResult?.enemy?.enemy_attack_type === 
     nextProps.gameState?.submissionResult?.fightResult?.enemy?.enemy_attack_type) &&
    (prevProps.gameState?.enemy?.enemy_attack_type === 
     nextProps.gameState?.enemy?.enemy_attack_type) &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.characterRunState === nextProps.characterRunState && 
    prevProps.isPaused === nextProps.isPaused &&
    // ✅ ADDED: This ensures the component re-renders when the message visibility changes.
    prevProps.isMessageVisible === nextProps.isMessageVisible &&
    prevProps.messageText === nextProps.messageText && 
    prevProps.onSubmissionAnimationComplete === nextProps.onSubmissionAnimationComplete &&
    prevProps.gameState?.avatar?.player === nextProps.gameState?.avatar?.player &&
    prevProps.gameState?.avatar?.enemy === nextProps.gameState?.avatar?.enemy &&
    prevProps.isPvpMode === nextProps.isPvpMode
  );
});