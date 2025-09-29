// components/EnemyCharacter.js
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
  const positionX = useSharedValue(0); // for horizontal placement
  const opacity = useSharedValue(1); // for fade-in option

  // Prefer showing the raw enemy idle on first render so the enemy's initial appearance
  // matches how character shows character_idle initially.
  const initialUrl =
    enemy?.enemy_idle ||
    enemy?.idle ||
    characterAnimations.character_idle ||
    characterAnimations.idle ||
    '';

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  const [isAnimationLooping, setIsAnimationLooping] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [isCompoundAnimation, setIsCompoundAnimation] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState('');
  const [preloadedImages] = useState(new Map()); // Cache for preloaded images

  // Debug states
  const [debugFrame, setDebugFrame] = useState(0);
  const [debugPosition, setDebugPosition] = useState(0);

  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 200; // keep enemy timing similar to your original

  // Animation duration constants (in milliseconds) -- preserved from your enemy version
  const ANIMATION_DURATIONS = {
    idle: 2000,
    attack: 1500,
    hurt: 2000,
    run: -1,
    dies: 2000,
  };

  // Compound animation phases (kept for compatibility — same approach as Dog)
  const COMPOUND_PHASES = {
    attack: {
      run: { duration: 5000, animation: 'run' },
      attack: { duration: 2000, animation: 'attack' },
    },
  };

  // Enemy moves from right → left when attacking
  const RUN_DISTANCE = SCREEN_WIDTH * -0.50;

  // Ref to hold pending timeout ids so we can clear them on cleanup
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

  // Callback to notify parent when animation completes
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      try {
        onAnimationComplete(currentState);
      } catch (e) {
        console.warn('onAnimationComplete error', e);
      }
    }
  }, [onAnimationComplete, currentState]);

  // Helper: schedule an attack phase from JS (keeps Dog behavior)
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

  // Small helper: schedule hold AFTER natural cycle (keeps Dog behavior)
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

  // Map currentState -> animation URL + loop flag (uses same selection logic as Dog)
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
      // If there's no animationUrl from characterAnimations, keep the initial fallback from enemy prop
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

  // Handle animation timing and looping (copied Dog logic, adjusted for enemy movement direction)
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
        // Compound branch (kept from Dog implementation)
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

        // Handle attack movement modes (enemy moves left)
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
  }, []);

  // NOTE: we intentionally do NOT return early if currentAnimationUrl is empty.
  // Doing so previously prevented the debug panel from showing on first appearance.
  // Instead we render the component (empty sprite area if no url) and still show debug.

  // Bring attacking enemy to front visually
  const isFront = currentState === 'attack' || isAttacking;

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
              onLoadEnd={() => setImageReady(true)}
              onError={(err) => {
                console.warn('Enemy image load error', err);
              }}
            />
          ) : (
            // empty placeholder so sprite container still takes space when URL is not yet available
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}
        </Animated.View>
      </View>
{/* 
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            State: {currentState} | Loop: {isAnimationLooping ? 'Y' : 'N'}
          </Text>
          {isCompoundAnimation && (
            <Text style={styles.debugText}>Phase: {compoundPhase} | Compound: Y</Text>
          )}
          <Text style={styles.debugText}>
            Preloaded: {preloadedImages.size} | Ready: {imageReady ? 'Y' : 'N'}
          </Text>
          <Text style={styles.debugText}>
            URL:{' '}
            {currentAnimationUrl
              ? currentAnimationUrl.substring(Math.max(0, currentAnimationUrl.length - 20))
              : 'None'}
          </Text>
          <RNImage
            source={{
              uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758953113/491922473-52b411e8-e027-44bb-a9ec-4fed9f3d5f80_msrgsp.png',
            }}
            style={{ width: 50, height: 50, marginTop: 4 }}
          />
          <Text style={styles.debugText}>Frame: {debugFrame} | Pos: {debugPosition}</Text>
        </View>
      )} */}
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
