import { useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import { calculateCollisionTiming, createEnemyAnimation } from '../utils/animationHelpers';

const useEnemyAnimations = (enemies, isPaused, onEnemyComplete, setAttackingEnemies, onTimerUpdate = null) => {
  const timeoutsRef = useRef([]);
  const animationsRef = useRef([]);
  const hasInitialized = useRef(false);
  const currentEnemyIndex = useRef(0);
  const isEnemyRunning = useRef(false);
  const timerIntervalRef = useRef(null);
  const pausedTimeLeft = useRef(null);
  const isPausedRef = useRef(isPaused);
  const allowEnemyCompletion = useRef(false);
  const isCorrectAnswer = useRef(false);

  isPausedRef.current = isPaused;

  const enemyPositions = useMemo(() => 
    enemies.map(() => new Animated.Value(0)), 
    [enemies.length]
  );

  const startTimer = (duration) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    let timeLeft = Math.ceil(duration / 1000);
    console.log('⏰ Starting timer:', timeLeft, 'seconds');
    
    if (onTimerUpdate && typeof onTimerUpdate === 'function') {
      onTimerUpdate(timeLeft, false);
    }

    timerIntervalRef.current = setInterval(() => {
      // FIXED: Simple pause logic - if drawer is open (isPaused), don't tick at all
      // Only exception: if it's a correct answer AND timer is at 0, force completion
      if (isPausedRef.current) {
        console.log('⏸️ Timer COMPLETELY PAUSED - drawer is open. Frozen at:', timeLeft);
        
        // Only force completion if correct answer and time would have expired
        if (isCorrectAnswer.current && timeLeft <= 1) {
          console.log('🚀 FORCING completion - correct answer with timer about to expire');
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          
          setTimeout(() => {
            const currentIndex = currentEnemyIndex.current;
            if (currentIndex < enemies.length && enemyPositions[currentIndex]) {
              console.log(`⚡ FORCE completing enemy ${currentIndex}`);
              
              animationsRef.current.forEach(animation => animation.stop());
              enemyPositions[currentIndex].setValue(0);
              isEnemyRunning.current = false;
              
              if (onEnemyComplete) {
                console.log(`📚 FORCE triggering enemy ${currentIndex} completion`);
                onEnemyComplete(currentIndex);
              }
            }
          }, 100);
        }
        
        return;
      }

      timeLeft -= 1;
      console.log('⏰ Timer tick:', timeLeft, '| Drawer closed - timer running normally');
      
      if (onTimerUpdate && typeof onTimerUpdate === 'function') {
        onTimerUpdate(Math.max(0, timeLeft), timeLeft <= 0);
      }

      if (timeLeft <= 0) {
        console.log('⏰ Timer expired naturally');
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        
        // Natural timer expiry - force completion if correct answer
        if (isCorrectAnswer.current) {
          console.log('🚀 Natural timer expiry with correct answer - forcing completion');
          allowEnemyCompletion.current = true;
          
          setTimeout(() => {
            const currentIndex = currentEnemyIndex.current;
            if (currentIndex < enemies.length && enemyPositions[currentIndex]) {
              console.log(`⚡ Natural expiry - completing enemy ${currentIndex}`);
              
              animationsRef.current.forEach(animation => animation.stop());
              enemyPositions[currentIndex].setValue(0);
              isEnemyRunning.current = false;
              
              if (onEnemyComplete) {
                console.log(`📚 Natural expiry - triggering enemy ${currentIndex} completion`);
                onEnemyComplete(currentIndex);
              }
            }
          }, 100);
        }
      }
    }, 1000);
  };

  const resumeTimer = () => {
    console.log('▶️ Timer resumed - will continue ticking normally');
  };

  const pauseTimer = () => {
    console.log('⏸️ Timer paused - timeRemaining will freeze');
  };

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      console.log('⏰ Clearing timer completely');
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    pausedTimeLeft.current = null;
  };

  const setCorrectAnswer = (isCorrect) => {
    console.log('🎯 Setting correct answer state:', isCorrect);
    isCorrectAnswer.current = isCorrect;
    
    if (isCorrect && isPausedRef.current) {
      console.log('✅ Correct answer with drawer open - will force completion when timer would expire');
      allowEnemyCompletion.current = true;
    }
  };

  const allowCompletion = () => {
    console.log('✅ Allowing enemy completion despite pause state');
    allowEnemyCompletion.current = true;
  };

  const resetForNewQuestion = () => {
    console.log('🔄 Resetting enemy system for new question');
    
    clearTimer();
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    animationsRef.current.forEach(animation => animation.stop());
    animationsRef.current = [];
    
    enemyPositions.forEach(position => position.setValue(0));
    
    isEnemyRunning.current = false;
    allowEnemyCompletion.current = false;
    isCorrectAnswer.current = false;
    pausedTimeLeft.current = null;
  };

  const startSingleEnemyAnimation = (enemy, index) => {
    const { exactHitTime } = calculateCollisionTiming(enemy);
    
    console.log('🚀 Starting enemy:', { index, duration: enemy.duration });
    
    startTimer(enemy.duration);
    
    const hitTimeout = setTimeout(() => {
      if (!isPausedRef.current || allowEnemyCompletion.current) {
        console.log(`⚡ Enemy ${index} collision`);
        
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
    }, exactHitTime);
    
    timeoutsRef.current.push(hitTimeout);

    const animation = createEnemyAnimation(enemyPositions[index], enemy.duration);
    animationsRef.current.push(animation);
    
    animation.start(({ finished }) => {
      if (finished && (!isPausedRef.current || allowEnemyCompletion.current)) {
        console.log(`🏁 Enemy ${index} animation COMPLETED`);
        
        clearTimer();

        const resetTimeout = setTimeout(() => {
          enemyPositions[index].setValue(0);
          isEnemyRunning.current = false;
          
          if (onEnemyComplete) {
            console.log(`📚 Enemy ${index} completed - triggering question completion`);
            onEnemyComplete(index);
          }
          
        }, 500);
        
        timeoutsRef.current.push(resetTimeout);
      }
    });
  };

  const startEnemyForQuestion = (questionIndex) => {
    console.log(`🎯 Starting enemy for question ${questionIndex}`);
    
    if (questionIndex >= enemies.length) {
      console.log('🏁 No more enemies - all questions completed');
      return;
    }
    
    resetForNewQuestion();
    currentEnemyIndex.current = questionIndex;
    
    const enemy = enemies[questionIndex];
    
    if (enemy && !isPausedRef.current) {
      console.log(`🎯 Starting enemy ${questionIndex} for question ${questionIndex}`);
      isEnemyRunning.current = true;
      startSingleEnemyAnimation(enemy, questionIndex);
    }
  };

  const startNextEnemy = () => {
    if (currentEnemyIndex.current >= enemies.length || isPausedRef.current || isEnemyRunning.current) {
      console.log('🛑 Not starting enemy:', {
        currentIndex: currentEnemyIndex.current,
        enemiesLength: enemies.length,
        isPaused: isPausedRef.current,
        isRunning: isEnemyRunning.current
      });
      return;
    }
    
    const index = currentEnemyIndex.current;
    const enemy = enemies[index];
    
    console.log(`🎯 Starting enemy ${index}`);
    isEnemyRunning.current = true;
    
    startSingleEnemyAnimation(enemy, index);
  };

  return {
    enemyPositions,
    timeoutsRef,
    animationsRef,
    hasInitialized,
    currentEnemyIndex,
    isEnemyRunning,
    startNextEnemy,
    startSingleEnemyAnimation,
    startEnemyForQuestion, 
    resetForNewQuestion,
    allowCompletion,
    setCorrectAnswer,
    clearTimer,
    pauseTimer,
    resumeTimer
  };
};

export default useEnemyAnimations;