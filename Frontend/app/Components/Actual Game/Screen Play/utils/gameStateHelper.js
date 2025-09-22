export const clearAllAnimations = (timeoutsRef, animationsRef) => {
  timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
  timeoutsRef.current = [];
  
  animationsRef.current.forEach(animation => animation.stop());
  animationsRef.current = [];
};

export const resetGameState = (enemyPositions, hasInitialized, currentEnemyIndex, isEnemyRunning) => {
  enemyPositions.forEach(position => position.setValue(0));
  hasInitialized.current = true;
  currentEnemyIndex.current = 0;
  isEnemyRunning.current = false;
};

export const processEnemyData = (enemiesData) => {
  return enemiesData.map((enemy, index) => ({
    duration: enemy.seconds * 1000,
    image: enemy.enemyImage,
    attackImage: enemy.enemyAttack,
  }));
};