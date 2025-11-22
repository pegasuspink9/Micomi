import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Animated, View } from 'react-native';
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

const ScreenPlay = ({ 
  gameState,
  isPaused = false, 
  borderColor = 'white',
  characterRunState = false,
  onSubmissionAnimationComplete = null,
  isInRunMode = false,
  fadeOutAnim = null,
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

  const enemyRunTimeoutsRef = useRef({});
  const enemyRunSequenceStartedRef = useRef(false);
  const enemyFadeCompleteRef = useRef(false);
  const animationCompleteNotifiedRef = useRef(false); 
  const lastProcessedSubmissionIdRef = useRef(null); 



  const enemies = useMemo(() => processEnemyData(enemiesData), []);

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
  ), [gameState]);

  const playerMaxHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.character?.character_max_health
    ?? gameState.selectedCharacter?.max_health
  ), [gameState]);

  const enemyHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.enemy?.enemy_health ??
    gameState.submissionResult?.levelStatus?.enemyHealth ??
    gameState.enemy?.enemy_health ??
    gameState.enemy?.enemy_max_health
  ), [gameState]);

  const enemyMaxHealth = useMemo(() => (
    gameState.submissionResult?.fightResult?.enemy?.enemy_max_health ??
    gameState.submissionResult?.levelStatus?.enemyMaxHealth ??
    gameState.submissionResult?.levelStatus?.enemy_max_health ??
    gameState.enemy?.enemy_max_health ??
    gameState.enemy?.enemy_health 
  ), [gameState]);


  const playerAvatar = useMemo(() => gameState.avatar?.player, [gameState.avatar?.player]);

  const enemyAvatar = useMemo(() => gameState.avatar?.enemy, [gameState.avatar?.enemy]);



  const characterAnimations = useMemo(() => ({
      character_idle: gameState.submissionResult?.fightResult?.character?.character_idle 
        ?? gameState.selectedCharacter?.character_idle,
      character_attack: gameState.submissionResult?.fightResult?.character?.character_attack 
        ?? gameState.selectedCharacter?.character_attack,
      character_hurt: gameState.submissionResult?.fightResult?.character?.character_hurt 
        ?? gameState.selectedCharacter?.character_hurt,
      character_run: gameState.submissionResult?.fightResult?.character?.character_run 
        ?? gameState.selectedCharacter?.character_run,
      character_dies: gameState.submissionResult?.fightResult?.character?.character_dies 
        ?? gameState.selectedCharacter?.character_dies,
    }), [gameState]);

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
      }, 3000); //  Increased from 2700ms to 3000ms to match run animation (1200ms) + fade-out (300ms) + buffer
    }, 1000); 
  }, 1500);
}, [onSubmissionAnimationComplete]);

  useEffect(() => {
    return () => {
      if (enemyRunTimeoutsRef.current.idle) clearTimeout(enemyRunTimeoutsRef.current.idle);
      if (enemyRunTimeoutsRef.current.run) clearTimeout(enemyRunTimeoutsRef.current.run);
      if (enemyRunTimeoutsRef.current.complete) clearTimeout(enemyRunTimeoutsRef.current.complete);
      enemyRunTimeoutsRef.current = {};
    };
  }, []);



  useEffect(() => {
  const fightResult = gameState?.submissionResult?.fightResult;

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

  if (fightResult?.status === 'won' && 
    fightResult?.enemy?.enemy_health === 0 &&
    victoryAnimationPhase === 'idle') {
  
    console.log('🎉 Victory detected - starting celebration sequence');
    setVictoryAnimationPhase('celebrating');
    setCharacterAnimationState('idle');
    
    victoryTimeoutRef.current = setTimeout(() => {
      console.log('🎉 Celebration complete - notifying animation completion');
      setVictoryAnimationPhase('waiting');

      if (animationCompleteNotifiedRef.current) {
        console.log('⚠️ Animation complete already notified, skipping duplicate');
        return;
      }
      animationCompleteNotifiedRef.current = true;
      
      if (onSubmissionAnimationComplete) {
        onSubmissionAnimationComplete();
      }
    }, 3000); 
   }
  
  return () => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
  };
  }, [gameState?.submissionResult?.fightResult?.status, gameState?.submissionResult?.fightResult?.character?.character_health, gameState?.submissionResult?.fightResult?.enemy?.enemy_health, gameState?.currentChallenge?.id, victoryAnimationPhase, handleEnemyRun, onSubmissionAnimationComplete]);

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
    
    if (animationState === 'hurt') {
      const enemyHealth = fightResult?.enemy?.enemy_health ?? 0;
       const enemyDiesUrl = fightResult?.enemy?.enemy_dies || gameState?.enemy?.enemy_dies;
      
      //  Only transition to dies if API explicitly provides dies animation AND health is 0
            if (enemyDiesUrl && enemyHealth <= 0) {
        console.log('🦹 Enemy hurt completed, dies animation available, health is 0 - transitioning to dies');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'dies' : state));
        return;
      } else if (enemyHealth <= 0 && !enemyDiesUrl) {
        //  Health is 0 but no dies animation (bonus round) - stay on last frame
        console.log('🦹 Enemy health is 0 but no dies animation (bonus round) - staying on hurt frame');
        setIsPlayingSubmissionAnimation(false);
        return;
      } else {
        //  Health > 0 - return to idle
        console.log('🦹 Enemy hurt completed, still alive - returning to idle');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'idle' : state));
        setIsPlayingSubmissionAnimation(false);
        return;
      }
    }
    
    if (animationState === 'dies') {
      console.log('💀 Enemy dies animation completed - staying on last frame');
      setIsPlayingSubmissionAnimation(false);
      return;
    }

    if (animationState === 'attack') {
      console.log('🦹 Enemy attack completed - returning to idle');
      setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'idle' : state));
      return;
    }
  };
}, [gameState?.submissionResult?.fightResult]);

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
      setIsCharacterRunning(false); // NEW: Reset running flag
    }, 2400); // Match character run animation duration
    
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
  const submissionKey = submission ? `${submission.isCorrect}-${submission.attempts || 0}-${submission.fightResult?.character?.character_health ?? ''}-${submission.fightResult?.enemy?.enemy_health ?? ''}`
  : null;

   if (submission && submission.isPotionUsage) {
    console.log('🧪 Potion usage detected - skipping animations');
    return;
  }
  
  if (submission && lastSubmissionKeyRef.current !== submissionKey) {
    lastSubmissionKeyRef.current = submissionKey;

    if (submission.isCorrect === true) {
      //  Check if character has attack URL before attacking
      const attackUrl = Array.isArray(characterAnimations.character_attack)
        ? characterAnimations.character_attack.filter(url => url && typeof url === 'string')[0]
        : characterAnimations.character_attack;

      if (attackUrl) {
        console.log(`⚔️ Correct answer - character has attack URL, will attack enemy`);
        setCharacterAnimationState('attack');
      } else {
        console.log(`⚔️ Correct answer but no attack URL available - staying idle`);
        setCharacterAnimationState('idle');
      }
      
      //  Check if enemy has dies animation from API
      const enemyDiesUrl = submission.fightResult?.enemy?.enemy_dies || gameState?.enemy?.enemy_dies;
      
      if (enemyDiesUrl) {
        console.log('🦹 Enemy dies animation provided by API - enemy will die');
        setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
      } else {
        console.log('🦹 No enemy dies animation - enemy gets hurt only (bonus round scenario)');
        setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
      }
      setIsPlayingSubmissionAnimation(true);
      
    } else if (submission.isCorrect === false) {
      const enemyHealth = submission.fightResult?.enemy?.enemy_health ?? 0;
      
      console.log(`❌ Wrong answer - checking enemy health for counter attack`);
      console.log(`Enemy health: ${enemyHealth}`);
      
      //  Enemy counter-attacks only if health > 0
      if (enemyHealth > 0) {
        console.log(`🦹 Enemy health > 0 - enemy counter attacks character`);
        setEnemyAnimationStates(prev => prev.map(() => 'attack'));
      } else {
        const enemyDiesUrl = submission.fightResult?.enemy?.enemy_dies || gameState?.enemy?.enemy_dies;
        
        if (enemyDiesUrl) {
           console.log(`🦹 Enemy health = 0 (despite wrong answer) - triggering death sequence`);
           setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
        } else {
           console.log(`🦹 Enemy health = 0 - enemy stays idle (already defeated)`);
           setEnemyAnimationStates(prev => prev.map(() => 'idle'));
        }
      }
      
      const characterHurtUrl = submission.fightResult?.character?.character_hurt || gameState?.selectedCharacter?.character_hurt;
      console.log(`🩸 Character hurt URL available: ${!!characterHurtUrl}`);
      
      //  Character gets hurt on wrong answer (stays in place, no attack movement)
      setCharacterAnimationState('hurt');
      setIsPlayingSubmissionAnimation(true);
      
      // Check if character has dies animation from API
      const characterDiesUrl = submission.fightResult?.character?.character_dies;
      const characterHealth = submission.fightResult?.character?.character_health ?? playerHealth;
      
      if (characterDiesUrl && characterHealth <= 0) {
        console.log('💀 Character dies animation provided by API - character will die');
        setCharacterAnimationState('hurt'); // hurt first, then dies
      } else {
        console.log('🩸 Character gets hurt but survives');
        setCharacterAnimationState('hurt');
      }
      setIsPlayingSubmissionAnimation(true);
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
}, [gameState.submissionResult, playerHealth, isPlayingSubmissionAnimation, enemies, characterAnimationState, gameState.selectedCharacter, characterAnimations.character_attack]);

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
  //  Get the enemy data - prioritize API data
  const enemy = gameState.submissionResult?.fightResult?.enemy || gameState.enemy;
  
  if (!enemy) {
    console.warn('⚠️ No enemy data available');
    return {
      character_idle: null,
      character_attack: null,
      character_hurt: null,
      character_run: null,
      character_dies: null,
      enemy_health: enemyHealth
    };
  }
  
  console.log('🦹 Using enemy animations:', {
    enemyName: enemy.enemy_name,
    idle: enemy.enemy_idle?.slice?.(-40),
    attack: enemy.enemy_attack?.slice?.(-40),
    hurt: enemy.enemy_hurt?.slice?.(-40),
    run: enemy.enemy_run?.slice?.(-40),
    dies: enemy.enemy_dies?.slice?.(-40),
  });

  return {
    character_idle: enemy.enemy_idle,
    character_attack: enemy.enemy_attack,
    character_hurt: enemy.enemy_hurt,
    character_run: enemy.enemy_run || 'https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Enemies/Greenland/Dragorn/run_aljsxb.png',
    character_dies: enemy.enemy_dies,
    enemy_health: enemyHealth
  };
}, [
  gameState.submissionResult?.fightResult?.enemy,
  gameState.enemy,
  enemyHealth
]);

  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused} combatBackground={combatBackground}>
        <DogCharacter 
          isPaused={isPaused} 
          characterAnimations={characterAnimations}
          currentState={characterAnimationState}
          onAnimationComplete={handleCharacterAnimationComplete}
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
              currentState={currentEnemyState} 
              onAnimationComplete={handleEnemyAnimationComplete(index)}
            />
          );
        })}

      <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode}>
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
        />
      </FadeOutWrapper>

      <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode}>
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
          borderColor="#ffffffff"
        />
      </FadeOutWrapper>
      
      <Damage
        incoming={damageThisSubmission}
        animated={true}
        startDelay={1000} 
        position="right"
        trigger={submissionSeq} 
      />

      <Damage
        incoming={enemyDamageThisSubmission}
        animated={true}
        startDelay={1000} 
        position="left" 
        trigger={submissionSeq} 
      />

      <Message
        message={gameState.submissionResult?.message || ''}
        trigger={submissionSeq}
        duration={2400}
      />

      <FadeOutWrapper fadeOutAnim={fadeOutAnim} isInRunMode={isInRunMode} style={{zIndex: -1}}>
        <Coin 
          coins={totalCoins}
          onCoinsChange={(newCoins) => console.log(`Total coins display updated: ${newCoins}`)}
          animated={true}
        />
      </FadeOutWrapper>

       
      </GameBackground>
    </GameContainer>
  );
};

export default React.memo(ScreenPlay, (prevProps, nextProps) => {
  return (
    prevProps.gameState?.submissionResult?.isCorrect === nextProps.gameState?.submissionResult?.isCorrect &&
    prevProps.gameState?.selectedCharacter?.current_health === nextProps.gameState?.selectedCharacter?.current_health &&
    prevProps.gameState?.enemy?.enemy_health === nextProps.gameState?.enemy?.enemy_health &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.characterRunState === nextProps.characterRunState && 
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.onSubmissionAnimationComplete === nextProps.onSubmissionAnimationComplete &&
    prevProps.gameState?.avatar?.player === nextProps.gameState?.avatar?.player &&
    prevProps.gameState?.avatar?.enemy === nextProps.gameState?.avatar?.enemy
  );
});