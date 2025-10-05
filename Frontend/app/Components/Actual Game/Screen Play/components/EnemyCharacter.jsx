import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Image as RNImage } from 'react-native';
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
import { animationPreloader } from '../../../../services/animationPreloader';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // ✅ Enhanced initial URL calculation with better fallbacks
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
  const [preloadedImages] = useState(new Map()); // Keep local cache for backwards compatibility

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  // ✅ Memoize animation duration constants
  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: 2000,
    attack: 1500,
    hurt: 2000,
    run: -1,
    dies: 2000,
  }), []);

  // ✅ Memoize compound phases
  const COMPOUND_PHASES = useMemo(() => ({
    attack: {
      run: { duration: 5000, animation: 'run' },
      attack: { duration: 2000, animation: 'attack' },
    },
  }), []);

  // ✅ Memoize movement distance
  const RUN_DISTANCE = useMemo(() => SCREEN_WIDTH * -0.50, []);

  const phaseTimeoutRef = useRef(null);

  // ✅ Enhanced preload animations using the animation preloader service
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

    // ✅ Use the global animation preloader for consistency
    for (const url of animationUrls) {
      if (!animationPreloader.isAnimationPreloaded(url)) {
        console.log(`🦹 Preloading missing enemy animation: ${url.slice(-50)}`);
        await animationPreloader.preloadAnimation(url);
      } else {
        // Also update local cache for backwards compatibility
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

  // ✅ Memoize animation complete callback
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      try {
        onAnimationComplete(currentState);
      } catch (e) {
        console.warn(`Enemy ${index} onAnimationComplete error:`, e);
      }
    }
  }, [onAnimationComplete, currentState, index]);

  // ✅ Memoize schedule attack phase
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

  // ✅ Memoize run schedule hold
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

  // ✅ Enhanced prefetch with global preloader check
  const prefetchWithCache = useCallback(async () => {
    if (!currentAnimationUrl) return;
    
    try {
      // Check global preloader first
      if (animationPreloader.isAnimationPreloaded(currentAnimationUrl)) {
        setImageReady(true);
        preloadedImages.set(currentAnimationUrl, true);
        return;
      }

      // Fallback to manual prefetch
      await RNImage.prefetch(currentAnimationUrl);
      preloadedImages.set(currentAnimationUrl, true);
      setImageReady(true);
    } catch (err) {
      console.warn(`Enemy ${index} prefetch failed for: ${currentAnimationUrl}`, err);
      // Image onLoadEnd will handle readiness fallback
    }
  }, [currentAnimationUrl, preloadedImages, index]);

  // ✅ Enhanced image readiness logic
  useEffect(() => {
    let mounted = true;
    setImageReady(false);

    if (!currentAnimationUrl) return;

    // Check if already preloaded globally or locally
    if (animationPreloader.isAnimationPreloaded(currentAnimationUrl) || 
        preloadedImages.has(currentAnimationUrl)) {
      if (mounted) setImageReady(true);
      return;
    }

    prefetchWithCache();
    return () => {
      mounted = false;
    };
  }, [currentAnimationUrl, prefetchWithCache]);

  // ✅ Memoize animation configuration
  const animationConfig = useMemo(() => {
    let animationUrl = '';
    let shouldLoop = true;
    let isCompound = false;

    switch (currentState) {
      case 'idle':
        animationUrl = characterAnimations.character_idle || 
                      characterAnimations.idle || 
                      enemy?.enemy_idle || 
                      enemy?.idle;
        shouldLoop = true;
        isCompound = false;
        break;
      case 'attack':
        animationUrl = characterAnimations.character_attack || 
                      characterAnimations.attack || 
                      enemy?.enemy_attack || 
                      enemy?.attack;
        shouldLoop = false;
        isCompound = false;
        break;
      case 'hurt':
        animationUrl = characterAnimations.character_hurt || 
                      characterAnimations.hurt || 
                      enemy?.enemy_hurt || 
                      enemy?.hurt;
        shouldLoop = false;
        isCompound = false;
        break;
      case 'run':
        animationUrl = characterAnimations.character_run || 
                      characterAnimations.run || 
                      enemy?.enemy_run || 
                      enemy?.run;
        shouldLoop = true;
        isCompound = false;
        break;
      case 'dies':
        animationUrl = characterAnimations.character_dies || 
                      characterAnimations.dies || 
                      enemy?.enemy_dies || 
                      enemy?.dies;
        shouldLoop = false;
        isCompound = false;
        break;
      default:
        animationUrl = characterAnimations.character_idle || 
                      characterAnimations.idle || 
                      enemy?.enemy_idle || 
                      enemy?.idle;
        shouldLoop = true;
        isCompound = false;
    }

    return { animationUrl, shouldLoop, isCompound };
  }, [currentState, characterAnimations, enemy]);

  // Set up animation URL and behavior based on current state
  useEffect(() => {
    if (animationConfig.animationUrl) {
      setCurrentAnimationUrl(animationConfig.animationUrl);
    } else if (!currentAnimationUrl) {
      // Keep existing URL if new config doesn't provide one
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

  // ✅ Enhanced animation timing with better error handling
  useEffect(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }

    if (!isPaused && currentAnimationUrl && imageReady) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);

      frameIndex.value = 0;

      if (isCompoundAnimation && currentState === 'attack') {
        const phases = COMPOUND_PHASES.attack;
        positionX.value = 0;

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
        const animationDuration = ANIMATION_DURATIONS[currentState] || (FRAME_DURATION * TOTAL_FRAMES);

        // ✅ Enhanced attack movement with smoother transitions
        if (currentState === 'attack') {
          if (attackMovement === 'slide') {
            positionX.value = withTiming(RUN_DISTANCE, { 
              duration: animationDuration,
              easing: Easing.inOut(Easing.quad) 
            });
            opacity.value = 1;
          } else if (attackMovement === 'teleport') {
            positionX.value = RUN_DISTANCE;
            opacity.value = 1;
          } else if (attackMovement === 'fade') {
            positionX.value = RUN_DISTANCE;
            opacity.value = 0;
            const fadeDuration = Math.min(300, animationDuration);
            opacity.value = withTiming(1, { 
              duration: fadeDuration,
              easing: Easing.inOut(Easing.quad)
            });
          } else {
            positionX.value = 0;
            opacity.value = 1;
          }
        } else {
          positionX.value = 0;
          opacity.value = 1;
        }

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { 
            duration: animationDuration,
            easing: Easing.inOut(Easing.ease)
          },
          (finished) => {
            if (finished) {
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = 0;
            }
          }
        );
      }
    } else {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
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
    attackMovement,
    scheduleAttackPhase,
    runScheduleHold,
    ANIMATION_DURATIONS,
    COMPOUND_PHASES,
    RUN_DISTANCE,
    characterAnimations,
    enemy,
  ]);

  // ✅ Memoize animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;

    const COLUMNS = 6;
    const frameWidth = 120;
    const frameHeight = 120;

    const column = currentFrame % COLUMNS;
    const row = Math.floor(currentFrame / COLUMNS);

    const xOffset = -(column * frameWidth);
    const yOffset = -(row * frameHeight);

    return {
      transform: [{ translateX: xOffset }, { translateY: yOffset }],
    };
  }, []);

  const positionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: positionX.value }],
    };
  }, []);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  }, []);

  // ✅ Memoize error and load handlers
  const handleImageError = useCallback((error) => {
    console.warn(`🦹 Enemy ${index} image load error:`, error, `URL: ${currentAnimationUrl}`);
  }, [index, currentAnimationUrl]);

  const handleImageLoadEnd = useCallback(() => {
    setImageReady(true);
  }, []);

  // ✅ Determine if enemy should be in front
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
      <View style={styles.spriteContainer}>
        <Animated.View style={[styles.spriteSheet, animatedStyle]}>
          {currentAnimationUrl ? (
            <Image
              source={{ uri: currentAnimationUrl }}
              style={[styles.spriteImage, isAttacking && styles.attackingImage]}
              contentFit="cover"
              onLoadEnd={handleImageLoadEnd}
              onError={handleImageError}
              cachePolicy="disk" // ✅ Enable disk caching
            />
          ) : (
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ✅ Styles remain the same
const styles = StyleSheet.create({
  enemyRun: {
    position: 'absolute',
    right: SCREEN_WIDTH * -0.02,
    top: SCREEN_HEIGHT * 0.189,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  front: {
    zIndex: 9999,
    elevation: 9999,
  },

  spriteContainer: {
    width: 120,
    height: 120,
    overflow: 'hidden',
  },

  spriteSheet: {
    width: 720, // 6 cols * 120px
    height: 480, // 4 rows * 120px
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

// ✅ Enhanced memoization with better comparison
export default React.memo(EnemyCharacter, (prevProps, nextProps) => {
  return (
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.currentState === nextProps.currentState &&
    prevProps.isAttacking === nextProps.isAttacking &&
    prevProps.attackMovement === nextProps.attackMovement &&
    prevProps.index === nextProps.index &&
    // ✅ More comprehensive animation comparison
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