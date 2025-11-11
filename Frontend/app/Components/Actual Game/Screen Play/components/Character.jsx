import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { universalAssetPreloader } from '../../../../services/preloader/universalAssetPreloader';

import { 
  scale, 
  scaleWidth, 
  scaleHeight,
  RESPONSIVE ,
  getDeviceType,
  SCREEN
} from '../../../Responsiveness/gameResponsive';

const DogCharacter = ({
  isPaused,
  characterAnimations = {},
  currentState = 'idle',
  onAnimationComplete = null,
  attackMovement = 'fade',
}) => {
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0); 
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(1);

  // ✅ Responsive sprite dimensions
  const SPRITE_SIZE = useMemo(() => scale(128), []);
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState('');
  const [isAnimationLooping, setIsAnimationLooping] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isCompoundAnimation, setIsCompoundAnimation] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState('');
  const [preloadedImages] = useState(new Map());

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: 1000,
    attack: 3000, 
    hurt: 2000,
    run: -1,
    dies: 2000,
  }), []);

  const COMPOUND_PHASES = useMemo(() => ({
    attack: {
      run: { duration: 1000 },
      attack: { duration: 2000 }
    }
  }), []);

  const START_POSITION = useMemo(() => 0, []);
  const CENTER_POSITION = useMemo(() => scaleWidth(103), []); 
  const RUN_DISTANCE = useMemo(() => {
      const deviceType = getDeviceType();
      
      switch (deviceType) {
        case 'tablet':
          return (SCREEN.width * 0.6); 
        case 'large-phone':
          return (SCREEN.width * 0.8);
        case 'small-phone':
          return (SCREEN.width * 0.9); 
        default:
          return (SCREEN.width * 0.5);
      }
    }, []);

  // ✅ Responsive timing constants
  const BLINK_DURATION = useMemo(() => 50, []);
  const MOVEMENT_DURATION = useMemo(() => 100, []);
  const ATTACK_ANIMATION_DURATION = useMemo(() => 1500, []);

  const phaseTimeoutRef = useRef(null);

  // ✅ Enhanced preload animations using universalAssetPreloader
  const preloadAnimations = useCallback(async () => {
    const animationUrls = [
      characterAnimations.character_idle,
      characterAnimations.character_hurt,
      characterAnimations.character_run,
      characterAnimations.character_dies,
    ].filter(url => url);

    if (Array.isArray(characterAnimations.character_attack)) {
      characterAnimations.character_attack.forEach(url => {
        if (url) animationUrls.push(url);
      });
    } else if (characterAnimations.character_attack) {
      animationUrls.push(characterAnimations.character_attack);
    }

    for (const url of animationUrls) {
      // ✅ Check if already downloaded by universalAssetPreloader
      const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
      if (cachedPath !== url) {
        // Already cached
        preloadedImages.set(url, true);
        console.log(`🎬 Character animation already cached: ${url.slice(-50)}`);
      } else {
        console.log(`🎬 Character animation using original URL: ${url.slice(-50)}`);
        // Still use the original URL if not cached, but mark as checked
        preloadedImages.set(url, true);
      }
    }

    console.log(`🐕 Character animation preloading completed`);
  }, [characterAnimations, preloadedImages]);

  useEffect(() => {
    if (Object.keys(characterAnimations).length > 0) {
      preloadAnimations();
    }
  }, [preloadAnimations]);

  // ✅ Memoize blink animations
  const createStartBlink = useCallback(() => {
    return withSequence(
      withTiming(0.2, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) })
    );
  }, [BLINK_DURATION]);

  const createCenterBlink = useCallback(() => {
    return withSequence(
      withTiming(0.1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) })
    );
  }, [BLINK_DURATION]);

  const createEndBlink = useCallback(() => {
    return withSequence(
      withTiming(0.05, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) })
    );
  }, [BLINK_DURATION]);

  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      onAnimationComplete(currentState);
    }
  }, [onAnimationComplete, currentState]);

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
            duration: ATTACK_ANIMATION_DURATION,
            easing: Easing.inOut(Easing.ease)
          },
          (attackFinished) => {
            if (attackFinished) {
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = 0;
              blinkOpacity.value = 1;
            }
          }
        );
      }, 50);
    },
    [notifyAnimationComplete, currentAnimationUrl, ATTACK_ANIMATION_DURATION]
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

  // ✅ Updated prefetch using universalAssetPreloader
  const prefetchWithCache = useCallback(async () => {
    if (!currentAnimationUrl) return;
    
    try {
      // ✅ Check if already cached by universalAssetPreloader
      const cachedPath = universalAssetPreloader.getCachedAssetPath(currentAnimationUrl);
      if (cachedPath !== currentAnimationUrl) {
        // Already cached, mark as ready
        setImageReady(true);
        preloadedImages.set(currentAnimationUrl, true);
        console.log(`🐕 Using cached character animation: ${currentAnimationUrl.slice(-50)}`);
        return;
      }

      // ✅ If not cached, try to prefetch the original URL
      await RNImage.prefetch(currentAnimationUrl);
      preloadedImages.set(currentAnimationUrl, true);
      setImageReady(true);
      console.log(`🐕 Prefetched character animation: ${currentAnimationUrl.slice(-50)}`);
    } catch (err) {
      console.warn(`🐕 Character prefetch failed for: ${currentAnimationUrl}`, err);
    }
  }, [currentAnimationUrl, preloadedImages]);

  useEffect(() => {
    let mounted = true;
    setImageReady(false);

    if (!currentAnimationUrl) return;

    // ✅ Check if already cached or preloaded
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

    console.log(`🐕 Setting animation config for state: ${currentState}`);

    switch (currentState) {
      case 'idle':
        // ✅ URLs are already transformed to use cached paths from gameService
        animationUrl = characterAnimations.character_idle || characterAnimations.idle;
        shouldLoop = true;
        isCompound = false;
        break;
      case 'attack':
       let attackUrl = '';
      if (Array.isArray(characterAnimations.character_attack)) {
        const attackAnimations = characterAnimations.character_attack.filter(url => url && typeof url === 'string');
        if (attackAnimations.length > 0) {
          attackUrl = attackAnimations[0]; // ✅ Already transformed
        }
      } else if (typeof characterAnimations.character_attack === 'string' && characterAnimations.character_attack) {
        attackUrl = characterAnimations.character_attack; // ✅ Already transformed
      }
      
      animationUrl = attackUrl;
      shouldLoop = false;
      isCompound = false;
      break;
      case 'hurt':
        animationUrl = characterAnimations.character_hurt || characterAnimations.hurt; // ✅ Already transformed
        shouldLoop = false;
        isCompound = false;
      break;
      case 'run':
        animationUrl = characterAnimations.character_run || characterAnimations.run; // ✅ Already transformed
        shouldLoop = true;
        isCompound = false;
        break;
      case 'dies':
        animationUrl = characterAnimations.character_dies || characterAnimations.dies; // ✅ Already transformed
        shouldLoop = false;
        isCompound = false;
        break;
      default:
        animationUrl = characterAnimations.character_idle || characterAnimations.idle; // ✅ Already transformed
        shouldLoop = true;
        isCompound = false;
    }

    return { animationUrl, shouldLoop, isCompound };
  }, [currentState, characterAnimations]);

  useEffect(() => {
    if (animationConfig.animationUrl) {
      if (animationConfig.animationUrl !== currentAnimationUrl) {
        setCurrentAnimationUrl(animationConfig.animationUrl);
      }
    }
    
    setIsAnimationLooping(animationConfig.shouldLoop);
    setIsCompoundAnimation(animationConfig.isCompound);

    if (animationConfig.isCompound && currentState === 'attack') {
      setCompoundPhase('run');
    } else {
      setCompoundPhase('');
    }
  }, [animationConfig, currentState, currentAnimationUrl]);

  // Enhanced animation timing with smooth start->center->end transition
  useEffect(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }

    if (!isPaused && currentAnimationUrl && imageReady) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      cancelAnimation(blinkOpacity);

      frameIndex.value = 0;
      blinkOpacity.value = 1;

      if (isCompoundAnimation && currentState === 'attack') {
        const phases = COMPOUND_PHASES?.attack || { run: { duration: 1000 }, attack: { duration: 2000 } };
        positionX.value = 0;

        const naturalRunCycleDuration = FRAME_DURATION * TOTAL_FRAMES;

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { duration: Math.min(phases.run.duration, naturalRunCycleDuration) },
          (finished) => {
            if (finished) {
              let attackUrl;
              if (Array.isArray(characterAnimations.character_attack)) {
                const attackAnimations = characterAnimations.character_attack.filter(url => url);
                attackUrl = attackAnimations.length > 0 ? attackAnimations[0] : null;
              } else {
                attackUrl = characterAnimations.character_attack || characterAnimations.attack;
              }

              if (phases.run.duration <= naturalRunCycleDuration) {
                runOnJS(scheduleAttackPhase)(phases.attack.duration, attackUrl);
              } else {
                const remainingDuration = phases.run.duration - naturalRunCycleDuration;
                runOnJS(runScheduleHold)(remainingDuration, phases.attack.duration, attackUrl);
              }
            }
          }
        );
      }  else if (isAnimationLooping) {
      positionX.value = START_POSITION;
      opacity.value = 1;
      
      // ✅ Don't loop dies animation
      if (currentState === 'dies') {
        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { 
            duration: ANIMATION_DURATIONS.dies || 2000,
            easing: Easing.inOut(Easing.ease)
          },
          (finished) => {
            if (finished) {
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = TOTAL_FRAMES - 1; 
            }
          }
        );
      } else {
        frameIndex.value = withRepeat(
          withTiming(TOTAL_FRAMES - 1, {
            duration: FRAME_DURATION * TOTAL_FRAMES,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      }
    } else {
      if (currentState === 'attack') {
          positionX.value = START_POSITION;
          opacity.value = 1;
          
          console.log(`🐕 Phase 1: Starting blink at START position`);
          blinkOpacity.value = createStartBlink();
          
          setTimeout(() => {
            console.log(`🐕 Phase 2: Moving to CENTER and blinking`);
            positionX.value = withTiming(CENTER_POSITION, { 
              duration: MOVEMENT_DURATION,
              easing: Easing.inOut(Easing.quad)
            });
            blinkOpacity.value = createCenterBlink();
          }, BLINK_DURATION * 2);

          setTimeout(() => {
            console.log(`🐕 Phase 3: Moving to END and final blink`);
            positionX.value = withTiming(RUN_DISTANCE, { 
              duration: MOVEMENT_DURATION,
              easing: Easing.inOut(Easing.quad)
            });
            blinkOpacity.value = createEndBlink();
          }, (MOVEMENT_DURATION + BLINK_DURATION * 2) + (BLINK_DURATION * 2));

          const totalBlinkingTime = (BLINK_DURATION * 2) + MOVEMENT_DURATION + (BLINK_DURATION * 2) + MOVEMENT_DURATION + (BLINK_DURATION * 2);
          
          setTimeout(() => {
            frameIndex.value = 0;
            frameIndex.value = withTiming(
              TOTAL_FRAMES - 1,
              { 
                duration: ATTACK_ANIMATION_DURATION,
                easing: Easing.inOut(Easing.ease)
              },
              (finished) => {
                if (finished) {
                  runOnJS(notifyAnimationComplete)();
                  frameIndex.value = 0;
                  blinkOpacity.value = 1;
                }
              }
            );
          }, totalBlinkingTime);

        } else {
          positionX.value = START_POSITION;
          opacity.value = 1;

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
    } else {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      cancelAnimation(blinkOpacity);
    }

    return () => {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      cancelAnimation(blinkOpacity);
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
    createStartBlink,
    createCenterBlink,
    createEndBlink,
    START_POSITION,
    CENTER_POSITION,
    RUN_DISTANCE,
    BLINK_DURATION,
    MOVEMENT_DURATION,
    ATTACK_ANIMATION_DURATION,
    ANIMATION_DURATIONS,
    COMPOUND_PHASES,
    characterAnimations,
  ]);

  // ✅ Memoize animated styles with responsive dimensions
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
    return {
      transform: [{ translateX: positionX.value }],
    };
  }, []);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value * blinkOpacity.value,
    };
  }, []);

  const handleImageError = useCallback((error) => {
    console.error(`🐕 Failed to load animation: ${currentAnimationUrl}`, error);
  }, [currentAnimationUrl]);

  const handleImageLoadEnd = useCallback(() => {
    setImageReady(true);
  }, []);

  if (!currentAnimationUrl) {
    console.warn('🐕 No animation URL available, not rendering character');
    return null;
  }

  return (
    <Animated.View
      style={[styles.dogRun, isPaused && styles.pausedElement, positionStyle, opacityStyle]}
    >
      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
        <Animated.View style={[styles.spriteSheet, animatedStyle, {
          width: SPRITE_SIZE * SPRITE_COLUMNS,
          height: SPRITE_SIZE * SPRITE_ROWS,
        }]}>
          <Image
            source={{ uri: currentAnimationUrl }}
            style={styles.spriteImage}
            contentFit="contain"
            onError={handleImageError}
            onLoadEnd={handleImageLoadEnd}
            cachePolicy="disk"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ✅ Responsive styles
const styles = StyleSheet.create({
  dogRun: {
    position: 'absolute',
    left: scaleWidth(-8), // ✅ Responsive positioning
    top: scaleHeight(133), // ✅ Responsive positioning
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
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

  pausedElement: {
    opacity: 0.6,
  },
});

export default React.memo(DogCharacter, (prevProps, nextProps) => {
  return (
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.currentState === nextProps.currentState &&
    prevProps.attackMovement === nextProps.attackMovement &&
    prevProps.onAnimationComplete === nextProps.onAnimationComplete &&
    JSON.stringify(prevProps.characterAnimations) === JSON.stringify(nextProps.characterAnimations)
  );
});