import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
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

const ScreenPlay = ({ 
  gameState,
  isPaused = false, 
  borderColor = 'white',
  onSubmissionAnimationComplete = null,
}) => {
  const [attackingEnemies] = useState(new Set());
  const [totalCoins, setTotalCoins] = useState(0);
  const [characterAnimationState, setCharacterAnimationState] = useState('idle');
  const [isPlayingSubmissionAnimation, setIsPlayingSubmissionAnimation] = useState(false);
  const [victoryAnimationPhase, setVictoryAnimationPhase] = useState('idle'); 
  const victoryTimeoutRef = useRef(null);

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

useEffect(() => {
  const fightResult = gameState?.submissionResult?.fightResult;
  
  if (fightResult?.status === 'won' && 
      fightResult?.enemy?.enemy_health === 0 &&
      victoryAnimationPhase === 'idle') {
    
    console.log('🎉 Victory detected - starting celebration sequence');
    setVictoryAnimationPhase('celebrating');
    
    // ✅ Fix: Use setCharacterAnimationState instead of setCharacterState
    setCharacterAnimationState('idle');
    
    victoryTimeoutRef.current = setTimeout(() => {
      console.log('🎉 Celebration complete - notifying animation completion');
      setVictoryAnimationPhase('waiting');
      
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
}, [gameState?.submissionResult?.fightResult, victoryAnimationPhase, onSubmissionAnimationComplete]);


  
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

  // ✅ Memoize damage values
  const damageThisSubmission = useMemo(() => 
    gameState.submissionResult?.fightResult?.character?.character_damage,
    [gameState.submissionResult?.fightResult?.character?.character_damage]
  );

  const enemyDamageThisSubmission = useMemo(() => 
    gameState.submissionResult?.fightResult?.enemy?.enemy_damage,
    [gameState.submissionResult?.fightResult?.enemy?.enemy_damage]
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
  
  // ✅ Handle attack completion in victory scenario
  if (animationState === 'attack' && 
      fightResult?.status === 'won' && 
      fightResult?.enemy?.enemy_health === 0) {
    console.log('🎉 Character attack completed, enemy defeated - starting celebration');
    setCharacterAnimationState('idle');
    setIsPlayingSubmissionAnimation(false);
    return;
  }
  
  // ✅ Handle hurt animation completion
  if (animationState === 'hurt') {
    const characterHealth = fightResult?.character?.character_health ?? playerHealth;
    
    if (characterHealth <= 0) {
      console.log('💀 Character hurt completed, health is 0 - transitioning to dies');
      setCharacterAnimationState('dies');
      return; // Don't reset isPlayingSubmissionAnimation yet
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
      
      if (enemyHealth <= 0) {
        console.log('🦹 Enemy hurt completed, health is 0 - transitioning to dies');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'dies' : state));
        return; // Don't reset isPlayingSubmissionAnimation yet
      } else {
        console.log('🦹 Enemy hurt completed, still alive - returning to idle');
        setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'idle' : state));
        setIsPlayingSubmissionAnimation(false);
        return;
      }
    }
    
    // ✅ Handle enemy dies animation
    if (animationState === 'dies') {
      console.log('💀 Enemy dies animation completed - staying on last frame');
      setIsPlayingSubmissionAnimation(false);
      // Enemy stays in dies state, character will handle victory celebration
      return;
    }
    
    // ✅ Handle enemy attack animation
    if (animationState === 'attack') {
      console.log('🦹 Enemy attack completed - returning to idle');
      setEnemyAnimationStates(prev => prev.map((state, i) => i === index ? 'idle' : state));
      // Don't reset isPlayingSubmissionAnimation - let character hurt animation complete first
      return;
    }
  };
}, [gameState?.submissionResult?.fightResult]);

// ✅ Reset victory phase when new challenge loads
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
  if (isPlayingSubmissionAnimation) {
    console.log(`Skipping animation change - submission animation in progress`);
    return;
  }

  const submission = gameState.submissionResult;
  const submissionKey = submission
    ? `${submission.isCorrect}-${submission.attempts || 0}-${submission.fightResult?.character?.character_health ?? ''}-${submission.fightResult?.enemy?.enemy_health ?? ''}`
    : null;

  if (submission && lastSubmissionKeyRef.current !== submissionKey) {
    lastSubmissionKeyRef.current = submissionKey;

    if (submission.isCorrect === true) {
      console.log(`✅ Correct answer - character attacks enemy`);
      setCharacterAnimationState('attack');
      
      // ✅ Enemy gets hurt first, then check if dies
      const enemyHealth = submission.fightResult?.enemy?.enemy_health ?? enemyHealth;
      if (enemyHealth <= 0) {
        console.log('🦹 Enemy will die from this attack');
        setEnemyAnimationStates(prev => prev.map(() => 'hurt')); // hurt first, dies will be triggered by animation complete
      } else {
        console.log('🦹 Enemy gets hurt but survives');
        setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
      }
      setIsPlayingSubmissionAnimation(true);
    } else if (submission.isCorrect === false) {
      console.log(`❌ Wrong answer - enemy attacks character`);
      
      setEnemyAnimationStates(prev => prev.map(() => 'attack'));
      
      const characterHealth = submission.fightResult?.character?.character_health ?? playerHealth;
      
      if (characterHealth <= 0) {
        console.log('💀 Character will die from this attack');
        setCharacterAnimationState('hurt'); // hurt first, dies will be triggered by animation complete
      } else {
        console.log('🩸 Character gets hurt but survives');
        setCharacterAnimationState('hurt');
      }
      setIsPlayingSubmissionAnimation(true);
    }
    return;
  }

  if (playerHealth <= 0 && characterAnimationState !== 'dies' && !isPlayingSubmissionAnimation) {
    console.log(`💀 Player health is 0 - transitioning to dies animation`);
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
}, [gameState.submissionResult, playerHealth, isPlayingSubmissionAnimation, enemies, characterAnimationState]);

  useEffect(() => {
    if (__DEV__ && Math.random() < 0.1) { // Only log 10% of the time
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

  
        const enemyAnimations = useMemo(() => ({
          character_idle:
            gameState.submissionResult?.fightResult?.enemy?.enemy_idle ??
            gameState.enemy?.enemy_idle ??
            enemies[0]?.character_idle ??
            enemies[0]?.enemy_idle ??
            enemies[0]?.idle,
          character_attack:
            gameState.submissionResult?.fightResult?.enemy?.enemy_attack ??
            gameState.enemy?.enemy_attack ??
            enemies[0]?.character_attack ??
            enemies[0]?.enemy_attack ??
            enemies[0]?.attack,
          character_hurt:
            gameState.submissionResult?.fightResult?.enemy?.enemy_hurt ??
            gameState.enemy?.enemy_hurt ??
            enemies[0]?.character_hurt ??
            enemies[0]?.enemy_hurt ??
            enemies[0]?.hurt,
          character_run:
            gameState.submissionResult?.fightResult?.enemy?.enemy_run ??
            gameState.enemy?.enemy_run ??
            enemies[0]?.character_run ??
            enemies[0]?.enemy_run ??
            enemies[0]?.run,
          character_dies:
            gameState.submissionResult?.fightResult?.enemy?.enemy_dies ??
            gameState.enemy?.enemy_dies ??
            enemies[0]?.character_dies ??
            enemies[0]?.enemy_dies ??
            enemies[0]?.dies,
          enemy_health: enemyHealth
        }), [gameState, enemies, enemyHealth]);


  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused}>
        <DogCharacter 
          isPaused={isPaused} 
          characterAnimations={characterAnimations}
          currentState={characterAnimationState}
          onAnimationComplete={handleCharacterAnimationComplete}
        />

        <Life 
          health={playerHealth}
          maxHealth={playerMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`Player health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="left"
          avatarUrl={gameState.submissionResult?.fightResult?.character?.character_avatar ?? 
                    gameState.selectedCharacter?.character_avatar }
          isEnemy={false}
          borderColor="rgba(255, 255, 255, 0.8)"
        />

        <Life 
          health={enemyHealth}
          maxHealth={enemyMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`Enemy health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="right"
          avatarUrl={gameState.submissionResult?.fightResult?.enemy?.enemy_avatar ?? 
             gameState.enemy?.enemy_avatar ??
             "https://github.com/user-attachments/assets/a674f682-c784-447e-8c0a-a841f65b18ed"}
          isEnemy={true}
          borderColor="#ffffffff"
        />
        
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

        <Coin 
          coins={totalCoins}
          onCoinsChange={(newCoins) => console.log(`Total coins display updated: ${newCoins}`)}
          animated={true}
        />

        {enemies.map((enemy, index) => {
        if (!enemyPositions[index]) return null;

          return (
            <EnemyCharacter
              key={`enemy-${index}`}
              enemy={enemy}
              index={index}
              enemyPosition={enemyPositions[index]}
              isAttacking={attackingEnemies.has(index)}
              isPaused={isPaused}
              characterAnimations={enemyAnimations}
              currentState={enemyAnimationStates[index] || 'idle'}
              onAnimationComplete={handleEnemyAnimationComplete(index)}
            />
          );
        })}
      </GameBackground>
    </GameContainer>
  );
};

// ✅ Memoize ScreenPlay with custom comparison
export default React.memo(ScreenPlay, (prevProps, nextProps) => {
  return (
    prevProps.gameState?.submissionResult?.isCorrect === nextProps.gameState?.submissionResult?.isCorrect &&
    prevProps.gameState?.selectedCharacter?.current_health === nextProps.gameState?.selectedCharacter?.current_health &&
    prevProps.gameState?.enemy?.enemy_health === nextProps.gameState?.enemy?.enemy_health &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.onSubmissionAnimationComplete === nextProps.onSubmissionAnimationComplete
  );
});