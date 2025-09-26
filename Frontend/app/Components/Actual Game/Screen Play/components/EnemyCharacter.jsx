import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Image as RNImage, Text } from 'react-native';
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

  // Synchronously pick a sensible initial URL so we render immediately (prevents blank first frame)
  const initialUrl =
    characterAnimations.character_idle ||
    characterAnimations.idle ||
    enemy?.enemy_idle ||
    enemy?.idle ||
    '';

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  const [isAnimationLooping, setIsAnimationLooping] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isCompoundAnimation, setIsCompoundAnimation] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState('');
  const [preloadedImages] = useState(new Map());

  // Debug states
  const [debugFrame, setDebugFrame] = useState(0);
  const [debugPosition, setDebugPosition] = useState(0);

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 200;

  const ANIMATION_DURATIONS = {
    idle: 2000,
    attack: 1500,
    hurt: 2000,
    run: -1,
    dies: 2000,
  };

  // Enemy on right moving toward player => negative X
  const RUN_DISTANCE = SCREEN_WIDTH * -0.50;

  const phaseTimeoutRef = useRef(null);

  // Preload animation URLs (same approach as DogCharacter)
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
          console.warn(`❌ Failed to preload enemy animation: ${url}`);
        }
      });

      await Promise.allSettled(preloadPromises);
    };

    if (Object.keys(characterAnimations).length > 0 || enemy) {
      preloadAnimations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterAnimations, preloadedImages, enemy]);

  // notify parent when animation completes (if provided)
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      try {
        onAnimationComplete(currentState);
      } catch (e) {
        console.warn('onAnimationComplete error', e);
      }
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

  // Ensure we don't set state during render — prefetch readiness
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
        // onLoadEnd will handle readiness fallback
      }
    };

    prefetchWithCache();
    return () => {
      mounted = false;
    };
  }, [currentAnimationUrl, preloadedImages]);

  // Map currentState -> animation URL + loop flag (keeps your original logic)
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

    // only update if we actually have a url (prevents overwriting a good fallback with undefined)
    if (animationUrl) {
      setCurrentAnimationUrl(animationUrl);
    } else {
      // If there's no animationUrl from characterAnimations, make sure we keep the initial fallback (already in state)
      // but if that initial fallback is empty, attempt to populate from enemy prop
      if (!currentAnimationUrl) {
        const fallback = enemy?.enemy_idle || enemy?.idle || '';
        if (fallback) setCurrentAnimationUrl(fallback);
      }
    }

    setIsAnimationLooping(shouldLoop);
    setIsCompoundAnimation(isCompound);

    if (isCompound && currentState === 'attack') {
      setCompoundPhase('run');
    } else {
      setCompoundPhase('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, characterAnimations, enemy]);

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
        const naturalRunCycleDuration = FRAME_DURATION * TOTAL_FRAMES;
        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { duration: Math.min(5000, naturalRunCycleDuration) },
          (finished) => {
            if (finished) {
              const attackUrl = characterAnimations.character_attack || characterAnimations.attack;
              if (5000 <= naturalRunCycleDuration) {
                runOnJS(scheduleAttackPhase)(2000, attackUrl);
              } else {
                runOnJS(runScheduleHold)(5000 - naturalRunCycleDuration, 2000, attackUrl);
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
          }),
          -1,
          false
        );
      } else {
        // one-shot (attack/hurt/dies)
        const animationDuration =
          ANIMATION_DURATIONS[currentState] || FRAME_DURATION * TOTAL_FRAMES;

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
          positionX.value = 0;
          opacity.value = 1;
        }

        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          { duration: animationDuration },
          (finished) => {
            if (finished) {
              // notify parent (if provided)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPaused,
    currentAnimationUrl,
    isAnimationLooping,
    currentState,
    imageReady,
    isCompoundAnimation,
    attackMovement,
    scheduleAttackPhase,
    runScheduleHold,
  ]);

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
  });

  const positionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: positionX.value }],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Debug update interval (only active in dev)
  useEffect(() => {
    if (!__DEV__) return undefined;
    const interval = setInterval(() => {
      setDebugFrame(Math.floor(frameIndex.value));
      setDebugPosition(Math.floor(positionX.value));
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only render once we have an animation URL
  if (!currentAnimationUrl) {
    return null;
  }

  // ONLY visual stacking change: bring attacking enemy to front
  const isFront = currentState === 'attack' || isAttacking;

  return (
    <Animated.View
      style={[
        styles.enemyRun,
        isPaused && styles.pausedElement,
        positionStyle,
        opacityStyle,
        isFront && styles.front, // bring to front when attacking
      ]}
    >
      <View style={styles.spriteContainer}>
        <Animated.View style={[styles.spriteSheet, animatedStyle]}>
          <Image
            source={{ uri: currentAnimationUrl }}
            style={[styles.spriteImage, isAttacking && styles.attackingImage]}
            contentFit="cover"
            onLoadEnd={() => setImageReady(true)}
            onError={(err) => {
              console.warn('Enemy image load error', err);
            }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  enemyRun: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.01,
    top: SCREEN_HEIGHT * 0.175,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  // style to raise the component above others (iOS + Android)
  front: {
    zIndex: 9999,
    elevation: 9999,
  },

  spriteContainer: {
    width: 100,
    height: 100,
    overflow: 'hidden',
  },

  spriteSheet: {
    width: 600, // 6 cols * 100px
    height: 400, // 4 rows * 100px
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

  // Debug styles (remove in production)
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6,
    borderRadius: 6,
  },

  debugText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
});

export default EnemyCharacter;
