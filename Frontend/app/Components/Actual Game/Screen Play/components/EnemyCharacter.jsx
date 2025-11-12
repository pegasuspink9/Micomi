import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { universalAssetPreloader } from '../../../../services/preloader/universalAssetPreloader';
import { 
  scale, 
  scaleWidth, 
  scaleHeight,
  RESPONSIVE,
  getDeviceType,
  SCREEN
} from '../../../Responsiveness/gameResponsive';

const EnemyCharacter = ({
  isPaused,
  enemy = {},
  index,
  enemyPosition = null,
  isAttacking = false,
  characterAnimations = {},
  currentState = 'idle',
  onAnimationComplete = null,
  attackMovement = 'fade',
}) => {
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0); 
  const opacity = useSharedValue(1); 

  const SPRITE_SIZE = useMemo(() => scale(150), []);
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;

  const initialUrl = useMemo(() => {
    const candidates = [
      characterAnimations.character_idle,
      characterAnimations.idle,
      enemy?.enemy_idle,
      enemy?.idle,
    ].filter(url => url && typeof url === 'string');
    
    return candidates[0] || '';
  }, [enemy, characterAnimations]);

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  const [isAnimationLooping, setIsAnimationLooping] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isCompoundAnimation, setIsCompoundAnimation] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState('');
  const [preloadedImages] = useState(new Map());

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  // Memoize responsive constants
  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: -1,
    attack: 1500,
    hurt: 2000,
    run: -1,
    dies: 2000,
  }), []);

  const COMPOUND_PHASES = useMemo(() => ({
    attack: {
      run: { duration: 5000, animation: 'run' },
      attack: { duration: 2000, animation: 'attack' },
    },
  }), []);

  const RUN_DISTANCE = useMemo(() => {
    const deviceType = getDeviceType();
    
    switch (deviceType) {
      case 'tablet':
        return -(SCREEN.width * 0.6); 
      case 'large-phone':
        return -(SCREEN.width * 0.8);
      case 'small-phone':
        return -(SCREEN.width * 0.9); 
      default:
        return -(SCREEN.width * 0.5);
    }
  }, []);

  const phaseTimeoutRef = useRef(null);

  // Enhanced preload animations using universalAssetPreloader
  const preloadAnimations = useCallback(async () => {
    const animationUrls = [
      characterAnimations.character_idle,
      characterAnimations.character_attack,
      characterAnimations.character_hurt,
      characterAnimations.character_run,
      characterAnimations.character_dies,
      characterAnimations.idle,
      characterAnimations.attack,
      characterAnimations.hurt,
      characterAnimations.run,
      characterAnimations.dies,
      enemy?.enemy_idle,
      enemy?.enemy_attack,
      enemy?.enemy_hurt,
      enemy?.enemy_run,
      enemy?.enemy_dies,
    ].filter(url => url && typeof url === 'string');

    for (const url of animationUrls) {
      // Check if already downloaded by universalAssetPreloader
      const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
      if (cachedPath !== url) {
        // Already cached
        preloadedImages.set(url, true);
        console.log(`🦹 Enemy animation already cached: ${url.slice(-50)}`);
      } else {
        console.log(`🦹 Enemy animation using original URL: ${url.slice(-50)}`);
        // Still use the original URL if not cached, but mark as checked
        preloadedImages.set(url, true);
      }
    }

    console.log(`🦹 Enemy ${index} animation preloading completed`);
  }, [characterAnimations, enemy, preloadedImages, index]);

  useEffect(() => {
    if (Object.keys(characterAnimations).length > 0 || Object.keys(enemy).length > 0) {
      preloadAnimations();
    }
  }, [preloadAnimations]);

  // Memoize animation complete callback
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      try {
        onAnimationComplete(currentState);
      } catch (e) {
        console.warn(`Enemy ${index} onAnimationComplete error:`, e);
      }
    }
  }, [onAnimationComplete, currentState, index]);

  const handleInternalAnimationComplete = useCallback((completedAnimationState) => {
  console.log(`🦹 Enemy ${index} internal animation "${completedAnimationState}" completed`);
  
  if (completedAnimationState === 'hurt') {
    //  Don't check for dies URL - let ScreenPlay handle the state transition
    // Just notify that hurt animation completed
    console.log('🦹 Enemy hurt completed - returning to idle (API will decide next state)');
    notifyAnimationComplete();
  } else {
    // For other animations, call external callback
    notifyAnimationComplete();
  }
  }, [
    index, 
    notifyAnimationComplete
  ]);
  
  // Memoize schedule attack phase
  const scheduleAttackPhase = useCallback(
    (attackDuration, attackUrl) => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }

      phaseTimeoutRef.current = setTimeout(() => {
        setCompoundPhase('attack');
        if (attackUrl && attackUrl !== currentAnimationUrl) {
          setCurrentAnimationUrl(attackUrl);
        }

        frameIndex.value = 0;
        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { 
            duration: attackDuration,
            easing: Easing.inOut(Easing.ease)
          },
          (attackFinished) => {
            if (attackFinished) {
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = 0;
            }
          }
        );
      }, 50);
    },
    [notifyAnimationComplete, currentAnimationUrl, TOTAL_FRAMES]
  );

  const runScheduleHold = useCallback(
    (delayMs, attackDuration, attackUrl) => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
      phaseTimeoutRef.current = setTimeout(() => {
        scheduleAttackPhase(attackDuration, attackUrl);
      }, delayMs);
    },
    [scheduleAttackPhase]
  );

  // Updated prefetch using universalAssetPreloader
  const prefetchWithCache = useCallback(async () => {
    if (!currentAnimationUrl) return;
    
    try {
      // Check if already cached by universalAssetPreloader
      const cachedPath = universalAssetPreloader.getCachedAssetPath(currentAnimationUrl);
      if (cachedPath !== currentAnimationUrl) {
        // Already cached, mark as ready
        setImageReady(true);
        preloadedImages.set(currentAnimationUrl, true);
        console.log(`🦹 Using cached enemy animation: ${currentAnimationUrl.slice(-50)}`);
        return;
      }

      // If not cached, try to prefetch the original URL
      await RNImage.prefetch(currentAnimationUrl);
      preloadedImages.set(currentAnimationUrl, true);
      setImageReady(true);
      console.log(`🦹 Prefetched enemy animation: ${currentAnimationUrl.slice(-50)}`);
    } catch (err) {
      console.warn(`Enemy ${index} prefetch failed for: ${currentAnimationUrl}`, err);
    }
  }, [currentAnimationUrl, preloadedImages, index]);

  useEffect(() => {
    let mounted = true;
    setImageReady(false);

    if (!currentAnimationUrl) return;

    // Check if already cached or preloaded
    const cachedPath = universalAssetPreloader.getCachedAssetPath(currentAnimationUrl);
    if (cachedPath !== currentAnimationUrl || preloadedImages.has(currentAnimationUrl)) {
      if (mounted) setImageReady(true);
      return;
    }

    prefetchWithCache();
    return () => {
      mounted = false;
    };
  }, [currentAnimationUrl, prefetchWithCache]);

  const animationConfig = useMemo(() => {
    let animationUrl = '';
    let shouldLoop = true;
    let isCompound = false;

    switch (currentState) {
    case 'idle':
      // URLs are already transformed to use cached paths from gameService
      animationUrl = characterAnimations.character_idle || characterAnimations.idle;
      shouldLoop = true;
      isCompound = false;
      break;
    case 'attack':
      let attackUrl = '';
      if (Array.isArray(characterAnimations.character_attack)) {
        const attackAnimations = characterAnimations.character_attack.filter(url => url && typeof url === 'string');
        if (attackAnimations.length > 0) {
          attackUrl = attackAnimations[0]; 
        }
      } else if (typeof characterAnimations.character_attack === 'string' && characterAnimations.character_attack) {
        attackUrl = characterAnimations.character_attack; // Already transformed
      }
      
      animationUrl = attackUrl;
      shouldLoop = false;
      isCompound = false;
      break;
    case 'hurt':
      animationUrl = characterAnimations.character_hurt || characterAnimations.hurt; 
      shouldLoop = false;
      isCompound = false;
      break;
    case 'run':
      animationUrl = characterAnimations.character_run || characterAnimations.run;
      shouldLoop = true;
      isCompound = false;
      break;
    case 'dies':
      animationUrl = characterAnimations.character_dies || characterAnimations.dies; 
      shouldLoop = false;
      isCompound = false;
      break;
    default:
      animationUrl = characterAnimations.character_idle || characterAnimations.idle;
      shouldLoop = true;
      isCompound = false;
  }

  return { animationUrl, shouldLoop, isCompound };
  }, [currentState, characterAnimations]);

  // Set up animation URL and behavior based on current state
  useEffect(() => {
    if (animationConfig.animationUrl) {
      setCurrentAnimationUrl(animationConfig.animationUrl);
    } else if (!currentAnimationUrl) {
      const fallback = initialUrl;
      if (fallback) setCurrentAnimationUrl(fallback);
    }

    setIsAnimationLooping(animationConfig.shouldLoop);
    setIsCompoundAnimation(animationConfig.isCompound);

    if (animationConfig.isCompound && currentState === 'attack') {
      setCompoundPhase('run');
    } else {
      setCompoundPhase('');
    }
  }, [animationConfig, currentState, initialUrl, currentAnimationUrl]);

  useEffect(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }

    if (!isPaused && currentAnimationUrl && imageReady) {
      // ✅ ALWAYS cancel all animations first
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);

      frameIndex.value = 0;

      // ✅ FORCE IMMEDIATE RESET for hurt, dies, and idle states
      if (currentState === 'hurt' || currentState === 'dies' || currentState === 'idle') {
        positionX.value = 0;
        opacity.value = 1;
        console.log(`🦹 Force reset position to 0 for ${currentState} state`);
      }

      if (isCompoundAnimation && currentState === 'attack') {
        const phases = COMPOUND_PHASES.attack;
        const naturalRunCycleDuration = FRAME_DURATION * TOTAL_FRAMES;

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { 
            duration: Math.min(phases.run.duration, naturalRunCycleDuration),
            easing: Easing.linear
          },
          (finished) => {
            if (finished) {
              const attackUrl = characterAnimations.character_attack || 
                              characterAnimations.attack ||
                              enemy?.enemy_attack;

              if (phases.run.duration <= naturalRunCycleDuration) {
                runOnJS(scheduleAttackPhase)(phases.attack.duration, attackUrl);
              } else {
                const remainingDuration = phases.run.duration - naturalRunCycleDuration;
                runOnJS(runScheduleHold)(remainingDuration, phases.attack.duration, attackUrl);
              }
            }
          }
        );
      } else if (isAnimationLooping) {
        // ✅ For looping states (idle), force position to 0
        positionX.value = 0;
        opacity.value = 1;
        
        frameIndex.value = withRepeat(
          withTiming(TOTAL_FRAMES - 1, {
            duration: FRAME_DURATION * TOTAL_FRAMES,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      } else {
        // ✅ For non-looping states (hurt, dies, attack)
        
        if (currentState === 'attack') {
          positionX.value = 0;
          opacity.value = 1;
          
          if (attackMovement === 'slide') {
            positionX.value = withTiming(RUN_DISTANCE, { 
              duration: ANIMATION_DURATIONS.attack,
              easing: Easing.inOut(Easing.quad) 
            });
          } else if (attackMovement === 'teleport') {
            positionX.value = RUN_DISTANCE;
          } else if (attackMovement === 'fade') {
            positionX.value = RUN_DISTANCE;
            opacity.value = 0;
            const fadeDuration = Math.min(300, ANIMATION_DURATIONS.attack);
            opacity.value = withTiming(1, { 
              duration: fadeDuration,
              easing: Easing.inOut(Easing.quad)
            });
          }
        }
        // ✅ For hurt, dies - position already force reset at top

        const animationDuration =
          ANIMATION_DURATIONS[currentState] || FRAME_DURATION * TOTAL_FRAMES;

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { 
            duration: animationDuration,
            easing: Easing.inOut(Easing.ease)
          },
          (finished) => {
            if (finished) {
              // ✅ Double-check position reset on completion
              if (currentState !== 'attack') {
                positionX.value = 0;
                opacity.value = 1;
              }
              
              if (currentState === 'dies') {
                runOnJS(notifyAnimationComplete)();
                frameIndex.value = TOTAL_FRAMES - 1;
              } else {
                runOnJS(notifyAnimationComplete)();
                frameIndex.value = 0;
              }
            }
          } 
        );
      }
    }

    return () => {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
    };
  }, [
    isPaused,
    currentAnimationUrl,
    isAnimationLooping,
    currentState,
    notifyAnimationComplete,
    imageReady,
    isCompoundAnimation,
    scheduleAttackPhase,
    runScheduleHold,
    ANIMATION_DURATIONS,
    COMPOUND_PHASES,
    RUN_DISTANCE,
    characterAnimations,
    enemy,
    attackMovement,
  ]);

  
  const animatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;

    const column = currentFrame % SPRITE_COLUMNS;
    const row = Math.floor(currentFrame / SPRITE_COLUMNS);

    const xOffset = -(column * SPRITE_SIZE);
    const yOffset = -(row * SPRITE_SIZE);

    return {
      transform: [{ translateX: xOffset }, { translateY: yOffset }],
    };
  }, [SPRITE_SIZE]);

      const positionStyle = useAnimatedStyle(() => {
    //  Only apply position movement for attack and run states
    if (currentState === 'attack' || currentState === 'run') {
      return {
        transform: [{ translateX: positionX.value }],
      };
    }
    //  For hurt, dies, idle - force translateX to 0
    return {
      transform: [{ translateX: 0 }],
    };
  }, [currentState]);
    
  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  }, []);

  // Memoize error and load handlers
  const handleImageError = useCallback((error) => {
    console.warn(`🦹 Enemy ${index} image load error:`, error, `URL: ${currentAnimationUrl}`);
  }, [index, currentAnimationUrl]);

  const handleImageLoadEnd = useCallback(() => {
    setImageReady(true);
  }, []);

  const isFront = useMemo(() => 
    currentState === 'attack' || isAttacking, 
    [currentState, isAttacking]
  );

  return (
    <Animated.View
      style={[
        styles.enemyRun,
        isPaused && styles.pausedElement,
        positionStyle,
        opacityStyle,
        isFront && styles.front,
      ]}
    >
      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
        <Animated.View style={[styles.spriteSheet, animatedStyle, {
          width: SPRITE_SIZE * SPRITE_COLUMNS,
          height: SPRITE_SIZE * SPRITE_ROWS,
        }]}>
          {currentAnimationUrl ? (
            <Image
              source={{ uri: currentAnimationUrl }}
              style={[styles.spriteImage, isAttacking && styles.attackingImage]}
              contentFit="cover"
              onLoadEnd={handleImageLoadEnd}
              onError={handleImageError}
              cachePolicy="disk"
            />
          ) : (
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// Responsive styles
const styles = StyleSheet.create({
  enemyRun: {
    position: 'absolute',
    right: scaleWidth(-8),
    top: scaleHeight(126),
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  front: {
    zIndex: 9999,
    elevation: 9999,
  },

  spriteContainer: {
    overflow: 'hidden',
  },

  spriteSheet: {
    // Dimensions set dynamically in component
  },

  spriteImage: {
    width: '100%',
    height: '100%',
  },

  attackingImage: {
    transform: [{ scale: 1.1 }],
  },

  pausedElement: {
    opacity: 0.6,
  },
});

export default React.memo(EnemyCharacter, (prevProps, nextProps) => {
  return (
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.currentState === nextProps.currentState &&
    prevProps.isAttacking === nextProps.isAttacking &&
    prevProps.attackMovement === nextProps.attackMovement &&
    prevProps.index === nextProps.index &&
    prevProps.characterAnimations.character_idle === nextProps.characterAnimations.character_idle &&
    prevProps.characterAnimations.character_attack === nextProps.characterAnimations.character_attack &&
    prevProps.characterAnimations.character_hurt === nextProps.characterAnimations.character_hurt &&
    prevProps.characterAnimations.character_run === nextProps.characterAnimations.character_run &&
    prevProps.characterAnimations.character_dies === nextProps.characterAnimations.character_dies &&
    prevProps.enemy?.enemy_idle === nextProps.enemy?.enemy_idle &&
    prevProps.enemy?.enemy_attack === nextProps.enemy?.enemy_attack &&
    prevProps.enemy?.enemy_hurt === nextProps.enemy?.enemy_hurt &&
    prevProps.onAnimationComplete === nextProps.onAnimationComplete
  );
});