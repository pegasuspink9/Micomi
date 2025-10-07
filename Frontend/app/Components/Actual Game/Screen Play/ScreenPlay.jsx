import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import enemiesData from '../GameData/Enemy Game Data/EnemyGameData';
import GameContainer from './components/GameContainer';
import GameBackground from './components/GameBackground';
import DogCharacter from './components/DogCharacter';
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

  // ✅ Memoize character animations
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

  // ✅ Memoize coins earned
  const coinsEarned = useMemo(() => 
    gameState.submissionResult?.levelStatus?.coinsEarned ?? 0, 
    [gameState.submissionResult?.levelStatus?.coinsEarned]
  );
  
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

    const handleCharacterAnimationComplete = useCallback((completedAnimationState) => {
        console.log(`Character animation "${completedAnimationState}" completed`);
    
    if (!['attack', 'hurt', 'dies'].includes(completedAnimationState)) {
      return;
    } 
    
    setIsPlayingSubmissionAnimation(false);
    
    // ✅ Check if character should die AFTER hurt animation completes
    if (completedAnimationState === 'hurt' && playerHealth <= 0) {
      console.log('🐕 Character hurt animation completed, but health is 0 - setting dies animation');
      setCharacterAnimationState('dies');
      setIsPlayingSubmissionAnimation(true);
      return;
    }
    
    // ✅ Stay in dies state if character died
    if (completedAnimationState === 'dies') {
      console.log('🐕 Character death animation completed - staying in dies state');
      return;
    }
    
    // ✅ Return to idle if character is alive
    if (playerHealth > 0 && completedAnimationState !== 'idle') {
      setCharacterAnimationState('idle');
    }
    
    if (['attack', 'hurt'].includes(completedAnimationState)) {
      if (typeof onSubmissionAnimationComplete === 'function') {
        try {
          console.log(`Notifying parent that animation sequence is complete`);
          onSubmissionAnimationComplete();
        } catch (error) {
          console.warn('Error calling onSubmissionAnimationComplete:', error);
        }
      }
    }
  }, [playerHealth, onSubmissionAnimationComplete]);


const handleEnemyAnimationComplete = useCallback((index) => (completedAnimationState) => {
  console.log(`Enemy ${index} animation "${completedAnimationState}" completed`);

  // ✅ Check if enemy should die AFTER hurt animation completes
  if (completedAnimationState === 'hurt' && enemyHealth <= 0) {
    console.log('🦹 Enemy hurt animation completed, but health is 0 - setting dies animation');
    setEnemyAnimationStates(prev => prev.map(() => 'dies'));
    setIsPlayingSubmissionAnimation(true);
    return;
  }

  if (completedAnimationState === 'dies') {
    console.log('🦹 Enemy death animation completed - enemy defeated!');
    
    if (typeof onSubmissionAnimationComplete === 'function') {
      console.log('📢 Notifying parent that enemy death sequence is complete');
      setTimeout(() => {
        onSubmissionAnimationComplete();
      }, 500);
    }
  }
    
    setEnemyAnimationStates(prev => {
      const next = [...prev];
      if (completedAnimationState === 'dies') {
        next[index] = 'dies'; 
      } else if (completedAnimationState === 'attack' && enemyHealth > 0) {
        next[index] = 'idle'
      } else if (enemyHealth > 0) {
        next[index] = 'idle';
      }
      return next;
    });
}, [enemyHealth, onSubmissionAnimationComplete]);

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
      console.log(`Correct answer - setting player attack`);
      setCharacterAnimationState('attack');
      
      console.log('🦹 Enemy hurt animation first');
      setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
      setIsPlayingSubmissionAnimation(true);
    } else if (submission.isCorrect === false) {
      console.log(`Wrong answer - setting enemy attack, player hurt (health: ${playerHealth})`);
      setEnemyAnimationStates(prev => prev.map(() => 'attack'));
      setCharacterAnimationState('hurt');
      setIsPlayingSubmissionAnimation(true);
    }
    return;
  }

  if (!submission && playerHealth <= 0 && characterAnimationState !== 'dies') {
    console.log(`Player died - setting dies animation`);
    setCharacterAnimationState('dies');
    setIsPlayingSubmissionAnimation(true);
    return;
  }

  if (!submission && characterAnimationState !== 'idle' && playerHealth > 0) {
    console.log(`No submission result - setting idle animation`);
    setCharacterAnimationState('idle');
    setIsPlayingSubmissionAnimation(false);
    lastSubmissionKeyRef.current = null;
    setEnemyAnimationStates(enemies.map(() => 'idle'));
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
          borderColor="#F44336"
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

          // ✅ Memoize enemy animations per enemy
          const enemyAnimations = useMemo(() => ({
            character_idle:
              gameState.submissionResult?.fightResult?.enemy?.enemy_idle ??
              gameState.enemy?.enemy_idle ??
              enemy.character_idle ??
              enemy.enemy_idle ??
              enemy.idle,
            character_attack:
              gameState.submissionResult?.fightResult?.enemy?.enemy_attack ??
              gameState.enemy?.enemy_attack ??
              enemy.character_attack ??
              enemy.enemy_attack ??
              enemy.attack,
            character_hurt:
              gameState.submissionResult?.fightResult?.enemy?.enemy_hurt ??
              gameState.enemy?.enemy_hurt ??
              enemy.character_hurt ??
              enemy.enemy_hurt ??
              enemy.hurt,
            character_run:
              gameState.submissionResult?.fightResult?.enemy?.enemy_run ??
              gameState.enemy?.enemy_run ??
              enemy.character_run ??
              enemy.enemy_run ??
              enemy.run,
            character_dies:
              gameState.submissionResult?.fightResult?.enemy?.enemy_dies ??
              gameState.enemy?.enemy_dies ??
              enemy.character_dies ??
              enemy.enemy_dies ??
              enemy.dies,
          }), [gameState, enemy]);

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