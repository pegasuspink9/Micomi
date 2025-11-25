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
  const attackInitiated = useSharedValue(false);

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
  const [imageReady, setImageReady] = useState(false);
  const [preloadedImages] = useState(new Map());
  const attackSoundTimeoutRef = useRef(null);

  useEffect(() => {
    if (attackSoundTimeoutRef.current) {
      clearTimeout(attackSoundTimeoutRef.current);
    }

    if (currentState === 'attack' && attackAudioUrl) {
      const SOUND_DELAY = 400; 
      attackSoundTimeoutRef.current = setTimeout(() => {
        soundManager.playCombatSound(attackAudioUrl, 0.2);
      }, SOUND_DELAY);
    }
    return () => {
      if (attackSoundTimeoutRef.current) {
        clearTimeout(attackSoundTimeoutRef.current);
      }
    };
  }, [currentState, attackAudioUrl, index]);

  if (isBonusRound) wasBonusRound.current = true;
  else if (currentState === 'idle') wasBonusRound.current = false;

  // ========== Animation Configuration Logic ==========
  const animationConfig = useMemo(() => {
    const configs = {
      idle: {
        url: characterAnimations.character_idle || characterAnimations.idle,
        shouldLoop: true,
        isCompound: false,
      },
      attack: {
        runUrl: characterAnimations.character_run || characterAnimations.run,
        attackUrl: Array.isArray(characterAnimations.character_attack)
          ? characterAnimations.character_attack.filter(url => url && typeof url === 'string')[0]
          : characterAnimations.character_attack,
        shouldLoop: false,
        isCompound: true,
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

  // ========== Image Preloading ==========
  useEffect(() => {
    let mounted = true;
    if (!currentAnimationUrl) return;

    setImageReady(false);
    const cachedPath = universalAssetPreloader.getCachedAssetPath(currentAnimationUrl);
    if (cachedPath !== currentAnimationUrl || preloadedImages.has(currentAnimationUrl)) {
      if (mounted) setImageReady(true);
      return;
    }
    
    (async () => {
      try {
        await RNImage.prefetch(currentAnimationUrl);
        if (mounted) {
          preloadedImages.set(currentAnimationUrl, true);
          setImageReady(true);
        }
      } catch (err) {
        console.warn(`Enemy ${index} prefetch failed:`, err);
      }
    })();

    return () => { mounted = false; };
  }, [currentAnimationUrl, preloadedImages, index]);

  // ========== Animation Callbacks ==========
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete) {
      onAnimationComplete(currentState);
    }
  }, [onAnimationComplete, currentState]);

  // ========== Main Animation Effect ==========
  useEffect(() => {
    // ✅ FIXED: This guard clause is the key. It prevents re-renders from
    // interrupting an attack sequence that is already in progress.
    if (currentState === 'attack' && attackInitiated.value) {
      return;
    }

    const config = animationConfig;
    const targetUrl = config.isCompound ? config.runUrl : config.url;

    if (targetUrl && currentAnimationUrl !== targetUrl) {
      setCurrentAnimationUrl(targetUrl);
      return; 
    }

    if (isPaused || !imageReady) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      cancelAnimation(blinkOpacity);
      return;
    }
    
    if (currentState !== 'attack') {
      attackInitiated.value = false;
    }
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);
    cancelAnimation(blinkOpacity);
    frameIndex.value = 0;

    if (config.isCompound && currentState === 'attack') {
      if (attackInitiated.value) return; 
      attackInitiated.value = true;

      const { runUrl, attackUrl } = config;
      if (!runUrl || !attackUrl) {
        runOnJS(notifyAnimationComplete)();
        return;
      }

      const RUN_DURATION = 600;
      const ATTACK_DURATION = ANIMATION_DURATIONS.attack;

      positionX.value = 0; 
      opacity.value = 1;

      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false
      );

      positionX.value = withTiming(RUN_DISTANCE, { duration: RUN_DURATION, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (!finished) return;

        cancelAnimation(frameIndex);
        frameIndex.value = 0;
        runOnJS(setCurrentAnimationUrl)(attackUrl);

        frameIndex.value = withTiming(TOTAL_FRAMES - 1, { duration: ATTACK_DURATION, easing: Easing.linear }, (attackFinished) => {
          if (attackFinished) {
            positionX.value = withTiming(0, { duration: 300, easing: Easing.quad }, (returnFinished) => {
              if (returnFinished) {
                runOnJS(notifyAnimationComplete)();
              }
            });
          }
        });
      });
      return;
    }

    positionX.value = 0;
    opacity.value = 1;

    if (config.shouldLoop) {
      if (currentState === 'hurt' && isBonusRound) {
        blinkOpacity.value = withRepeat(withTiming(0.7, { duration: 100 }), -1, true);
      }
      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false
      );
      return;
    }

    if (currentState === 'hurt') {
      blinkOpacity.value = withRepeat(
        withTiming(0.7, { duration: 100 }), Math.floor(ANIMATION_DURATIONS.hurt / 200), true
      );
    } else {
      blinkOpacity.value = 0;
    }

    const duration = ANIMATION_DURATIONS[currentState] || (FRAME_DURATION * TOTAL_FRAMES);
    frameIndex.value = withTiming(TOTAL_FRAMES - 1, { duration, easing: Easing.inOut(Easing.ease) }, (finished) => {
      if (finished) {
        if (currentState === 'dies') {
          opacity.value = withTiming(0, { duration: ANIMATION_DURATIONS.diesOutro }, (fadeFinished) => {
            if (fadeFinished) runOnJS(notifyAnimationComplete)();
          });
        } else {
          runOnJS(notifyAnimationComplete)();
          frameIndex.value = 0;
        }
      }
    });
  }, [
    currentState, isPaused, imageReady, currentAnimationUrl, animationConfig, notifyAnimationComplete
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

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }), []);

  const redFlashStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }), []);

  const isFront = useMemo(() => currentState === 'attack' || isAttacking, [currentState, isAttacking]);

  // ========== Render ==========
  return (
    <Animated.View style={[ styles.enemyContainer, containerStyle, isFront && styles.front ]} >
      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
        <Animated.View style={[ styles.spriteSheet, animatedStyle, { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS }]} >
          {currentAnimationUrl ? (
            <Image
              source={{ uri: currentAnimationUrl }}
              style={styles.spriteImage}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}
          {currentAnimationUrl && (
            <Animated.View style={[StyleSheet.absoluteFill, redFlashStyle]}>
              <Image
                source={{ uri: currentAnimationUrl }}
                style={[ styles.spriteImage, { tintColor: wasBonusRound.current ? 'rgba(218, 200, 0, 0.88)' : '#760404a2' } ]}
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
  front: {
    zIndex: 9999,
  },
});

export default EnemyCharacter;