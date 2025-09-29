// ScreenPlay.js
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

//current 
export default function ScreenPlay({ 
  gameState,
  isPaused = false, 
  borderColor = 'white',
  onSubmissionAnimationComplete = null,
}) {
  const [attackingEnemies] = useState(new Set());
  const [totalCoins, setTotalCoins] = useState(0);
  const [characterAnimationState, setCharacterAnimationState] = useState('idle');
  const [isPlayingSubmissionAnimation, setIsPlayingSubmissionAnimation] = useState(false);

  const enemies = useMemo(() => processEnemyData(enemiesData), []);

  // NEW: per-enemy animation states (default to 'idle')
  const [enemyAnimationStates, setEnemyAnimationStates] = useState(() =>
    enemies.map(() => 'idle')
  );

  const lastSubmissionKeyRef = useRef(null);
  const enemyPositions = useMemo(
    () => enemies.map(() => new Animated.Value(0)),
    [enemies.length]
  );

  // Extract health values
  const playerHealth = gameState.submissionResult?.fightResult?.character?.character_health
    ?? gameState.submissionResult?.levelStatus?.playerHealth
    ?? gameState.selectedCharacter?.current_health;

  const playerMaxHealth = gameState.submissionResult?.fightResult?.character?.character_max_health
    ?? gameState.selectedCharacter?.max_health;


  // IMPORTANT: robust fallbacks so we don't get undefined on entry responses
  const enemyHealth = (
    gameState.submissionResult?.fightResult?.enemy?.enemy_health ??
    gameState.submissionResult?.levelStatus?.enemyHealth ??
    gameState.enemy?.enemy_health ??
    gameState.enemy?.enemy_max_health
  );

  const enemyMaxHealth = (
    gameState.submissionResult?.fightResult?.enemy?.enemy_max_health ??
    gameState.submissionResult?.levelStatus?.enemyMaxHealth ??
    gameState.submissionResult?.levelStatus?.enemy_max_health ??
    gameState.enemy?.enemy_max_health ??
    gameState.enemy?.enemy_health 
  );

  // Extract all character animations from gameState (player)
  const characterAnimations = {
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
  };

  const coinsEarned = gameState.submissionResult?.levelStatus?.coinsEarned ?? 0;
  
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

  // Handle character animation completion
  const handleCharacterAnimationComplete = useCallback((completedAnimationState) => {
    console.log(`Character animation "${completedAnimationState}" completed`);
    
    // Only handle completion for submission animations (attack, hurt, dies)
    if (!['attack', 'hurt', 'dies'].includes(completedAnimationState)) {
      return;
    }
    
    // Set flag that submission animation is finished
    setIsPlayingSubmissionAnimation(false);
    
    // Return to idle state after non-looping animations
    const shouldDie = playerHealth <= 0;
    
    if (shouldDie && completedAnimationState !== 'dies') {
      setCharacterAnimationState('dies');
      setIsPlayingSubmissionAnimation(true); // Dies is also a submission animation
    } else if (!shouldDie && completedAnimationState !== 'idle') {
      setCharacterAnimationState('idle');
    }
    
    // But only after hurt/attack animations, not dies (dies should not trigger next challenge)
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

  // Handler used when an enemy finishes a one-shot animation (attack/hurt/dies)
  const handleEnemyAnimationComplete = useCallback((index) => (completedAnimationState) => {
    console.log(`Enemy ${index} animation "${completedAnimationState}" completed`);

    setEnemyAnimationStates(prev => {
      const next = [...prev];
      // if enemy died, keep dies; otherwise go to idle
      if (completedAnimationState === 'dies') {
        next[index] = 'dies';
      } else {
        next[index] = 'idle';
      }
      return next;
    });
  }, []);

  // Determine character animation state based on game events (also set enemy states)
  useEffect(() => {
    // Don't change animation if we're already playing a submission animation
    if (isPlayingSubmissionAnimation) {
      console.log(`Skipping animation change - submission animation in progress`);
      return;
    }

    // Check for death first (highest priority)
    if (playerHealth <= 0) {
      console.log(`Player died - setting dies animation`);
      setCharacterAnimationState('dies');
      setIsPlayingSubmissionAnimation(true);
      return;
    }

    const submission = gameState.submissionResult;
    // create a compact key for the submission so we can compare identity
    const submissionKey = submission
      ? `${submission.isCorrect}-${submission.attempts || 0}-${submission.fightResult?.character?.character_health ?? ''}-${submission.fightResult?.enemy?.enemy_health ?? ''}`
      : null;

    // Only start an animation if there is a NEW submission that we haven't processed yet
    if (submission && lastSubmissionKeyRef.current !== submissionKey) {
      lastSubmissionKeyRef.current = submissionKey; // mark as processed

      if (submission.isCorrect === true) {
        console.log(`Correct answer - setting player attack, enemy hurt`);
        setCharacterAnimationState('attack');
        setEnemyAnimationStates(prev => prev.map(() => 'hurt'));
        setIsPlayingSubmissionAnimation(true);
      } else if (submission.isCorrect === false) {
        console.log(`Wrong answer - setting player hurt, enemy attack`);
        setCharacterAnimationState('hurt');
        setEnemyAnimationStates(prev => prev.map(() => 'attack'));
        setIsPlayingSubmissionAnimation(true);
      }
      return;
    }

    // No submission result and not already idle - return to idle
    if (!submission && characterAnimationState !== 'idle') {
      console.log(`No submission result - setting idle animation`);
      setCharacterAnimationState('idle');
      setIsPlayingSubmissionAnimation(false);
      lastSubmissionKeyRef.current = null;
      // reset enemies to idle
      setEnemyAnimationStates(enemies.map(() => 'idle'));
    }
  }, [gameState.submissionResult, playerHealth, isPlayingSubmissionAnimation, enemies]);

  // Debug logging for character data
  useEffect(() => {
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
  }, [characterAnimations, characterAnimationState, isPlayingSubmissionAnimation, playerHealth, playerMaxHealth, enemyHealth, enemyMaxHealth]);

  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused}>
        {/* Enhanced DogCharacter with animation sequencing */}
        <DogCharacter 
          isPaused={isPaused} 
          characterAnimations={characterAnimations}
          currentState={characterAnimationState}
          onAnimationComplete={handleCharacterAnimationComplete}
        />

        {/* Player Health */}
        <Life 
          health={playerHealth}
          maxHealth={playerMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`Player health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="left"   
        />

        {/* Enemy Health */}
        <Life 
          health={enemyHealth}
          maxHealth={enemyMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`Enemy health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="right"
        />

        {/* Coins */}
        <Coin 
          coins={totalCoins}
          onCoinsChange={(newCoins) => console.log(`Total coins display updated: ${newCoins}`)}
          animated={true}
        />

        {/* Enemies */}
        {enemies.map((enemy, index) => {
          if (!enemyPositions[index]) return null;

          const enemyAnimations = {
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
          };

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
}
