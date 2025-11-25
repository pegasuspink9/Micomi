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
import { soundManager } from '../../Sounds/UniversalSoundManager';
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
  isBonusRound = false,
  fightStatus = null,
  attackAudioUrl = null
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(0);

  const wasBonusRound = useRef(false);

  // ========== Animation Configuration ==========
  const SPRITE_SIZE = useMemo(() => scale(150), []);
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: -1,
    attack: 1300,
    hurt: 2000,
    run: -1,
    dies: 2000,
    diesOutro: 500
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
  const attackSoundTimeoutRef = useRef(null);

  useEffect(() => {
    // Always clear any pending sound timeout when state changes or the component re-renders.
    if (attackSoundTimeoutRef.current) {
      clearTimeout(attackSoundTimeoutRef.current);
    }

    if (currentState === 'attack' && attackAudioUrl) {
      // This delay (in milliseconds) should match the point in your animation
      // where the enemy's attack visually connects. 400ms is a good starting point.
      const SOUND_DELAY = 400; 
      
      console.log(`🔊 EnemyCharacter [${index}] scheduling attack sound with a ${SOUND_DELAY}ms delay.`);
      
      attackSoundTimeoutRef.current = setTimeout(() => {
        console.log(`🔊 Playing delayed attack sound for Enemy [${index}].`);
        soundManager.playCombatSound(attackAudioUrl, 0.2);
      }, SOUND_DELAY);
    }

    // This cleanup function ensures the timeout is cancelled if the component unmounts.
    return () => {
      if (attackSoundTimeoutRef.current) {
        clearTimeout(attackSoundTimeoutRef.current);
      }
    };
  }, [currentState, attackAudioUrl, index]);

  if (isBonusRound) {
    wasBonusRound.current = true;
  } 
  
  else if (currentState === 'idle') {
    wasBonusRound.current = false;
  }
   // ========== Reset positionX when state changes away from attack ==========
    useEffect(() => {
    if (currentState !== 'attack' && currentState !== 'run') {
      //  Immediately cancel and reset positionX to 0
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
        shouldLoop: isBonusRound && fightStatus !== 'won',
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
  }, [currentState, characterAnimations, isBonusRound, fightStatus]);
  
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
      cancelAnimation(blinkOpacity);
      return;
    }

    //  Reset animations
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);
    cancelAnimation(blinkOpacity);

    frameIndex.value = 0;

    //  FORCE position reset for non-attack/run states (especially hurt)
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

      if (currentState === 'run') {
        console.log(`🏃 Enemy ${index} running - animating position (one-time)`);
        positionX.value = 0;
        opacity.value = 1;

        const runDistance = -(SCREEN.width * 1);

        positionX.value = withTiming(runDistance, {
          duration: FRAME_DURATION * TOTAL_FRAMES * 1.5,
          easing: Easing.inOut(Easing.quad),
        });

        frameIndex.value = withTiming(TOTAL_FRAMES - 1, {
          duration: FRAME_DURATION * TOTAL_FRAMES,
          easing: Easing.linear,
        }, (finished) => {
          if (finished) {
            console.log(`🏃 Enemy ${index} run animation complete - starting fade-out`);
            
            //  Fade out after run completes (same as character dies)
            opacity.value = withTiming(0, {
              duration: 300,
              easing: Easing.inOut(Easing.ease),
            }, (fadeFinished) => {
              if (fadeFinished) {
                console.log(`👻 Enemy ${index} run fade-out complete - notifying`);
                frameIndex.value = 0;
                runOnJS(notifyAnimationComplete)();
              }
            });
          }
        });
        return;
      }

      if (currentState === 'hurt' && isBonusRound) {
        console.log(`🩸 Enemy ${index} hurt (BONUS ROUND) - triggering looping red flash effect`);
        blinkOpacity.value = 0;
        blinkOpacity.value = withRepeat(
          withTiming(0.7, { duration: 100, easing: Easing.inOut(Easing.ease) }),
          -1, // Loop indefinitely
          true // Reverse (fade back out)
        );
      }

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
    }else if (currentState === 'hurt') {
      console.log(`🩸 Enemy ${index} hurt - triggering red flash effect`);
      positionX.value = 0;
      opacity.value = 1;
      
      blinkOpacity.value = 0;
      blinkOpacity.value = withRepeat(
        withTiming(0.7, { // Flash to 70% red intensity
          duration: 100,
          easing: Easing.inOut(Easing.ease),
        }),
        Math.floor(ANIMATION_DURATIONS.hurt / 200), 
        true // Reverse (fade back out)
      );
    } else {
      console.log(`🩸 Enemy ${index} entering ${currentState} state - position will stay at 0`);
      positionX.value = 0;
      opacity.value = 1;
      blinkOpacity.value = 0;
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
        console.log(`Enemy ${index} ${currentState} animation completed`);
        
        if (currentState === 'dies') {
          console.log(`Enemy ${index} starting fade-out outro`);
          frameIndex.value = TOTAL_FRAMES - 1;
          
          opacity.value = withTiming(
            0,
            {
              duration: ANIMATION_DURATIONS.diesOutro,
              easing: Easing.inOut(Easing.ease),
            },
            (fadeFinished) => {
              if (fadeFinished) {
                console.log(`👻 Enemy ${index} fade-out complete`);
                runOnJS(notifyAnimationComplete)();
              }
            }
          );
        } else if (currentState === 'hurt') {
          //  FIXED: Don't reset blinkOpacity here, let it finish naturally
          console.log(`🩸 Enemy ${index} hurt animation frame complete`);
          frameIndex.value = 0;
          runOnJS(notifyAnimationComplete)();
        } else {
          //  Always reset position after animation
          positionX.value = 0;
          opacity.value = 1;
          blinkOpacity.value = 0; //  CHANGED: Reset to 0
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
      cancelAnimation(blinkOpacity);
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
    isBonusRound
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

    const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), []);

  //  CHANGED: Style for the red overlay
  const redFlashStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }), []);

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


  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', //  ADDED: White blink color
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

          {currentAnimationUrl && (
            <Animated.View style={[StyleSheet.absoluteFill, redFlashStyle]}>
              <Image
                source={{ uri: currentAnimationUrl }}
                style={[
                  styles.spriteImage, 
                  isAttacking && styles.attacking,
                   {  tintColor: wasBonusRound.current ? 'rgba(218, 200, 0, 0.88)' : '#760404a2' } 
                ]}
                contentFit="cover"
                cachePolicy="disk"
              />
            </Animated.View>
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
   blinkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: scale(8),
  },
});

export default React.memo(EnemyCharacter, (prevProps, nextProps) => {
   return (
     prevProps.isPaused === nextProps.isPaused &&
    prevProps.currentState === nextProps.currentState &&
    prevProps.isAttacking === nextProps.isAttacking &&
    prevProps.isBonusRound === nextProps.isBonusRound &&
    prevProps.index === nextProps.index &&
    prevProps.fightStatus === nextProps.fightStatus &&
    prevProps.attackAudioUrl === nextProps.attackAudioUrl &&
    JSON.stringify(prevProps.characterAnimations) === JSON.stringify(nextProps.characterAnimations)
  );
});