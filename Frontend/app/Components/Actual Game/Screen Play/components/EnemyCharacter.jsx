import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withDelay, 
  cancelAnimation,
  runOnJS,
  Easing,
  interpolate,   // Added for shadow focus
  Extrapolate,  
} from 'react-native-reanimated';
import { universalAssetPreloader } from '../../../../services/preloader/universalAssetPreloader';
import { soundManager } from '../../Sounds/UniversalSoundManager';
import { gameScale, getDeviceType, SCREEN } from '../../../Responsiveness/gameResponsive';


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
  attackAudioUrl = null,
  enemyName = '',
  attackOverlayUrl = null, 
  enemyCurrentState = null,
  reactionText = null,
  hurtAudioUrl = null,
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(0);
  const attackInitiated = useSharedValue(false);
  const detectedNameRef = useRef(null);

  const overlayOpacity = useSharedValue(0);
  const overlayScale = useSharedValue(1);
  const overlayFrameIndex = useSharedValue(0);

  const REACTION_OFFSET = useMemo(() => gameScale(10), []);
  const OVERLAY_SIZE = useMemo(() => gameScale(140), []);
  const FLOAT_OFFSET_ENEMY = useMemo(() => -gameScale(5), []);

  const OVERLAY_COLUMNS = 6;
  const OVERLAY_ROWS = 4;
  const OVERLAY_TOTAL_FRAMES = 24;

    useEffect(() => {
    if (attackOverlayUrl) {
      overlayScale.value = 1.6;
      overlayOpacity.value = 0;

      overlayOpacity.value = withTiming(1, { duration: 600 });
      overlayScale.value = withTiming(1, { 
        duration: 700, 
        easing: Easing.out(Easing.back(1.5)) 
      });

      overlayFrameIndex.value = 0;
      overlayFrameIndex.value = withRepeat(
        withTiming(OVERLAY_TOTAL_FRAMES - 1, { 
          duration: 1200, 
          easing: Easing.linear 
        }),
        -1,
        false
      ); 
    } else {
      overlayOpacity.value = withTiming(0, { duration: 400 });
      cancelAnimation(overlayFrameIndex);
    }
  }, [attackOverlayUrl]);

  const overlaySpriteStyle = useAnimatedStyle(() => {
    const column = Math.floor(overlayFrameIndex.value % OVERLAY_COLUMNS);
    const row = Math.floor(overlayFrameIndex.value / OVERLAY_COLUMNS);
    return {
      transform: [
        { translateX: -column * OVERLAY_SIZE },
        { translateY: -row * OVERLAY_SIZE },
      ],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [
      { scale: overlayScale.value },
      { translateY: withRepeat(withTiming(FLOAT_OFFSET_ENEMY, { duration: 1000 }), -1, true) }
    ]
  }));



  const effectiveEnemyName = useMemo(() => {
    // 1. Return already detected name if we have one (prevents flickering to default)
    if (detectedNameRef.current) return detectedNameRef.current;

    let detected = '';

    // 2. Direct prop check
    if (enemyName === 'Boss Darco' || enemy?.enemy_name === 'Boss Darco') detected = 'Boss Darco';
    else if (enemyName === 'King Grimnir' || enemy?.enemy_name === 'King Grimnir') detected = 'King Grimnir';
    else if (enemyName === 'Draco' || enemy?.enemy_name === 'Draco') detected = 'Draco';
    
    // 3. URL fallback if props are missing/transitioning
    else if (currentAnimationUrl?.includes('Boss%20Darco') || currentAnimationUrl?.includes('Boss Darco')) detected = 'Boss Darco';
    else if (currentAnimationUrl?.includes('King') || currentAnimationUrl?.includes('Grimnir')) detected = 'King Grimnir'; 
    else if (currentAnimationUrl?.includes('Draco')) detected = 'Draco';

    // 4. Update Ref if valid name found
    if (detected) {
      detectedNameRef.current = detected;
      return detected;
    }

    // 5. Fallback (only if never detected)
    return enemyName || enemy?.enemy_name || 'Enemy';
  }, [enemyName, enemy?.enemy_name, currentAnimationUrl]);


    const bossLayout = useMemo(() => {
    if (effectiveEnemyName === 'Boss Darco') {
      return {
        marginTop: gameScale(-37),
        left: gameScale(210), // Positioning from left
        right: undefined,     // CLEAR the default 'right' style
      };
    } 
    else if (effectiveEnemyName === 'King Grimnir') {
      return {  // Slightly higher due to larger size
        marginTop: gameScale(-32),
        left: gameScale(205), // Adjusted left for larger width to keep relative center
        right: undefined,    
      };
    }
    else if (effectiveEnemyName === 'Draco') {
      return {
        marginTop: gameScale(-5)
      };
    }

    
    // Default for regular enemies (empty object allows default styles to apply)
    return {};
  }, [effectiveEnemyName]);



  const wasBonusRound = useRef(false);

  // ========== Animation Configuration ==========
   const SPRITE_SIZE = useMemo(() => {
    if (effectiveEnemyName === 'Boss Darco') {
      return gameScale(190); 
    }
    if (effectiveEnemyName === 'King Grimnir') {
      return gameScale(200);
    }
    return gameScale(150);

    
  }, [effectiveEnemyName]);
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
    diesOutro: 500
  }), []);

  const RUN_DISTANCE = useMemo(() => {
    return -(SCREEN.width - gameScale(200)); 
  }, []);

  const RUN_AWAY_DISTANCE = useMemo(() => {
    // Moves to the right (off-screen)
    return SCREEN.width + gameScale(200); 
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

  const onAnimationCompleteRef = useRef(onAnimationComplete);
  
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

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

   const [displayReaction, setDisplayReaction] = useState(null);
  const reactionOpacity = useSharedValue(0);

  useEffect(() => {
    if (reactionText) {
      // Set text and fade in immediately when the prop arrives
      setDisplayReaction(reactionText);
      reactionOpacity.value = withTiming(1, { duration: 400 });
    } else {
      // Fade out and clear text when prop is removed
      reactionOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(setDisplayReaction)(null);
      });
    }
  }, [reactionText]);

  const reactionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: reactionOpacity.value,
    transform: [{ translateY: interpolate(reactionOpacity.value, [0, 1], [REACTION_OFFSET, 0]) }]
  }));

   useEffect(() => {
    const targetUrl = animationConfig.isCompound ? animationConfig.runUrl : animationConfig.url;
    if (targetUrl && currentAnimationUrl !== targetUrl) {
      setCurrentAnimationUrl(targetUrl);
    }
  }, [animationConfig.url, animationConfig.runUrl, animationConfig.isCompound]);


    useEffect(() => {
    if (currentState !== 'hurt') {
      blinkOpacity.value = 0;
    }
  }, [currentState]);

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
      const SOUND_DELAY = 500; 
      attackSoundTimeoutRef.current = setTimeout(() => {
        soundManager.playCachedSound(attackAudioUrl, 'combat', 1.0);
      }, SOUND_DELAY);
    } else if (currentState === 'hurt' && hurtAudioUrl) {
      soundManager.playCachedSound(hurtAudioUrl, 'combat', 1.0);
    }

    return () => {
      if (attackSoundTimeoutRef.current) {
        clearTimeout(attackSoundTimeoutRef.current);
      }
    };
  }, [currentState, attackAudioUrl, hurtAudioUrl, index]);

  if (isBonusRound) wasBonusRound.current = true;
  else if (currentState === 'idle') wasBonusRound.current = false;

  // ========== Animation Configuration Logic ==========
  
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
    if (onAnimationCompleteRef.current) {
      onAnimationCompleteRef.current(currentState);
    }
  }, [currentState]);

  const isFrozen = enemyCurrentState === 'Frozen';


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

  const isCurrentUrlCached = isUrlCached(currentAnimationUrl) || preloadedImages.has(currentAnimationUrl);
  const isTargetUrlCached = targetUrl ? (isUrlCached(targetUrl) || preloadedImages.has(targetUrl)) : true;
  
  if (isPaused || isFrozen) {
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(opacity);
    cancelAnimation(blinkOpacity);
    blinkOpacity.value = 0;
    return;
  }

  const isCriticalState = currentState === 'attack' || currentState === 'hurt' || currentState === 'dies';
  const canProceed = isCriticalState ? (isCurrentUrlCached || isTargetUrlCached) : (imageReady || isCurrentUrlCached || isTargetUrlCached);

  if (!canProceed) {
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

  if (currentState === 'run' && !config.isCompound) {
    attackInitiated.value = true;

    frameIndex.value = withRepeat(withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), -1, false);
    positionX.value = withTiming(RUN_AWAY_DISTANCE, { duration: ANIMATION_DURATIONS.run, easing: Easing.linear }, (finished) => {
      if (finished) {
        cancelAnimation(frameIndex);
        runOnJS(notifyAnimationComplete)();
      }
    });
    return;
  }

  // --- LOOPING LOGIC ---
  if (config.shouldLoop) {
    if (currentState === 'hurt' && isBonusRound) {
      blinkOpacity.value = withRepeat(withTiming(0.7, { duration: 100 }), -1, true);
    }

    // ✅ FIX: Determine if we should "Ping-Pong" (reverse loop).
    // We want this for IDLE and HURT to make them look smooth. 
    // We do NOT want this for RUN (running backwards looks weird).
    const shouldPingPong = currentState === 'idle' || currentState === 'hurt';

    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), 
      -1, 
      shouldPingPong // ✅ True for idle/hurt (0->23->0), False for run (0->23, 0->23)
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
  currentState, isPaused, currentAnimationUrl, animationConfig, notifyAnimationComplete, isUrlCached
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
    <Animated.View style={[ styles.enemyContainer, bossLayout, containerStyle, isFront && styles.front ]} >

      {displayReaction && (
        <Animated.View style={[styles.reactionContainer, reactionAnimatedStyle]}>
          <View style={styles.reactionBubble}>
            <Text style={styles.reactionText}>{displayReaction}</Text>
          </View>
          <View style={styles.curvyTailContainer}>
            <View style={[styles.reactionDot, styles.dotLarge]} />
            <View style={[styles.reactionDot, styles.dotMedium]} />
            <View style={[styles.reactionDot, styles.dotSmall]} />
          </View>
        </Animated.View>
      )}
      
      {attackOverlayUrl && (
        <Animated.View style={[styles.attackOverlay, overlayAnimatedStyle]}>
          <View style={styles.overlaySpriteContainer}>
            <Animated.View style={[
              styles.overlaySpriteSheet, 
              overlaySpriteStyle,
              { width: OVERLAY_SIZE * OVERLAY_COLUMNS, height: OVERLAY_SIZE * OVERLAY_ROWS }
            ]}>
              <Image 
                source={{ uri: attackOverlayUrl }} 
                style={styles.spriteImage} 
                contentFit="contain"
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE, zIndex: 10 }]}>
        <Animated.View style={[ styles.spriteSheet, animatedStyle, { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS }]} >
          {currentAnimationUrl ? (
            <Image
              source={{ uri: currentAnimationUrl }}
              style={styles.spriteImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
            />
          ) : (
            <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
          )}

          {currentAnimationUrl && isFrozen && (
            <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
              <Image
                source={{ uri: currentAnimationUrl }}
                style={[ styles.spriteImage, { tintColor: '#00ccff80' } ]}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
              />
            </Animated.View>
          )}

          {currentAnimationUrl && currentState === 'hurt' && (
            <Animated.View style={[StyleSheet.absoluteFill, redFlashStyle, { pointerEvents: 'none' }]}>
              <Image
                source={{ uri: currentAnimationUrl }}
                style={[ styles.spriteImage, { tintColor: wasBonusRound.current ? 'rgba(218, 200, 0, 0.88)' : '#760404a2' } ]}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
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
    right: gameScale(-10),
    top: gameScale(125),
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  reactionContainer: {
    position: 'absolute',
    bottom: '90%',
    right: gameScale(60), // Mirror of character's left: 60
    alignItems: 'center',
    zIndex: 1000000,
  },
  reactionBubble: {
    backgroundColor: 'white',
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(8),
    borderRadius: gameScale(8),
    borderWidth: gameScale(1.5),
    borderColor: '#d4d4d4',
    width: gameScale(160),
  },
  reactionText: {
    color: '#333',
    fontSize: gameScale(12),
    textAlign: 'center',
    fontFamily: 'DynaPuff',
  },
  curvyTailContainer: {
    alignItems: 'center',
    marginTop: gameScale(-2),
    marginRight: gameScale(-70), // Mirror of character's marginLeft: -70
  },
  reactionDot: {
    backgroundColor: 'white',
    borderWidth: gameScale(1.5),
    borderColor: '#d4d4d4',
    shadowColor: '#000',
    shadowOffset: { width: -gameScale(1), height: gameScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(1),
    elevation: gameScale(2),
  },
  dotLarge: {
    width: gameScale(12),
    height: gameScale(10),
    borderRadius: gameScale(6),
    marginTop: gameScale(4),
    marginRight: gameScale(9), // Mirror of character's marginLeft: 9
  },
  dotMedium: {
    width: gameScale(8),
    height: gameScale(7),
    borderRadius: gameScale(4),
    marginTop: gameScale(2),
    marginRight: gameScale(-5),
  },
  dotSmall: {
    width: gameScale(5),
    height: gameScale(5),
    borderRadius: gameScale(3),
    marginTop: gameScale(2),
    marginRight: gameScale(-12),
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
  attackOverlay: {
    position: 'absolute',
    top: gameScale(10),
    width: gameScale(140),
    height: gameScale(140),
    zIndex: 1001,
  },
  overlaySpriteContainer: {
    width: gameScale(140),
    height: gameScale(140),
    overflow: 'hidden',
  },
  overlaySpriteSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayImage: {
    width: '100%',
    
    opacity: 0.7, 
    height: '100%',
  },
});


export default React.memo(EnemyCharacter, (prev, next) => {
  return (
    prev.reactionText === next.reactionText &&
    prev.currentState === next.currentState &&
    prev.isPaused === next.isPaused &&
    prev.isAttacking === next.isAttacking &&
    prev.isBonusRound === next.isBonusRound &&
    prev.fightStatus === next.fightStatus &&
    prev.enemyName === next.enemyName && 
    prev.index === next.index &&      
    prev.attackOverlayUrl === next.attackOverlayUrl && 
    prev.enemyCurrentState === next.enemyCurrentState &&
    prev.characterAnimations === next.characterAnimations
  );
});