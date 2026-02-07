import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay, 
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
  characterName = '', 
  currentState = 'idle',
  onAnimationComplete = null,
  attackAudioUrl = null,
  containerStyle: propContainerStyle,
  potionEffectUrl = null,
  attackOverlayUrl = null, 
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(0);
  const attackInitiated = useSharedValue(false);
  const overlayOpacity = useSharedValue(0);

  const rangeProjectileX = useSharedValue(0);

  const potionFrameIndex = useSharedValue(0);
  const potionOpacity = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(attackOverlayUrl ? 1 : 0, { duration: 500 });
  }, [attackOverlayUrl]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [
      { translateY: withRepeat(withTiming(-5, { duration: 1000 }), -1, true) } // Subtle hover animation
    ]
  }));

  // ========== State Management (Lifted up for use in effectiveName) ==========
  const initialUrl = useMemo(() => {
    const candidates = [
      characterAnimations.character_idle, 
      characterAnimations.idle
    ].filter(url => url && typeof url === 'string');
    return candidates[0] || '';
  }, [characterAnimations]);

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);

  //  NEW: Robust Character Name Detection
  // If characterName prop is missing (during transition), fallback to checking the URL
  const effectiveCharacterName = useMemo(() => {
    if (characterName) return characterName;
    if (currentAnimationUrl?.includes('Leon')) return 'Leon';
    if (currentAnimationUrl?.includes('Ryron')) return 'Ryron';
    return '';
  }, [characterName, currentAnimationUrl]);

  // ========== Animation Configuration ==========
  
  //  UPDATED: Uses effectiveCharacterName so size persists even if prop is lost
  const SPRITE_SIZE = useMemo(() => {
    if (effectiveCharacterName === 'Leon') {
      return gameScale(155); 
    }
    return gameScale(128); 
  }, [effectiveCharacterName]);

  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const ANIMATION_DURATIONS = useMemo(() => ({
    idle: -1,
    attack: 1300,
    hurt: 2000,
    run: 1200,
    dies: 2000,
    diesOutro: 500,
  }), []);
  
  const ATTACK_RUN_DISTANCE = useMemo(() => {
    return gameScale(205); 
  }, []);


  const isUrlCached = useCallback((url) => {
    if (!url) return false;
    if (url.startsWith('file://')) return true;
    const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
    return cachedPath !== url && cachedPath.startsWith('file://');
  }, []);

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
    
    if (characterAnimations.character_range_attack) {
        urls.push(characterAnimations.character_range_attack);
    }

    return urls.filter(url => url && typeof url === 'string');
  }, [characterAnimations]);


  const allAnimationsCached = useMemo(() => {
    return allAnimationUrls.every(url => isUrlCached(url));
  }, [allAnimationUrls, isUrlCached]);

  
  const [imageReady, setImageReady] = useState(allAnimationsCached || isUrlCached(initialUrl));
  const [preloadedImages] = useState(new Map());
  const attackSoundTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);

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
        console.log(`🎬 Character: ${cachedCount}/${allAnimationUrls.length} animations pre-cached, ready immediately`);
        setImageReady(true);
      }
    }
  }, [allAnimationUrls, isUrlCached]);

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
    const isRange = characterAnimations.character_is_range === true;
    const rangeUrl = characterAnimations.character_range_attack;
    
    const attackUrl = Array.isArray(characterAnimations.character_attack) 
      ? characterAnimations.character_attack.filter(Boolean)[0] 
      : characterAnimations.character_attack;

    const runUrl = characterAnimations.character_run || characterAnimations.run;

    const configs = {
      idle: { 
        url: characterAnimations.character_idle || characterAnimations.idle, 
        shouldLoop: true, 
        isCompound: false 
      },
      attack: { 
          url: isRange ? attackUrl : runUrl, 
          runUrl: runUrl, 
          attackUrl: attackUrl, 
          rangeUrl: rangeUrl,
          isRange: isRange,
          shouldLoop: false, 
          isCompound: !isRange && !!runUrl 
      },
      hurt: { url: characterAnimations.character_hurt || characterAnimations.hurt, shouldLoop: false, isCompound: false },
      run: { url: characterAnimations.character_run || characterAnimations.run, shouldLoop: true, isCompound: false },
      dies: { url: characterAnimations.character_dies || characterAnimations.dies, shouldLoop: false, isCompound: false },
    };
    return configs[currentState] || configs.idle;
  }, [currentState, characterAnimations]);

  // ========== Image Preloading ==========
  useEffect(() => {
    if (!currentAnimationUrl) return;
    
    const isCached = isUrlCached(currentAnimationUrl);
    
    if (isCached || preloadedImages.has(currentAnimationUrl)) {
      preloadedImages.set(currentAnimationUrl, true);
      if (!imageReady) setImageReady(true);
      return;
    }
    
    let mounted = true;
    setImageReady(false);
    
    (async () => {
      try {
        await RNImage.prefetch(currentAnimationUrl);
        if (animationConfig.rangeUrl) {
           await RNImage.prefetch(animationConfig.rangeUrl);
        }

        if (mounted) {
          preloadedImages.set(currentAnimationUrl, true);
          setImageReady(true);
        }
      } catch (err) { 
        console.warn(`Character prefetch failed:`, err);
        if (mounted) setImageReady(true);
      }
    })();
    
    return () => { mounted = false; };
  }, [currentAnimationUrl, isUrlCached, animationConfig.rangeUrl]);

    useEffect(() => {
    if (potionEffectUrl) {
      // Reset
      potionFrameIndex.value = 0;
      potionOpacity.value = 1;
      
      // Play 12 frames (4 cols * 3 rows)
      // Assuming rough duration of ~800ms for the effect
      potionFrameIndex.value = withTiming(11, { 
        duration: 800, 
        easing: Easing.linear 
      }, (finished) => {
        if (finished) {
          potionOpacity.value = withTiming(0, { duration: 200 });
        }
      });
    } else {
      potionOpacity.value = 0;
    }
  }, [potionEffectUrl]);


  // ========== Animation Callbacks ==========
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationComplete) onAnimationComplete(currentState);
  }, [onAnimationComplete, currentState]);

  // ========== Main Animation Effect ==========
    useEffect(() => {
  if (currentState !== 'attack' && currentState !== 'run') {
    attackInitiated.value = false;
  }

  if (currentState === 'run' && attackInitiated.value) return;
  if (currentState === 'attack' && attackInitiated.value) return;


  const config = animationConfig;
  const targetUrl = config.isCompound ? config.runUrl : config.url;

  if (targetUrl && currentAnimationUrl !== targetUrl) {
    setCurrentAnimationUrl(targetUrl);
    return; 
  }

  const isCurrentUrlCached = isUrlCached(currentAnimationUrl) || preloadedImages.has(currentAnimationUrl);
  const isTargetUrlCached = targetUrl ? (isUrlCached(targetUrl) || preloadedImages.has(targetUrl)) : true;
  
  if (isPaused) {
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(blinkOpacity);
    cancelAnimation(rangeProjectileX);
    blinkOpacity.value = 0;
    return;
  }

  const isCriticalState = currentState === 'attack' || currentState === 'hurt' || currentState === 'dies';
  const canProceed = isCriticalState ? (isCurrentUrlCached || isTargetUrlCached) : (imageReady || isCurrentUrlCached || isTargetUrlCached);

  if (!canProceed) {
    return;
  }
  
  cancelAnimation(frameIndex);
  cancelAnimation(positionX);
  cancelAnimation(opacity);
  cancelAnimation(blinkOpacity);
  cancelAnimation(rangeProjectileX);
  
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

    if (isUrlCached(runUrl)) preloadedImages.set(runUrl, true);
    if (isUrlCached(attackUrl)) preloadedImages.set(attackUrl, true);

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

  if (config.shouldLoop) {
    frameIndex.value = withRepeat(withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false);
    return;
  }

  if (currentState === 'hurt') {
    blinkOpacity.value = withRepeat(withTiming(0.7, { duration: 100 }), Math.floor(ANIMATION_DURATIONS.hurt / 200), true);
  } else {
    blinkOpacity.value = 0;
  }

  const duration = ANIMATION_DURATIONS[currentState] || (FRAME_DURATION * TOTAL_FRAMES);
  
  //  LOGIC FOR RANGE ATTACK MOVEMENT
  if (currentState === 'attack' && config.isRange) {
    if (effectiveCharacterName === 'Ryron') { //  Updated to use effectiveCharacterName
        rangeProjectileX.value = 0;
        rangeProjectileX.value = withDelay(700, withTiming(ATTACK_RUN_DISTANCE, {
            duration: duration * 0.4, 
            easing: Easing.linear
        }));
    } else {
        rangeProjectileX.value = ATTACK_RUN_DISTANCE + gameScale(50);
    }
  }

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
  }, [currentState, isPaused, currentAnimationUrl, animationConfig, notifyAnimationComplete, isUrlCached, effectiveCharacterName, SPRITE_SIZE]); //  Added effectiveCharacterName dependency

  // ========== Animated Styles ==========
  const animatedStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    const column = frame % SPRITE_COLUMNS;
    const row = Math.floor(frame / SPRITE_COLUMNS);
    return { transform: [{ translateX: -(column * SPRITE_SIZE) }, { translateY: -(row * SPRITE_SIZE) }] };
  }, [SPRITE_SIZE]); 

  const POTION_COLS = 4;
  const POTION_ROWS = 3;

  const potionAnimatedStyle = useAnimatedStyle(() => {
    const frame = Math.floor(potionFrameIndex.value);
    const column = frame % POTION_COLS;
    const row = Math.floor(frame / POTION_COLS);
    
    return {
      opacity: potionOpacity.value,
      transform: [
        { translateX: -(column * SPRITE_SIZE) }, 
        { translateY: -(row * SPRITE_SIZE) }
      ]
    };
  }, [SPRITE_SIZE]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }), []);

  const redFlashStyle = useAnimatedStyle(() => ({ opacity: blinkOpacity.value }), []);
  
  const rangeContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rangeProjectileX.value }]
  }));

  const showRangeAttack = currentState === 'attack' && animationConfig.isRange && animationConfig.rangeUrl;

  // ========== Render ==========
  return (
    <Animated.View style={[ styles.characterContainer, containerStyle, propContainerStyle]}>
      
      {attackOverlayUrl && (
        <Animated.View style={[styles.attackOverlay, overlayAnimatedStyle]}>
          <Image 
            source={{ uri: attackOverlayUrl }} 
            style={styles.overlayImage} 
            contentFit="contain"
          />
        </Animated.View>
      )}

      {/* 1. Main Character Sprite Container */}
          <View style={[
          styles.spriteContainer,
          { width: SPRITE_SIZE, height: SPRITE_SIZE },
          //  Updated to use effectiveCharacterName
          effectiveCharacterName === 'Leon' 
            ? { marginTop: gameScale(-19), marginLeft: gameScale(-12) } 
            : effectiveCharacterName === 'Ryron' 
              ? { marginTop: gameScale(1) } // Adjust this value as needed for Ryron
              : null 
        ]}>
          <Animated.View style={[ styles.spriteSheet, animatedStyle, { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS } ]}>
          {currentAnimationUrl ? (
            <Image source={{ uri: currentAnimationUrl }} style={styles.spriteImage} contentFit="cover" cachePolicy="disk" />
          ) : (
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}
          
          {currentAnimationUrl && currentState === 'hurt' && (
            <Animated.View style={[StyleSheet.absoluteFill, redFlashStyle, { pointerEvents: 'none' }]}>
              <Image source={{ uri: currentAnimationUrl }} style={[ styles.spriteImage, { tintColor: '#760404a2' }]} contentFit="cover" cachePolicy="disk" />
            </Animated.View>
          )}
        </Animated.View>

        {potionEffectUrl && (
           <Animated.View 
             style={[
               styles.spriteSheet, 
               { 
                 position: 'absolute', 
                 top: 0, 
                 left: 0, 
                 width: SPRITE_SIZE * POTION_COLS, 
                 height: SPRITE_SIZE * POTION_ROWS,
                 zIndex: 5
               }, 
               potionAnimatedStyle
             ]}
           >
             <Image 
               source={{ uri: potionEffectUrl }} 
               style={styles.spriteImage} 
               contentFit="cover" 
               cachePolicy="disk" 
             />
           </Animated.View>
        )}


      </View>

      {/* 2. Range Attack Sprite Container */}
      {showRangeAttack && (
        <Animated.View style={[
            styles.spriteContainer, 
            rangeContainerStyle, 
            { 
              position: 'absolute',
              width: SPRITE_SIZE, 
              height: SPRITE_SIZE,
              zIndex: 20,
              //  Updated to use effectiveCharacterName
              marginTop: effectiveCharacterName === 'Ryron' ? gameScale(-15) : 0,
              marginLeft: effectiveCharacterName === 'Ryron' ? gameScale(27) : 0
            }
        ]}>
            <Animated.View style={[ 
                styles.spriteSheet, 
                animatedStyle, 
                { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS } 
            ]}>
                <Image 
                    source={{ uri: animationConfig.rangeUrl }} 
                    style={styles.spriteImage} 
                    contentFit="cover" 
                    cachePolicy="disk" 
                />
            </Animated.View>
        </Animated.View>
      )}

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
  attackOverlay: {
    position: 'absolute',
    top: gameScale(-40), // Float above the character
    width: gameScale(50),
    height: gameScale(50),
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayImage: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  }
});

export default React.memo(Character, (prev, next) => {
  return (
    prev.currentState === next.currentState &&
    prev.isPaused === next.isPaused &&
    prev.characterName === next.characterName &&
    prev.potionEffectUrl === next.potionEffectUrl &&
    prev.attackOverlayUrl === next.attackOverlayUrl &&
    JSON.stringify(prev.characterAnimations) === JSON.stringify(next.characterAnimations)
  );
});