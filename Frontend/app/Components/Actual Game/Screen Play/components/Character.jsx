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


const Character = ({
  isPaused,
  characterAnimations = {},
  currentState = 'idle',
  onAnimationComplete = null,
  attackAudioUrl = null,
  containerStyle: propContainerStyle,
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(0);
  const attackInitiated = useSharedValue(false);

  // ========== Animation Configuration ==========
    const SPRITE_SIZE = useMemo(() => gameScale(128), []);
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: -1,
    attack: 1300,
    hurt: 2000,
    run: 1200, // Duration for the run-off-screen movement
    dies: 2000,
    diesOutro: 500,
  }), []);
  
  const ATTACK_RUN_DISTANCE = useMemo(() => {
    const deviceType = getDeviceType();
    const distanceMap = {
      'tablet': SCREEN.width * 0.6,
      'large-phone': SCREEN.width * 0.8,
      'small-phone': SCREEN.width * 0.9,
    };
    return distanceMap[deviceType] || SCREEN.width * 0.48;
  }, []);

  // ========== State Management ==========
  const initialUrl = useMemo(() => {
    return [characterAnimations.character_idle, characterAnimations.idle]
      .filter(url => url && typeof url === 'string')[0] || '';
  }, [characterAnimations]);

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  const [imageReady, setImageReady] = useState(false);
  const [preloadedImages] = useState(new Map());
  const attackSoundTimeoutRef = useRef(null);

  useEffect(() => {
    if (attackSoundTimeoutRef.current) clearTimeout(attackSoundTimeoutRef.current);
    if (currentState === 'attack' && attackAudioUrl) {
      const SOUND_DELAY = 1000; 
      attackSoundTimeoutRef.current = setTimeout(() => {
        soundManager.playCombatSound(attackAudioUrl);
      }, SOUND_DELAY);
    }
    return () => {
      if (attackSoundTimeoutRef.current) clearTimeout(attackSoundTimeoutRef.current);
    };
  }, [currentState, attackAudioUrl]);

  // ========== Animation Configuration Logic ==========
  const animationConfig = useMemo(() => {
    const configs = {
      idle: { url: characterAnimations.character_idle || characterAnimations.idle, shouldLoop: true, isCompound: false },
      attack: { runUrl: characterAnimations.character_run || characterAnimations.run, attackUrl: Array.isArray(characterAnimations.character_attack) ? characterAnimations.character_attack.filter(Boolean)[0] : characterAnimations.character_attack, shouldLoop: false, isCompound: true },
      hurt: { url: characterAnimations.character_hurt || characterAnimations.hurt, shouldLoop: false, isCompound: false },
      run: { url: characterAnimations.character_run || characterAnimations.run, shouldLoop: true, isCompound: false },
      dies: { url: characterAnimations.character_dies || characterAnimations.dies, shouldLoop: false, isCompound: false },
    };
    return configs[currentState] || configs.idle;
  }, [currentState, characterAnimations]);

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
      } catch (err) { console.warn(`Character prefetch failed:`, err); }
    })();
    return () => { mounted = false; };
  }, [currentAnimationUrl, preloadedImages]);

  // ========== Animation Callbacks ==========
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete) onAnimationComplete(currentState);
  }, [onAnimationComplete, currentState]);

  // ========== Main Animation Effect ==========
  useEffect(() => {
    if (currentState === 'run' && attackInitiated.value) return;
    if (currentState === 'attack' && attackInitiated.value) return;

    const config = animationConfig;
    const targetUrl = config.isCompound ? config.runUrl : config.url;

    if (targetUrl && currentAnimationUrl !== targetUrl) {
      setCurrentAnimationUrl(targetUrl);
      return; 
    }

    if (isPaused || !imageReady) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(blinkOpacity);
      blinkOpacity.value = 0;
      return;
    }
    
    if (currentState !== 'attack' && currentState !== 'run') attackInitiated.value = false;

    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);


    cancelAnimation(blinkOpacity);
    blinkOpacity.value = 0;
    frameIndex.value = 0;


    positionX.value = 0; 
    opacity.value = 1;

    // --- COMPOUND ATTACK (RUN -> ATTACK -> RETURN) ---
    if (config.isCompound && currentState === 'attack') {
      if (attackInitiated.value) return; 
      attackInitiated.value = true;
      const { runUrl, attackUrl } = config;
      if (!runUrl || !attackUrl) {
        runOnJS(notifyAnimationComplete)();
        return;
      }

      frameIndex.value = withRepeat(withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false);
      positionX.value = withTiming(ATTACK_RUN_DISTANCE, { duration: 400, easing: Easing.in(Easing.quad) }, (finished) => {
        if (!finished) return;
        cancelAnimation(frameIndex);
        frameIndex.value = 0;
        runOnJS(setCurrentAnimationUrl)(attackUrl);
        frameIndex.value = withTiming(TOTAL_FRAMES - 1, { duration: ANIMATION_DURATIONS.attack, easing: Easing.linear }, (attackFinished) => {
          if (attackFinished) {
            positionX.value = withTiming(0, { duration: 300, easing: Easing.quad }, (returnFinished) => {
              if (returnFinished) runOnJS(notifyAnimationComplete)();
            });
          }
        });
      });
      return;
    }
    
    // ✅ ADDED: Specific logic for the "run off-screen" state.
    // --- RUN OFF-SCREEN ---
    if (currentState === 'run' && !config.isCompound) {
      attackInitiated.value = true; 
      const RUN_AWAY_DISTANCE = SCREEN.width; 

      frameIndex.value = withRepeat(withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false);
      positionX.value = withTiming(RUN_AWAY_DISTANCE, { duration: ANIMATION_DURATIONS.run, easing: Easing.linear }, (finished) => {
        if (finished) {
          cancelAnimation(frameIndex);
          runOnJS(notifyAnimationComplete)();
        }
      });
      return;
    }


    if (config.shouldLoop) { // Catches 'idle'
      frameIndex.value = withRepeat(withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false);
      return;
    }

    if (currentState === 'hurt') {
      blinkOpacity.value = withRepeat(withTiming(0.7, { duration: 100 }), Math.floor(ANIMATION_DURATIONS.hurt / 200), true);
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
  }, [currentState, isPaused, imageReady, currentAnimationUrl, animationConfig, notifyAnimationComplete]);

  // ========== Animated Styles ==========
  const animatedStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    const column = frame % SPRITE_COLUMNS;
    const row = Math.floor(frame / SPRITE_COLUMNS);
    return { transform: [{ translateX: -(column * SPRITE_SIZE) }, { translateY: -(row * SPRITE_SIZE) }] };
  }, [SPRITE_SIZE]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }), []);

  const redFlashStyle = useAnimatedStyle(() => ({ opacity: blinkOpacity.value }), []);

  // ========== Render ==========
  return (
    <Animated.View style={[ styles.characterContainer, containerStyle, propContainerStyle]}>
      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
        <Animated.View style={[ styles.spriteSheet, animatedStyle, { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS } ]}>
          {currentAnimationUrl ? (
            <Image source={{ uri: currentAnimationUrl }} style={styles.spriteImage} contentFit="cover" cachePolicy="disk" />
          ) : (
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}
          {currentAnimationUrl && (
            <Animated.View style={[StyleSheet.absoluteFill, redFlashStyle]}>
              <Image source={{ uri: currentAnimationUrl }} style={[ styles.spriteImage, { tintColor: '#760404a2' }]} contentFit="cover" cachePolicy="disk" />
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  characterContainer: {
    position: 'absolute',
    left: gameScale(-8),
    top: gameScale(133),
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
  },
  spriteContainer: { overflow: 'hidden' },
  spriteSheet: {},
  spriteImage: { width: '100%', height: '100%' },
});

export default Character;
