import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import enemiesData from '../GameData/Enemy Game Data/EnemyGameData';
import GameContainer from './components/GameContainer';
import GameBackground from './components/GameBackground';
import DogCharacter from './components/DogCharacter';
import EnemyCharacter from './components/EnemyCharacter';
import useEnemyAnimations from './hooks/useEnemyAnimations';
import { clearAllAnimations, resetGameState, processEnemyData } from './utils/gameStateHelper';
import { calculateResumeAnimation, createEnemyAnimation } from './utils/animationHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScreenPlay({ 
  isPaused = false, 
  borderColor = 'rgba(37, 144, 197, 1)', 
  onEnemyComplete,
  onTimerUpdate = null,
  currentQuestionIndex = 0,
  onAllowEnemyCompletion = null,
  onSetCorrectAnswer = null // NEW: Callback to set correct answer state
}) {
  const [attackingEnemies, setAttackingEnemies] = useState(new Set());
  
  const enemies = useMemo(() => processEnemyData(enemiesData), []);

  const {
    enemyPositions,
    timeoutsRef,
    animationsRef,
    hasInitialized,
    currentEnemyIndex,
    isEnemyRunning,
    startNextEnemy,
    startEnemyForQuestion,
    resetForNewQuestion,
    allowCompletion,
    setCorrectAnswer, // NEW: Get this function
    pauseTimer,
    resumeTimer
  } = useEnemyAnimations(enemies, isPaused, onEnemyComplete, setAttackingEnemies, onTimerUpdate);

  // Expose allowCompletion to parent
  useEffect(() => {
    if (onAllowEnemyCompletion) {
      onAllowEnemyCompletion(allowCompletion);
    }
  }, [allowCompletion, onAllowEnemyCompletion]);

  // NEW: Expose setCorrectAnswer to parent
  useEffect(() => {
    if (onSetCorrectAnswer) {
      onSetCorrectAnswer(setCorrectAnswer);
    }
  }, [setCorrectAnswer, onSetCorrectAnswer]);

  const startAnimations = () => {
    if (hasInitialized.current) return;
    
    clearAllAnimations(timeoutsRef, animationsRef);
    resetGameState(enemyPositions, hasInitialized, currentEnemyIndex, isEnemyRunning);
    
    startEnemyForQuestion(currentQuestionIndex);
  };

  useEffect(() => {
    console.log(`📚 Question changed to: ${currentQuestionIndex}`);
    
    if (hasInitialized.current && !isPaused) {
      startEnemyForQuestion(currentQuestionIndex);
    }
  }, [currentQuestionIndex]);

  const resumeAnimations = () => {
    let resumedFromPause = false;
    
    enemies.forEach((enemy, index) => {
      if (enemyPositions[index]) {
        const currentPosition = enemyPositions[index]._value || 0;
        
        if (currentPosition > 0 && currentPosition < SCREEN_WIDTH * 1.1) {
          const { remainingTime, remainingHitTime } = calculateResumeAnimation(enemy, currentPosition);
          
          if (remainingTime > 0) {
            console.log(`Resuming enemy ${index} from position ${currentPosition}`);
            isEnemyRunning.current = true;
            resumedFromPause = true;
            
            if (remainingHitTime > 0) {
              const hitTimeout = setTimeout(() => {
                if (!isPaused) {
                  console.log(`⚡ COLLISION! Enemy ${index} hits dog (resumed)`);
                  
                  setAttackingEnemies(prev => new Set([...prev, index]));
                  
                  const attackEndTimeout = setTimeout(() => {
                    setAttackingEnemies(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(index);
                      return newSet;
                    });
                  }, 500);
                  
                  timeoutsRef.current.push(attackEndTimeout);
                }
              }, remainingHitTime);
              
              timeoutsRef.current.push(hitTimeout);
            }
            
            const animation = createEnemyAnimation(enemyPositions[index], remainingTime);
            animationsRef.current.push(animation);
            
            animation.start(({ finished }) => {
              if (finished && !isPaused) {
                const resetTimeout = setTimeout(() => {
                  enemyPositions[index].setValue(0);
                  isEnemyRunning.current = false;
                }, 500);
                
                timeoutsRef.current.push(resetTimeout);
              }
            });
          }
        }
      }
    });
    
    if (!resumedFromPause && !isEnemyRunning.current) {
      startEnemyForQuestion(currentQuestionIndex);
    }
  };

  useEffect(() => {
    console.log(`🎮 ScreenPlay pause state changed: ${isPaused}`);
    
    if (isPaused) {
      animationsRef.current.forEach(animation => animation.stop());
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      pauseTimer();
      console.log('⏸️ Game paused (including timer)');
    } else {
      if (!hasInitialized.current) {
        startAnimations();
      } else {
        resumeAnimations();
        resumeTimer();
      }
      console.log('▶️ Game resumed (including timer)');
    }

    return () => {
      clearAllAnimations(timeoutsRef, animationsRef);
    };
  }, [isPaused]);

  return (
    <GameContainer borderColor={borderColor}>
      <GameBackground isPaused={isPaused}>
        <DogCharacter isPaused={isPaused} />
        
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