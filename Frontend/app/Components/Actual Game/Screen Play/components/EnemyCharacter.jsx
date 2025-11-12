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
  getDeviceType,
  SCREEN
} from '../../../Responsiveness/gameResponsive';

const EnemyCharacter = ({
  isPaused,
  enemy = {},
  index,
  isAttacking = false,
  characterAnimations = {},
  currentState = 'idle',
  onAnimationComplete = null,
  attackMovement = 'fade',
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // ========== Animation Configuration ==========
  const SPRITE_SIZE = useMemo(() => scale(150), []);
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: -1,
    attack: 1500,
    hurt: 2000,
    run: -1,
    dies: 2000,
  }), []);

  const COMPOUND_PHASES = useMemo(() => ({
    attack: {
      run: { duration: 5000 },
      attack: { duration: 2000 },
    },
  }), []);

  const RUN_DISTANCE = useMemo(() => {
    const deviceType = getDeviceType();
    const distanceMap = {
      'tablet': SCREEN.width * 0.6,
      'large-phone': SCREEN.width * 0.8,
      'small-phone': SCREEN.width * 0.9,
    };
    return -(distanceMap[deviceType] || SCREEN.width * 0.5);
  }, []);

  // ========== State Management ==========
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
  const [preloadedImages] = useState(new Map());
  const phaseTimeoutRef = useRef(null);

   // ========== Reset positionX when state changes away from attack ==========
    useEffect(() => {
    if (currentState !== 'attack' && currentState !== 'run') {
      // ✅ Immediately cancel and reset positionX to 0
      cancelAnimation(positionX);
      positionX.value = 0;
      console.log(`🦹 Enemy ${index} - Force reset position to 0 for ${currentState} state`);
    }
  }, [currentState, index]);

  // ========== Animation Configuration Logic ==========
  const animationConfig = useMemo(() => {
    const configs = {
      idle: {
        url: characterAnimations.character_idle || characterAnimations.idle,
        shouldLoop: true,
        isCompound: false,
      },
      attack: {
        url: Array.isArray(characterAnimations.character_attack)
          ? characterAnimations.character_attack.filter(url => url && typeof url === 'string')[0]
          : characterAnimations.character_attack,
        shouldLoop: false,
        isCompound: false,
      },
      hurt: {
        url: characterAnimations.character_hurt || characterAnimations.hurt,
        shouldLoop: false,
        isCompound: false,
      },
      run: {
        url: characterAnimations.character_run || characterAnimations.run,
        shouldLoop: true,
        isCompound: false,
      },
      dies: {
        url: characterAnimations.character_dies || characterAnimations.dies,
        shouldLoop: false,
        isCompound: false,
      },
    };

    return configs[currentState] || configs.idle;
  }, [currentState, characterAnimations]);

  // ========== Sync Animation Config to State ==========
  useEffect(() => {
    if (animationConfig.url) {
      setCurrentAnimationUrl(animationConfig.url);
    } else if (!currentAnimationUrl) {
      setCurrentAnimationUrl(initialUrl);
    }

    setIsAnimationLooping(animationConfig.shouldLoop);
    setIsCompoundAnimation(animationConfig.isCompound);
  }, [animationConfig, initialUrl, currentAnimationUrl]);

  // ========== Image Preloading ==========
  const prefetchWithCache = useCallback(async () => {
    if (!currentAnimationUrl) return;

    try {
      const cachedPath = universalAssetPreloader.getCachedAssetPath(currentAnimationUrl);
      
      if (cachedPath !== currentAnimationUrl || preloadedImages.has(currentAnimationUrl)) {
        setImageReady(true);
        preloadedImages.set(currentAnimationUrl, true);
        console.log(`🦹 Using cached enemy animation: ${currentAnimationUrl.slice(-50)}`);
        return;
      }

      await RNImage.prefetch(currentAnimationUrl);
      preloadedImages.set(currentAnimationUrl, true);
      setImageReady(true);
      console.log(`🦹 Prefetched enemy animation: ${currentAnimationUrl.slice(-50)}`);
    } catch (err) {
      console.warn(`Enemy ${index} prefetch failed:`, err);
    }
  }, [currentAnimationUrl, preloadedImages, index]);

  useEffect(() => {
    let mounted = true;
    setImageReady(false);

    if (!currentAnimationUrl) return;

    const cachedPath = universalAssetPreloader.getCachedAssetPath(currentAnimationUrl);
    if (cachedPath !== currentAnimationUrl || preloadedImages.has(currentAnimationUrl)) {
      if (mounted) setImageReady(true);
      return;
    }

    prefetchWithCache();
    return () => { mounted = false; };
  }, [currentAnimationUrl, prefetchWithCache]);

  // ========== Animation Callbacks ==========
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete && typeof onAnimationComplete === 'function') {
      try {
        onAnimationComplete(currentState);
      } catch (e) {
        console.warn(`Enemy ${index} onAnimationComplete error:`, e);
      }
    }
  }, [onAnimationComplete, currentState, index]);

  const scheduleAttackPhase = useCallback(
    (attackDuration, attackUrl) => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }

      phaseTimeoutRef.current = setTimeout(() => {
        if (attackUrl && attackUrl !== currentAnimationUrl) {
          setCurrentAnimationUrl(attackUrl);
        }

        frameIndex.value = 0;
        frameIndex.value = withTiming(
          TOTAL_FRAMES - 1,
          {
            duration: attackDuration,
            easing: Easing.inOut(Easing.ease),
          },
          (finished) => {
            if (finished) {
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
      }
      phaseTimeoutRef.current = setTimeout(() => {
        scheduleAttackPhase(attackDuration, attackUrl);
      }, delayMs);
    },
    [scheduleAttackPhase]
  );

  // ========== Main Animation Effect ==========
  useEffect(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }

    if (isPaused || !currentAnimationUrl || !imageReady) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      return;
    }

    // ✅ Reset animations
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);

    frameIndex.value = 0;

    // ✅ FORCE position reset for non-attack/run states (especially hurt)
    if (currentState !== 'attack' && currentState !== 'run') {
      positionX.value = 0;
      opacity.value = 1;
    }

    // ========== Compound Attack Animation ==========
    if (isCompoundAnimation && currentState === 'attack') {
      const phases = COMPOUND_PHASES.attack;
      const naturalRunDuration = FRAME_DURATION * TOTAL_FRAMES;

      frameIndex.value = withTiming(
        TOTAL_FRAMES - 1,
        {
          duration: Math.min(phases.run.duration, naturalRunDuration),
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            const attackUrl = characterAnimations.character_attack ||
                            characterAnimations.attack ||
                            enemy?.enemy_attack;

            if (phases.run.duration <= naturalRunDuration) {
              runOnJS(scheduleAttackPhase)(phases.attack.duration, attackUrl);
            } else {
              const remainingDuration = phases.run.duration - naturalRunDuration;
              runOnJS(runScheduleHold)(remainingDuration, phases.attack.duration, attackUrl);
            }
          }
        }
      );
      return;
    }

    // ========== Looping Animation (Idle, Run) ==========
    if (isAnimationLooping) {
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
      return;
    }

    // ========== Non-Looping Animation (Hurt, Dies, Attack) ==========
        if (currentState === 'attack') {
      console.log(`⚔️ Enemy ${index} entering attack state - will animate positionX`);
      positionX.value = 0;
      opacity.value = 1;

      if (attackMovement === 'slide') {
        positionX.value = withTiming(RUN_DISTANCE, {
          duration: ANIMATION_DURATIONS.attack,
          easing: Easing.inOut(Easing.quad),
        });
      } else if (attackMovement === 'teleport') {
        positionX.value = RUN_DISTANCE;
      } else if (attackMovement === 'fade') {
        positionX.value = RUN_DISTANCE;
        opacity.value = 0;
        opacity.value = withTiming(1, {
          duration: Math.min(300, ANIMATION_DURATIONS.attack),
          easing: Easing.inOut(Easing.quad),
        });
      }
    } else {
      // ✅ For hurt, dies, run - NEVER animate positionX
      console.log(`🩸 Enemy ${index} entering ${currentState} state - position will stay at 0`);
      positionX.value = 0;
      opacity.value = 1;
    }

    // Play frame animation
    const duration = ANIMATION_DURATIONS[currentState] || (FRAME_DURATION * TOTAL_FRAMES);
    console.log(`🎬 Enemy ${index} ${currentState} animation starting - duration: ${duration}ms, positionX: ${positionX.value}`);

    frameIndex.value = withTiming(
      TOTAL_FRAMES - 1,
      {
        duration,
        easing: Easing.inOut(Easing.ease),
      },
      (finished) => {
        if (finished) {
          console.log(`✅ Enemy ${index} ${currentState} animation completed`);
          // ✅ Always reset position after animation
          positionX.value = 0;
          opacity.value = 1;

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

    // ========== Cleanup ==========
    return () => {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [
    isPaused,
    currentAnimationUrl,
    imageReady,
    isAnimationLooping,
    isCompoundAnimation,
    currentState,
    notifyAnimationComplete,
    scheduleAttackPhase,
    runScheduleHold,
    ANIMATION_DURATIONS,
    COMPOUND_PHASES,
    RUN_DISTANCE,
    FRAME_DURATION,
    TOTAL_FRAMES,
    attackMovement,
    characterAnimations,
    enemy,
  ]);

  // ========== Animated Styles ==========
  const animatedStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    const column = frame % SPRITE_COLUMNS;
    const row = Math.floor(frame / SPRITE_COLUMNS);

    return {
      transform: [
        { translateX: -(column * SPRITE_SIZE) },
        { translateY: -(row * SPRITE_SIZE) },
      ],
    };
  }, [SPRITE_SIZE]);

     const positionStyle = useAnimatedStyle(() => {
    if (currentState === 'attack' || currentState === 'run') {
      console.log(`📍 Applying positionX movement: ${positionX.value}`);
      return { 
        transform: [{ translateX: positionX.value }] 
      };
    }
    console.log(`📍 Forcing position 0 for ${currentState} state`);
    return { 
      transform: [{ translateX: 0 }] 
    };
  }, [currentState]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), []);

  // ========== Event Handlers ==========
  const handleImageError = useCallback((error) => {
    console.warn(`🦹 Enemy ${index} image load error:`, error);
  }, [index]);

  const handleImageLoadEnd = useCallback(() => {
    setImageReady(true);
  }, []);

  const isFront = useMemo(
    () => currentState === 'attack' || isAttacking,
    [currentState, isAttacking]
  );

  // ========== Render ==========
  return (
    <Animated.View
      style={[
        styles.enemyContainer,
        positionStyle,
        opacityStyle,
        isFront && styles.front,
        isPaused && styles.paused,
      ]}
    >
      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
        <Animated.View
          style={[
            styles.spriteSheet,
            animatedStyle,
            {
              width: SPRITE_SIZE * SPRITE_COLUMNS,
              height: SPRITE_SIZE * SPRITE_ROWS,
            },
          ]}
        >
          {currentAnimationUrl ? (
            <Image
              source={{ uri: currentAnimationUrl }}
              style={[styles.spriteImage, isAttacking && styles.attacking]}
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

// ========== Styles ==========
const styles = StyleSheet.create({
  enemyContainer: {
    position: 'absolute',
    right: scaleWidth(-8),
    top: scaleHeight(126),
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spriteContainer: {
    overflow: 'hidden',
  },
  spriteSheet: {},
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  attacking: {
    transform: [{ scale: 1.1 }],
  },
  front: {
    zIndex: 9999,
    elevation: 9999,
  },
  paused: {
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