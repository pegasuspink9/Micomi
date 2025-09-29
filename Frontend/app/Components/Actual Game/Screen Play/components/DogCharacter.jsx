import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';

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

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState('');
  const [isAnimationLooping, setIsAnimationLooping] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isCompoundAnimation, setIsCompoundAnimation] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState(''); // kept for debug compatibility
  const [preloadedImages] = useState(new Map()); // Cache for preloaded images

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 150;

  // Animation duration constants (in milliseconds)
  const ANIMATION_DURATIONS = {
    idle: 2000,
    attack: 2500, // attack duration
    hurt: 2000,
    run: -1,
    dies: 2000,
  };

  // Compound animation phases (kept for compatibility)
  const COMPOUND_PHASES = {
    attack: {
      run: { duration: 5000, animation: 'run' },
      attack: { duration: 2000, animation: 'attack' },
    },
  };

  const RUN_DISTANCE = SCREEN_WIDTH * 0.53; 

  // Ref to hold pending timeout ids so we can clear them on cleanup
  const phaseTimeoutRef = useRef(null);

  // Preload all animations when character animations change
  useEffect(() => {
    const preloadAnimations = async () => {
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
      ].filter((url) => url && !preloadedImages.has(url));

      const preloadPromises = animationUrls.map(async (url) => {
        try {
          await RNImage.prefetch(url);
          preloadedImages.set(url, true);
        } catch (error) {
          console.warn(`❌ Failed to preload: ${url}`);
        }
      });

      await Promise.allSettled(preloadPromises);
    };

    if (Object.keys(characterAnimations).length > 0) {
      preloadAnimations();
    }
  }, [characterAnimations, preloadedImages]);

  // Callback to notify parent when animation completes
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      onAnimationComplete(currentState);
    }
  }, [onAnimationComplete, currentState]);

  // Helper function to switch animation phase (JS)
  const switchToPhase = useCallback(
    (phase, animationType) => {
      setCompoundPhase(phase);
      const phaseAnimationUrl =
        characterAnimations[`character_${animationType}`] || characterAnimations[animationType];
      if (phaseAnimationUrl !== currentAnimationUrl) {
        setCurrentAnimationUrl(phaseAnimationUrl);
      }
    },
    [characterAnimations, currentAnimationUrl]
  );

  // JS helper to schedule starting the attack phase (runs on JS thread).
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
          { duration: attackDuration },
          (attackFinished) => {
            if (attackFinished) {
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = 0;
            }
          }
        );
      }, 50);
    },
    [notifyAnimationComplete, currentAnimationUrl]
  );

  // Another small helper: used to schedule a hold (JS) after natural cycle
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

  // Image prefetch & readiness for currentAnimationUrl
  useEffect(() => {
    let mounted = true;
    setImageReady(false);

    if (!currentAnimationUrl) return;

    if (preloadedImages.has(currentAnimationUrl)) {
      if (mounted) setImageReady(true);
      return;
    }

    const prefetchWithCache = async () => {
      try {
        await RNImage.prefetch(currentAnimationUrl);
        preloadedImages.set(currentAnimationUrl, true);
        if (mounted) setImageReady(true);
      } catch (err) {
        // rely on Image onLoadEnd
      }
    };

    prefetchWithCache();
    return () => {
      mounted = false;
    };
  }, [currentAnimationUrl, preloadedImages]);

  // Set up animation URL and behavior based on current state
  useEffect(() => {
    let animationUrl = '';
    let shouldLoop = true;
    let isCompound = false;

    switch (currentState) {
      case 'idle':
        animationUrl = characterAnimations.character_idle || characterAnimations.idle;
        shouldLoop = true;
        isCompound = false;
        break;
      case 'attack':
        animationUrl = characterAnimations.character_attack || characterAnimations.attack;
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

    setCurrentAnimationUrl(animationUrl);
    setIsAnimationLooping(shouldLoop);
    setIsCompoundAnimation(isCompound);

    if (isCompound && currentState === 'attack') {
      setCompoundPhase('run');
    } else {
      setCompoundPhase('');
    }
  }, [currentState, characterAnimations]);

  // Handle animation timing and looping
  useEffect(() => {
    // clear any previously scheduled timeouts when we (re)start animation
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
        // Legacy compound branch (kept for compatibility)
        const phases = COMPOUND_PHASES.attack;
        positionX.value = 0;

        const naturalRunCycleDuration = FRAME_DURATION * TOTAL_FRAMES;

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { duration: Math.min(phases.run.duration, naturalRunCycleDuration) },
          (finished) => {
            if (finished) {
              const attackUrl = characterAnimations.character_attack || characterAnimations.attack;

              if (phases.run.duration <= naturalRunCycleDuration) {
                runOnJS(scheduleAttackPhase)(phases.attack.duration, attackUrl);
              } else {
                const remainingDuration = phases.run.duration - naturalRunCycleDuration;
                runOnJS(runScheduleHold)(remainingDuration, phases.attack.duration, attackUrl);
              }
            }
          }
        );

        // no movement is started here to avoid crashes in legacy branch
      } else if (isAnimationLooping) {
        // Standard infinite loop for idle, run animations
        positionX.value = 0; // Reset position for non-compound animations
        opacity.value = 1; // ensure visible
        frameIndex.value = withRepeat(
          withTiming(TOTAL_FRAMES - 1, {
            duration: FRAME_DURATION * TOTAL_FRAMES,
          }),
          -1,
          false
        );
      } else {
        // One-shot animations (hurt, dies, attack)
        const animationDuration =
          ANIMATION_DURATIONS[currentState] || FRAME_DURATION * TOTAL_FRAMES;

        // Handle attack movement modes
        if (currentState === 'attack') {
          if (attackMovement === 'slide') {
            positionX.value = withTiming(RUN_DISTANCE, { duration: animationDuration });
            opacity.value = 1;
          } else if (attackMovement === 'teleport') {
            positionX.value = RUN_DISTANCE;
            opacity.value = 1;
          } else if (attackMovement === 'fade') {
            positionX.value = RUN_DISTANCE;
            opacity.value = 0;
            const fadeDuration = Math.min(300, animationDuration);
            opacity.value = withTiming(1, { duration: fadeDuration });
          } else {
            positionX.value = 0;
            opacity.value = 1;
          }
        } else {
          // ensure no position movement for other one-shot animations
          positionX.value = 0;
          opacity.value = 1;
        }

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { duration: animationDuration },
          (finished) => {
            if (finished) {
              runOnJS(notifyAnimationComplete)();
              frameIndex.value = 0;
            }
          }
        );
      }
    } else {
      // paused or not ready: cancel running animations
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;

    const COLUMNS = 6;
    const frameWidth = 90;
    const frameHeight = 90;

    const column = currentFrame % COLUMNS;
    const row = Math.floor(currentFrame / COLUMNS);

    const xOffset = -(column * frameWidth);
    const yOffset = -(row * frameHeight);

    return {
      transform: [{ translateX: xOffset }, { translateY: yOffset }],
    };
  });

  // Animated style for character position (for run movement)
  const positionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: positionX.value }],
    };
  });

  // Animated opacity style (for fade mode)
  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Safe debug hooks
  const [debugFrame, setDebugFrame] = useState(0);
  const [debugPosition, setDebugPosition] = useState(0);

  useEffect(() => {
    const updateDebugValues = () => {
      setTimeout(() => {
        if (__DEV__) {
          setDebugFrame(Math.floor(frameIndex.value));
          setDebugPosition(Math.floor(positionX.value));
        }
      }, 100);
    };

    const interval = setInterval(updateDebugValues, 500); // Update every 500ms
    return () => clearInterval(interval);
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
            onError={(error) => {
              console.error(`🐕 Failed to load animation: ${currentAnimationUrl}`, error);
            }}
            onLoadStart={() => {
              // no-op
            }}
            onLoad={() => {
              // no-op
            }}
            onLoadEnd={() => {
              setImageReady(true);
            }}
            cachePolicy="disk"
          />
        </Animated.View>
      </View>

      {/* Debug info (remove in production) */}
      
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dogRun: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.01,
    top: SCREEN_HEIGHT * 0.18,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
  },

  spriteContainer: {
    width: 90,
    height: 90,
    overflow: 'hidden',
    borderRadius: 8,
  },

  spriteSheet: {
    width: 540,
    height: 360,
  },

  spriteImage: {
    width: '100%',
    height: '100%',
  },

  pausedElement: {
    opacity: 0.6,
  },

  // Debug styles (remove in production)
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 2,
    borderRadius: 4,
  },

  debugText: {
    color: 'white',
    fontSize: 8,
  },
});

export default DogCharacter;
