import React, { useMemo, useState } from 'react';
import { Dimensions, Animated } from 'react-native';
import enemiesData from '../GameData/Enemy Game Data/EnemyGameData';
import GameContainer from './components/GameContainer';
import GameBackground from './components/GameBackground';
import DogCharacter from './components/DogCharacter';
import EnemyCharacter from './components/EnemyCharacter';
import { processEnemyData } from './utils/gameStateHelper';
import Life from './components/Life';
import Coin from './components/Coin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Leaderboards({ 
  isPaused = false, 
  borderColor = 'white',
}) {
  const [playerHealth, setPlayerHealth] = useState(130);
  const [attackingEnemies] = useState(new Set());

  // ✅ Process static enemy data
  const enemies = useMemo(() => processEnemyData(enemiesData), []);

  // ✅ Keep enemy positions (no useEnemyAnimations)
  const enemyPositions = useMemo(
    () => enemies.map(() => new Animated.Value(0)),
    [enemies.length]
  );

  const handleHealthChange = (newHealth, maxHealth) => {
    console.log(`Health changed: ${newHealth}/${maxHealth}`);
  };

  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused}>
        <DogCharacter isPaused={isPaused} />

        {/* Player Health */}
        <Life 
          health={playerHealth}
          maxHealth={250}
          onHealthChange={handleHealthChange}
          animated={true}
          position="left"   
        />

        {/* Enemy Health (static for leaderboard view) */}
        <Life 
          health={200}    
          maxHealth={200}
          animated={true}
          position="right"
        />

        {/* Coins */}
        <Coin 
          coins={150} 
          onCoinsChange={(newCoins) => console.log('Coins changed:', newCoins)}
          animated={true}
        />

        {/* Enemies (positions preserved, no animations) */}
        {enemies.map((enemy, index) => {
          if (!enemyPositions[index]) return null;
          
          return (
            <EnemyCharacter
              key={`enemy-${index}`}
              enemy={enemy}
              index={index}
              enemyPosition={enemyPositions[index]} // ✅ still passed down
              isAttacking={attackingEnemies.has(index)}
              isPaused={isPaused}
            />
          );
        })}
      </GameBackground>
    </GameContainer>
  );
}
