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
  gameScale,
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
  const SPRITE_SIZE = useMemo(() => gameScale(150), []);
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

  // FIX: Helper function to check if ANY URL is cached (synchronous)
  const isUrlCached = useCallback((url) => {
    if (!url) return false;
    if (url.startsWith('file://')) return true;
    const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
    return cachedPath !== url && cachedPath.startsWith('file://');
  }, []);

  // FIX: Pre-check ALL animation URLs on mount to populate memory cache
  const allAnimationUrls = useMemo(() => {
    const urls = [];
    if (characterAnimations.character_idle) urls.push(characterAnimations.character_idle);
    if (characterAnimations.idle) urls.push(characterAnimations.idle);
    if (characterAnimations.character_run) urls.push(characterAnimations.character_run);
    if (characterAnimations.run) urls.push(characterAnimations.run);
    if (characterAnimations.character_hurt) urls.push(characterAnimations.character_hurt);
    if (characterAnimations.hurt) urls.push(characterAnimations.hurt);
    if (characterAnimations.character_dies) urls.push(characterAnimations.character_dies);
    if (characterAnimations.dies) urls.push(characterAnimations.dies);
    if (Array.isArray(characterAnimations.character_attack)) {
      characterAnimations.character_attack.filter(Boolean).forEach(url => urls.push(url));
    } else if (characterAnimations.character_attack) {
      urls.push(characterAnimations.character_attack);
    }
    // Also include enemy-specific URLs
    if (enemy?.enemy_idle) urls.push(enemy.enemy_idle);
    if (enemy?.enemy_run) urls.push(enemy.enemy_run);
    if (enemy?.enemy_attack) urls.push(enemy.enemy_attack);
    if (enemy?.enemy_hurt) urls.push(enemy.enemy_hurt);
    if (enemy?.enemy_dies) urls.push(enemy.enemy_dies);
    return urls.filter(url => url && typeof url === 'string');
  }, [characterAnimations, enemy]);

  // FIX: Check if ALL animations are cached (for immediate playback)
  const allAnimationsCached = useMemo(() => {
    return allAnimationUrls.every(url => isUrlCached(url));
  }, [allAnimationUrls, isUrlCached]);

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  // FIX: Set imageReady to true if ALL animations are cached
  const [imageReady, setImageReady] = useState(allAnimationsCached || isUrlCached(initialUrl));
  const [preloadedImages] = useState(new Map());
  const attackSoundTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);

  // FIX: Pre-populate preloadedImages map with all cached URLs on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      let cachedCount = 0;
      allAnimationUrls.forEach(url => {
        if (isUrlCached(url)) {
          preloadedImages.set(url, true);
          cachedCount++;
        }
      });
      
      if (cachedCount > 0) {
        console.log(`🎬 Enemy ${index}: ${cachedCount}/${allAnimationUrls.length} animations pre-cached, ready immediately`);
        setImageReady(true);
      }
    }
  }, [allAnimationUrls, isUrlCached, index]);

  useEffect(() => {
    if (attackSoundTimeoutRef.current) {
      clearTimeout(attackSoundTimeoutRef.current);
    }

    if (currentState === 'attack' && attackAudioUrl) {
      const SOUND_DELAY = 1000; 
      attackSoundTimeoutRef.current = setTimeout(() => {
        soundManager.playCombatSound(attackAudioUrl, 1.0);
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
    if (!currentAnimationUrl) return;
    
    // FIX: Check cache status synchronously
    const isCached = isUrlCached(currentAnimationUrl);
    
    if (isCached || preloadedImages.has(currentAnimationUrl)) {
      console.log(`🎬 Enemy ${index}: Animation ready:`, currentAnimationUrl.slice(-40));
      preloadedImages.set(currentAnimationUrl, true);
      if (!imageReady) setImageReady(true);
      return;
    }
    
    // Only prefetch if not cached (fallback for missing assets)
    let mounted = true;
    setImageReady(false);
    
    console.log(`🎬 Enemy ${index}: Prefetching uncached animation:`, currentAnimationUrl.slice(-40));
    
    (async () => {
      try {
        await RNImage.prefetch(currentAnimationUrl);
        if (mounted) {
          preloadedImages.set(currentAnimationUrl, true);
          setImageReady(true);
        }
      } catch (err) {
        console.warn(`Enemy ${index} prefetch failed:`, err);
        if (mounted) setImageReady(true);
      }
    })();

    return () => { mounted = false; };
  }, [currentAnimationUrl, index, isUrlCached]);

  // ========== Animation Callbacks ==========
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete) {
      onAnimationComplete(currentState);
    }
  }, [onAnimationComplete, currentState]);

  // ========== Main Animation Effect ==========
  useEffect(() => {
    if (currentState === 'attack' && attackInitiated.value) {
      return;
    }

    const config = animationConfig;
    const targetUrl = config.isCompound ? config.runUrl : config.url;

    if (targetUrl && currentAnimationUrl !== targetUrl) {
      setCurrentAnimationUrl(targetUrl);
      return; 
    }

    // FIX: Check cache for BOTH current URL AND target URL
    const isCurrentUrlCached = isUrlCached(currentAnimationUrl) || preloadedImages.has(currentAnimationUrl);
    const isTargetUrlCached = targetUrl ? (isUrlCached(targetUrl) || preloadedImages.has(targetUrl)) : true;
    const canProceed = imageReady || isCurrentUrlCached || isTargetUrlCached;

    if (isPaused || !canProceed) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(opacity);
      cancelAnimation(blinkOpacity);

      blinkOpacity.value = 0;
      return;
    }
    
    if (currentState !== 'attack' && currentState !== 'run') {
      attackInitiated.value = false;
    }
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);
    cancelAnimation(blinkOpacity);
    blinkOpacity.value = 0;
    frameIndex.value = 0;

    positionX.value = 0; 
    opacity.value = 1;

    if (config.isCompound && currentState === 'attack') {
      if (attackInitiated.value) return; 
      attackInitiated.value = true;

      const { runUrl, attackUrl } = config;
      if (!runUrl || !attackUrl) {
        runOnJS(notifyAnimationComplete)();
        return;
      }

      // FIX: Mark both URLs as ready if cached
      if (isUrlCached(runUrl)) preloadedImages.set(runUrl, true);
      if (isUrlCached(attackUrl)) preloadedImages.set(attackUrl, true);

      const RUN_DURATION = 400;
      const ATTACK_DURATION = ANIMATION_DURATIONS.attack;

      positionX.value = 0; 
      opacity.value = 1;

      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false
      );

      positionX.value = withTiming(RUN_DISTANCE, { duration: RUN_DURATION, easing: Easing.in(Easing.quad) }, (finished) => {
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
    currentState, isPaused, imageReady, currentAnimationUrl, animationConfig, notifyAnimationComplete, isUrlCached
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
    right: gameScale(-8),
    top: gameScale(126),
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