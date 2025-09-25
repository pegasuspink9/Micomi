import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, Animated, Text } from 'react-native';
import enemiesData from '../GameData/Enemy Game Data/EnemyGameData';
import GameContainer from './components/GameContainer';
import GameBackground from './components/GameBackground';
import DogCharacter from './components/DogCharacter';
import EnemyCharacter from './components/EnemyCharacter';
import { processEnemyData } from './utils/gameStateHelper';
import Life from './components/Life';
import Coin from './components/Coin';

// ✅ bring in the hook/service that provides gameState
import { useGameData } from '../../../hooks/useGameData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScreenPlay({ 
  gameState,
  isPaused = false, 
  borderColor = 'white',
}) {
  const [attackingEnemies] = useState(new Set());

  const enemies = useMemo(() => processEnemyData(enemiesData), []);

  const enemyPositions = useMemo(
    () => enemies.map(() => new Animated.Value(0)),
    [enemies.length]
  );


  const playerHealth = gameState.submissionResult?.fightResult?.charHealth 
  ?? gameState.selectedCharacter?.current_health;

  const playerMaxHealth = gameState.submissionResult?.levelStatus?.playerMaxHealth
    ?? gameState.selectedCharacter?.max_health;

  const enemyHealth = gameState.submissionResult?.fightResult?.enemyHealth
    ?? gameState.enemy?.enemy_health;

  const enemyMaxHealth = gameState.submissionResult?.levelStatus?.enemyMaxHealth
    ?? 100; // fallback


  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused}>
        <DogCharacter isPaused={isPaused} />

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
          coins={150} 
          onCoinsChange={(newCoins) => console.log('Coins changed:', newCoins)}
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
