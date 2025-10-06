import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { animationPreloader } from '../../../../services/animationPreloader';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState('');
  const [isAnimationLooping, setIsAnimationLooping] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isCompoundAnimation, setIsCompoundAnimation] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState('');
  const [preloadedImages] = useState(new Map());

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 120;

  // ✅ Memoize animation duration constants
  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: 2000,
    attack: 3000, 
    hurt: 2000,
    run: -1,
    dies: 2000,
  }), []);

  // ✅ Add missing compound phases
  const COMPOUND_PHASES = useMemo(() => ({
    attack: {
      run: { duration: 1000 },
      attack: { duration: 2000 }
    }
  }), []);

  // ✅ Memoize position constants
  const START_POSITION = useMemo(() => 0, []);
  const CENTER_POSITION = useMemo(() => SCREEN_WIDTH * 0.265, []);
  const RUN_DISTANCE = useMemo(() => SCREEN_WIDTH * 0.53, []);

  // ✅ Memoize timing constants
  const BLINK_DURATION = useMemo(() => 50, []);
  const MOVEMENT_DURATION = useMemo(() => 100, []);
  const ATTACK_ANIMATION_DURATION = useMemo(() => 1500, []);

  const phaseTimeoutRef = useRef(null);

  // ✅ Enhanced preload animations using the animation preloader service
  const preloadAnimations = useCallback(async () => {
    const animationUrls = [
      characterAnimations.character_idle,
      characterAnimations.character_hurt,
      characterAnimations.character_run,
      characterAnimations.character_dies,
    ].filter(url => url);

    // Handle character_attack array
    if (Array.isArray(characterAnimations.character_attack)) {
      characterAnimations.character_attack.forEach(url => {
        if (url) animationUrls.push(url);
      });
    } else if (characterAnimations.character_attack) {
      animationUrls.push(characterAnimations.character_attack);
    }

    // ✅ Use the global animation preloader for consistency
    for (const url of animationUrls) {
      if (!animationPreloader.isAnimationPreloaded(url)) {
        console.log(`🎬 Preloading missing character animation: ${url.slice(-50)}`);
        await animationPreloader.preloadAnimation(url);
      } else {
        // Also update local cache for backwards compatibility
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

  // ✅ Memoize animation complete callback
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      onAnimationComplete(currentState);
    }
  }, [onAnimationComplete, currentState]);

  // ✅ Memoize attack phase scheduling
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
      console.warn(`🐕 Character prefetch failed for: ${currentAnimationUrl}`, err);
      // Image onLoadEnd will handle readiness fallback
    }
  }, [currentAnimationUrl, preloadedImages]);

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

 const animationConfig = useMemo(() => {
  let animationUrl = '';
  let shouldLoop = true;
  let isCompound = false;

  console.log(`🐕 Setting animation config for state: ${currentState}`);

  switch (currentState) {
    case 'idle':
      const idleUrl = characterAnimations.character_idle || characterAnimations.idle;
      animationUrl = idleUrl ? animationPreloader.getCachedAnimationPath(idleUrl) : '';
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
        attackUrl = characterAnimations.character_attack;
      }
      
      animationUrl = attackUrl ? animationPreloader.getCachedAnimationPath(attackUrl) : '';
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

    console.log(`🐕 Final animation config:`, { 
    state: currentState, 
    url: animationUrl?.slice(-50), 
    shouldLoop, 
    isCompound,
    isCached: animationUrl?.startsWith('file://') ? 'LOCAL' : 'REMOTE'
    });

    return { animationUrl, shouldLoop, isCompound };
  }, [currentState, characterAnimations]);

  // Set up animation URL and behavior based on current state
  useEffect(() => {
  console.log(`🐕 Animation config changed:`, {
    state: currentState,
    configUrl: animationConfig.animationUrl?.slice(-50),
    currentUrl: currentAnimationUrl?.slice(-50),
    isLooping: animationConfig.shouldLoop,
    isCompound: animationConfig.isCompound
  });

  if (animationConfig.animationUrl) {
    if (animationConfig.animationUrl !== currentAnimationUrl) {
      console.log(`🐕 Changing animation URL from ${currentAnimationUrl?.slice(-50)} to ${animationConfig.animationUrl?.slice(-50)}`);
      setCurrentAnimationUrl(animationConfig.animationUrl);
    }
  } else {
    console.warn(`🐕 No animation URL in config for state: ${currentState}`);
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
  console.log(`🐕 Animation timing effect triggered:`, {
    isPaused,
    hasUrl: !!currentAnimationUrl,
    imageReady,
    currentState,
    isLooping: isAnimationLooping,
    isCompound: isCompoundAnimation
  });

  if (phaseTimeoutRef.current) {
    clearTimeout(phaseTimeoutRef.current);
    phaseTimeoutRef.current = null;
  }
  

  if (!isPaused && currentAnimationUrl && imageReady) {
    console.log(`🐕 Starting animation for state: ${currentState}`);
    console.log(`🐕 Animation URL: ${currentAnimationUrl?.slice(-50)}`);
    
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);
    cancelAnimation(blinkOpacity);

    frameIndex.value = 0;
    blinkOpacity.value = 1;

    if (isCompoundAnimation && currentState === 'attack') {
      console.log(`🐕 Starting compound attack animation`);
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

            console.log(`🐕 Compound attack phase URL:`, attackUrl?.slice(-50));

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
      console.log(`🐕 Starting looping animation for: ${currentState}`);
      positionX.value = START_POSITION;
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
      console.log(`🐕 Starting non-looping animation for: ${currentState}`);
      
      if (currentState === 'attack') {
        console.log(`🐕 Starting BLINKING + ATTACK sequence`);
        
        // ✅ PHASE 1: Setup initial position and start blinking sequence
        positionX.value = START_POSITION;
        opacity.value = 1;
        
        // Start the blinking sequence immediately
        console.log(`🐕 Phase 1: Starting blink at START position`);
        blinkOpacity.value = createStartBlink();
        
        // ✅ PHASE 2: Move to CENTER after first blink
        setTimeout(() => {
          console.log(`🐕 Phase 2: Moving to CENTER and blinking`);
          positionX.value = withTiming(CENTER_POSITION, { 
            duration: MOVEMENT_DURATION,
            easing: Easing.inOut(Easing.quad)
          });
          blinkOpacity.value = createCenterBlink();
        }, BLINK_DURATION * 2);

        // ✅ PHASE 3: Move to END after center blink
        setTimeout(() => {
          console.log(`🐕 Phase 3: Moving to END and final blink`);
          positionX.value = withTiming(RUN_DISTANCE, { 
            duration: MOVEMENT_DURATION,
            easing: Easing.inOut(Easing.quad)
          });
          blinkOpacity.value = createEndBlink();
        }, (MOVEMENT_DURATION + BLINK_DURATION * 2) + (BLINK_DURATION * 2));

        // ✅ PHASE 4: START ATTACK ANIMATION after all positioning/blinking
        const totalBlinkingTime = (BLINK_DURATION * 2) + MOVEMENT_DURATION + (BLINK_DURATION * 2) + MOVEMENT_DURATION + (BLINK_DURATION * 2);
        
        setTimeout(() => {
          console.log(`🐕 Phase 4: Starting ATTACK SPRITE ANIMATION`);
          console.log(`🐕 Attack animation URL: ${currentAnimationUrl?.slice(-50)}`);
          
          // Reset frame and start attack sprite animation
          frameIndex.value = 0;
          frameIndex.value = withTiming(
            TOTAL_FRAMES - 1,
            { 
              duration: ATTACK_ANIMATION_DURATION,
              easing: Easing.inOut(Easing.ease)
            },
            (finished) => {
              if (finished) {
                console.log(`🐕 Attack sprite animation completed`);
                runOnJS(notifyAnimationComplete)();
                frameIndex.value = 0;
                blinkOpacity.value = 1;
              }
            }
          );
        }, totalBlinkingTime);

      } else {
        // Other animations (hurt, dies) - standard behavior
        positionX.value = START_POSITION;
        opacity.value = 1;

        const animationDuration =
          ANIMATION_DURATIONS[currentState] || FRAME_DURATION * TOTAL_FRAMES;

        console.log(`🐕 Starting ${currentState} animation with duration: ${animationDuration}ms`);

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { 
            duration: animationDuration,
            easing: Easing.inOut(Easing.ease)
          },
          (finished) => {
            if (finished) {
              console.log(`🐕 ${currentState} animation completed`);
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = 0;
            }
          }
        );
      }
    }
  } else {
    console.log(`🐕 Animation stopped - isPaused: ${isPaused}, hasUrl: ${!!currentAnimationUrl}, imageReady: ${imageReady}`);
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
    COMPOUND_PHASES, // ✅ Add this to dependencies
     characterAnimations,
  ]);

  // ✅ Memoize animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;

    const COLUMNS = 6;
    const frameWidth = 100;
    const frameHeight = 100;

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
      opacity: opacity.value * blinkOpacity.value,
    };
  }, []);

  // ✅ Memoize error handler
  const handleImageError = useCallback((error) => {
    console.error(`🐕 Failed to load animation: ${currentAnimationUrl}`, error);
  }, [currentAnimationUrl]);

  // ✅ Memoize load end handler
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
      <View style={styles.spriteContainer}>
        <Animated.View style={[styles.spriteSheet, animatedStyle]}>
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

// Styles remain the same
const styles = StyleSheet.create({
  dogRun: {
    position: 'absolute',
    left: SCREEN_WIDTH * -0.02 ,
    top: SCREEN_HEIGHT * 0.17,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
  },

  spriteContainer: {
    width: 100,
    height: 100,
    overflow: 'hidden',
  },

  spriteSheet: {
    width: 600,
    height: 400,
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