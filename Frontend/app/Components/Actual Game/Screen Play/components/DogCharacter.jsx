import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const FRAME_DURATION = 100;

  // Enhanced animation duration constants
  const ANIMATION_DURATIONS = {
    idle: 2000,
    attack: 3000, 
    hurt: 2000,
    run: -1,
    dies: 2000,
  };

  // Movement positions - start, center, end
  const START_POSITION = 0;
  const CENTER_POSITION = SCREEN_WIDTH * 0.265; 
  const RUN_DISTANCE = SCREEN_WIDTH * 0.53;

  // Blink timing constants
  const BLINK_DURATION = 50; // Slightly longer blinks
  const MOVEMENT_DURATION = 100; // Duration for each movement phase
  const ATTACK_ANIMATION_DURATION = 1000; // Duration for attack frames

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

  // Enhanced blink animations for each position
  const createStartBlink = useCallback(() => {
    return withSequence(
      withTiming(0.2, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) })
    );
  }, []);

  const createCenterBlink = useCallback(() => {
    return withSequence(
      withTiming(0.1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) })
    );
  }, []);

  const createEndBlink = useCallback(() => {
    return withSequence(
      withTiming(0.05, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: BLINK_DURATION, easing: Easing.inOut(Easing.quad) })
    );
  }, []);

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

  // Enhanced attack phase with blink preparation
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

        // Start frame animation
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
    [notifyAnimationComplete, currentAnimationUrl]
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
        // Legacy compound branch - keep existing logic
        const phases = COMPOUND_PHASES?.attack || { run: { duration: 1000 }, attack: { duration: 2000 } };
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
      } else if (isAnimationLooping) {
        // Standard infinite loop
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
        // Enhanced attack sequence: START -> CENTER -> END with blinks
        if (currentState === 'attack') {
          // Reset to start position
          positionX.value = START_POSITION;
          opacity.value = 1;

          // Phase 1: Blink at START, then move to CENTER
          blinkOpacity.value = createStartBlink();
          
          setTimeout(() => {
            positionX.value = withTiming(CENTER_POSITION, { 
              duration: MOVEMENT_DURATION,
              easing: Easing.inOut(Easing.quad)
            });
          }, BLINK_DURATION * 2);

          // Phase 2: Blink at CENTER, then move to END
          setTimeout(() => {
            blinkOpacity.value = createCenterBlink();
            
            setTimeout(() => {
              positionX.value = withTiming(RUN_DISTANCE, { 
                duration: MOVEMENT_DURATION,
                easing: Easing.inOut(Easing.quad)
              });
            }, BLINK_DURATION * 2);
          }, MOVEMENT_DURATION + BLINK_DURATION * 2);

          // Phase 3: Blink at END and start attack animation
          setTimeout(() => {
            blinkOpacity.value = createEndBlink();
            
            setTimeout(() => {
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
            }, BLINK_DURATION * 2);
          }, (MOVEMENT_DURATION + BLINK_DURATION * 2) * 2);

        } else {
          // Other animations (hurt, dies) - standard behavior
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
                runOnJS(notifyAnimationComplete)();
                frameIndex.value = 0;
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
    attackMovement,
    scheduleAttackPhase,
    runScheduleHold,
    createStartBlink,
    createCenterBlink,
    createEndBlink,
  ]);

  // Animated style with smoother frame transitions
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

  // Animated style for character position
  const positionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: positionX.value }],
    };
  });

  // Combined opacity style (includes both fade and blink effects)
  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value * blinkOpacity.value,
    };
  });

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
            onLoadEnd={() => {
              setImageReady(true);
            }}
            cachePolicy="disk"
          />
        </Animated.View>
      </View>
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
});

export default DogCharacter;