import React, { useMemo, useState, useEffect } from 'react';
import {  Animated  } from 'react-native';
import enemiesData from '../GameData/Enemy Game Data/EnemyGameData';
import GameContainer from './components/GameContainer';
import GameBackground from './components/GameBackground';
import DogCharacter from './components/DogCharacter';
import EnemyCharacter from './components/EnemyCharacter';
import { processEnemyData } from './utils/gameStateHelper';
import Life from './components/Life';
import Coin from './components/Coin';

export default function ScreenPlay({ 
  gameState,
  isPaused = false, 
  borderColor = 'white',
}) {
  const [attackingEnemies] = useState(new Set());
  const [totalCoins, setTotalCoins] = useState(0);
  const [characterAnimationState, setCharacterAnimationState] = useState('idle');

  const enemies = useMemo(() => processEnemyData(enemiesData), []);

  const enemyPositions = useMemo(
    () => enemies.map(() => new Animated.Value(0)),
    [enemies.length]
  );

  // Extract health values
  const playerHealth = gameState.submissionResult?.fightResult?.charHealth 
    ?? gameState.selectedCharacter?.current_health;

  const playerMaxHealth = gameState.submissionResult?.levelStatus?.playerMaxHealth
    ?? gameState.selectedCharacter?.max_health;

  const enemyHealth = gameState.submissionResult?.fightResult?.enemyHealth
    ?? gameState.enemy?.enemy_health;

  const enemyMaxHealth = gameState.submissionResult?.levelStatus?.enemyMaxHealth
    ?? 100;

  // Extract all character animations from gameState
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
  
  useEffect(() => {
    if (coinsEarned > 0) {
      setTotalCoins(prevTotal => {
        const newTotal = prevTotal + coinsEarned;
        console.log(`🪙 Coins earned: ${coinsEarned}, Total coins: ${newTotal}`);
        return newTotal;
      });
    }
  }, [coinsEarned]);

  // Determine character animation state based on game events
  useEffect(() => {
    if (gameState.submissionResult?.isCorrect === true) {
      // Show attack animation for correct answers
      setCharacterAnimationState('attack');
      
      // Return to idle after attack animation
      const timer = setTimeout(() => {
        setCharacterAnimationState('idle');
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (gameState.submissionResult?.isCorrect === false) {
      // Show hurt animation for incorrect answers
      setCharacterAnimationState('hurt');
      
      // Return to idle after hurt animation
      const timer = setTimeout(() => {
        setCharacterAnimationState('idle');
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      // Default to idle
      setCharacterAnimationState('idle');
    }
  }, [gameState.submissionResult]);

  // Debug logging for character data
  useEffect(() => {
    console.log(`🐕 Character animations available:`, characterAnimations);
    console.log(`🐕 Current animation state: ${characterAnimationState}`);
  }, [characterAnimations, characterAnimationState]);

  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused}>
        {/* Advanced DogCharacter with multiple animation states */}
        <DogCharacter 
          isPaused={isPaused} 
          characterAnimations={characterAnimations}
          currentState={characterAnimationState}
        />

        {/* Player Health */}
        <Life 
          health={playerHealth}
          maxHealth={playerMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`👤 Player health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="left"   
        />

        {/* Enemy Health */}
        <Life 
          health={enemyHealth}
          maxHealth={enemyMaxHealth}
          onHealthChange={(newHealth, maxHealth) => 
            console.log(`👹 Enemy health: ${newHealth}/${maxHealth}`)
          }
          animated={true}
          position="right"
        />

        {/* Coins */}
        <Coin 
          coins={totalCoins}
          onCoinsChange={(newCoins) => console.log(`🪙 Total coins display updated: ${newCoins}`)}
          animated={true}
        />

        {/* Enemies */}
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
            />
          );
        })}
      </GameBackground>
    </GameContainer>
  );
}