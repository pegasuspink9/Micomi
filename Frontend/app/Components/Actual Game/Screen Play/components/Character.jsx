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
  interpolate,   
  Extrapolate,  
} from 'react-native-reanimated';
import { universalAssetPreloader } from '../../../../services/preloader/universalAssetPreloader';
import { soundManager } from '../../Sounds/UniversalSoundManager';
import { gameScale, getDeviceType, SCREEN } from '../../../Responsiveness/gameResponsive';


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
  statusState = null,
  enemyStatusState = null, 
  reactionText = null,
  isBonusRound = false,
  hurtAudioUrl = null,
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(0);
  const attackInitiated = useSharedValue(false);
  const overlayOpacity = useSharedValue(0);
  const overlayScale = useSharedValue(1);
  const overlayFrameIndex = useSharedValue(0);
  
  const rangeProjectileX = useSharedValue(0);

  const potionFrameIndex = useSharedValue(0);
  const potionOpacity = useSharedValue(0);

  const [displayReaction, setDisplayReaction] = useState(null);
  const reactionOpacity = useSharedValue(0);
  const prevOverlayUrlRef = useRef(null);

  const REACTION_OFFSET = useMemo(() => gameScale(10), []);
  const OVERLAY_SIZE = useMemo(() => gameScale(140), []);
  const SHADOW_BLUR_START = useMemo(() => gameScale(8), []);
  const SHADOW_BLUR_END = useMemo(() => gameScale(45), []);
  const FLOAT_OFFSET = useMemo(() => -gameScale(3), []);


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

  const OVERLAY_COLUMNS = 6;
  const OVERLAY_ROWS = 4;
  const OVERLAY_TOTAL_FRAMES = 24;


  const overlayZIndex = useMemo(() => {
    // Revitalize or Frozen status brings the overlay to the front
    if (enemyStatusState === 'Frozen' ) return 20;
    // Reveal or Strong keeps the overlay behind
    if (statusState === 'Reveal' || statusState === 'Strong' || statusState === 'Revitalize') return 1;
    return 1;
  }, [enemyStatusState, statusState]);


    useEffect(() => {
    if (attackOverlayUrl) {
      // Check if we are switching between two active overlays
      const isSwitching = prevOverlayUrlRef.current !== null && prevOverlayUrlRef.current !== attackOverlayUrl;
      prevOverlayUrlRef.current = attackOverlayUrl;

      // Cancel any ongoing animations to prevent conflicts
      cancelAnimation(overlayScale);
      cancelAnimation(overlayOpacity);
      cancelAnimation(overlayFrameIndex);

      if (isSwitching) {
        // STEP: Quick transition for switches (No heavy drop)
        overlayOpacity.value = withTiming(1, { duration: 100 });
        overlayScale.value = withTiming(1, { duration: 150 });
      } else {
        overlayScale.value = 6; 
        overlayOpacity.value = 0;
        
        overlayOpacity.value = withTiming(1, { duration: 200 });
        overlayScale.value = withSpring(1, {
          damping: 15,
          stiffness: 180,
          mass: 1.2,
          velocity: 30
        });
      }
      
      // Reset and loop frame index for the new sprite sheet
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
      prevOverlayUrlRef.current = null;
      overlayOpacity.value = withTiming(0, { duration: 400 });
      overlayScale.value = withTiming(0.8, { duration: 400 }); 
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

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    // Sharpness of shadow increases as it lands (scale 6 -> scale 1)
    const shadowBlur = interpolate(overlayScale.value, [1, 6], [SHADOW_BLUR_START, SHADOW_BLUR_END], Extrapolate.CLAMP);
    const shadowAlpha = interpolate(overlayScale.value, [1, 6], [0.7, 0.1], Extrapolate.CLAMP);

     return {
      opacity: overlayOpacity.value,
      shadowRadius: shadowBlur,
      shadowOpacity: shadowAlpha,
      transform: [
        { scale: overlayScale.value },
        { translateY: overlayScale.value < 1.1 
            ? withRepeat(withTiming(FLOAT_OFFSET, { duration: 1500 }), -1, true) 
            : 0 
        }
      ]
    };
  });

  

  // ========== State Management (Lifted up for use in effectiveName) ==========
  const initialUrl = useMemo(() => {
    const candidates = [
      universalAssetPreloader.getCachedAssetPath(characterAnimations.character_idle || ''),
      universalAssetPreloader.getCachedAssetPath(characterAnimations.idle || '')
    ].filter(url => url && typeof url === 'string');
    return candidates[0] || '';
  }, [characterAnimations.character_idle, characterAnimations.idle]);

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  const currentAnimationUrlRef = useRef(initialUrl);
  

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
    run: 2000,
    dies: 2000,
    diesOutro: 500,
  }), []);
  
   const ATTACK_RUN_DISTANCE = useMemo(() => {
    // Dynamically calculate distance based on screen width - 140 base for accurate reach
    return SCREEN.width - gameScale(200); 
  }, []);

  const RUN_AWAY_DISTANCE = useMemo(() => {
    return SCREEN.width + gameScale(400); 
  }, []);


  const isUrlCached = useCallback((url) => {
    if (!url) return false;
    if (url.startsWith('file://')) return true;
    const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
    return cachedPath !== url && cachedPath.startsWith('file://');
  }, []);

  const resolveCachedUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return url;
    return universalAssetPreloader.getCachedAssetPath(url);
  }, []);

  const allAnimationUrls = useMemo(() => {
    const urls = [];
    if (characterAnimations.character_idle) urls.push(resolveCachedUrl(characterAnimations.character_idle));
    if (characterAnimations.idle) urls.push(resolveCachedUrl(characterAnimations.idle));
    if (characterAnimations.character_run) urls.push(resolveCachedUrl(characterAnimations.character_run));
    if (characterAnimations.run) urls.push(resolveCachedUrl(characterAnimations.run));
    if (characterAnimations.character_hurt) urls.push(resolveCachedUrl(characterAnimations.character_hurt));
    if (characterAnimations.hurt) urls.push(resolveCachedUrl(characterAnimations.hurt));
    if (characterAnimations.character_dies) urls.push(resolveCachedUrl(characterAnimations.character_dies));
    if (characterAnimations.dies) urls.push(resolveCachedUrl(characterAnimations.dies));
    
    if (Array.isArray(characterAnimations.character_attack)) {
      characterAnimations.character_attack.filter(Boolean).forEach(url => urls.push(resolveCachedUrl(url)));
    } else if (characterAnimations.character_attack) {
      urls.push(resolveCachedUrl(characterAnimations.character_attack));
    }
    
    if (characterAnimations.character_range_attack) {
        urls.push(resolveCachedUrl(characterAnimations.character_range_attack));
    }

    return urls.filter(url => url && typeof url === 'string');
  }, [characterAnimations, resolveCachedUrl]);


  const allAnimationsCached = useMemo(() => {
    return allAnimationUrls.every(url => isUrlCached(url));
  }, [allAnimationUrls, isUrlCached]);

  
  const [imageReady, setImageReady] = useState(allAnimationsCached || isUrlCached(initialUrl));
  const [preloadedImages] = useState(new Map());
  const attackSoundTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);
  const attackSequenceRef = useRef({ runUrl: null, attackUrl: null });

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
    } else if (currentState === 'hurt' && hurtAudioUrl && !isBonusRound) {
      const CHAR_HURT_DELAY = 700;
      attackSoundTimeoutRef.current = setTimeout(() => {
        soundManager.playCombatSound(hurtAudioUrl);
      }, CHAR_HURT_DELAY);
    }

    return () => {
      if (attackSoundTimeoutRef.current) clearTimeout(attackSoundTimeoutRef.current);
    };
  }, [currentState, attackAudioUrl, hurtAudioUrl, isBonusRound]);

  // ========== Animation Configuration Logic ==========
  const animationConfig = useMemo(() => {
    const isRange = characterAnimations.character_is_range === true;
    const rangeUrl = resolveCachedUrl(characterAnimations.character_range_attack);
    
    const attackUrl = Array.isArray(characterAnimations.character_attack) 
      ? characterAnimations.character_attack.filter(Boolean)[0] 
      : characterAnimations.character_attack;
    const resolvedAttackUrl = resolveCachedUrl(attackUrl);

    const runUrl = resolveCachedUrl(characterAnimations.character_run || characterAnimations.run);

    const configs = {
      idle: { 
        url: resolveCachedUrl(characterAnimations.character_idle || characterAnimations.idle), 
        shouldLoop: true, 
        isCompound: false 
      },
      attack: { 
          url: isRange ? resolvedAttackUrl : runUrl, 
          runUrl: runUrl, 
          attackUrl: resolvedAttackUrl, 
          rangeUrl: rangeUrl,
          isRange: isRange,
          shouldLoop: false, 
          isCompound: !isRange && !!runUrl 
      },
      hurt: { url: resolveCachedUrl(characterAnimations.character_hurt || characterAnimations.hurt), shouldLoop: false, isCompound: false },
      run: { url: runUrl, shouldLoop: true, isCompound: false },
      dies: { url: resolveCachedUrl(characterAnimations.character_dies || characterAnimations.dies), shouldLoop: false, isCompound: false },
    };
    return configs[currentState] || configs.idle;
  }, [currentState, characterAnimations, resolveCachedUrl]);

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
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // ========== Animation Callbacks ==========
  const notifyAnimationComplete = useCallback(() => {
    if (onAnimationCompleteRef.current) onAnimationCompleteRef.current(currentState);
  }, [currentState]);



  useEffect(() => {
    if (currentState === 'attack' && attackInitiated.value && animationConfig.isCompound) {
      const sequenceUnchanged =
        attackSequenceRef.current.runUrl === animationConfig.runUrl &&
        attackSequenceRef.current.attackUrl === animationConfig.attackUrl;

      if (sequenceUnchanged) {
        return;
      }

      attackInitiated.value = false;
    }

    const targetUrl = animationConfig.isCompound ? animationConfig.runUrl : animationConfig.url;
    if (targetUrl && currentAnimationUrlRef.current !== targetUrl) {
      currentAnimationUrlRef.current = targetUrl;
      setCurrentAnimationUrl(targetUrl);
    }
  }, [currentState, animationConfig.url, animationConfig.runUrl, animationConfig.attackUrl, animationConfig.isCompound]);

  // ========== Main Animation Effect ==========
  useEffect(() => {
    if (currentState === 'attack' && attackInitiated.value && animationConfig.isCompound) {
      const sequenceUnchanged =
        attackSequenceRef.current.runUrl === animationConfig.runUrl &&
        attackSequenceRef.current.attackUrl === animationConfig.attackUrl;

      if (sequenceUnchanged) {
        return;
      }

      attackInitiated.value = false;
    }

    const config = animationConfig;
    const targetUrl = config.isCompound ? config.runUrl : config.url;

    // Sync URL immediately via ref
    if (targetUrl && currentAnimationUrlRef.current !== targetUrl) {
      currentAnimationUrlRef.current = targetUrl;
      setCurrentAnimationUrl(targetUrl);
    }

    if (currentState !== 'attack' && currentState !== 'run') {
      attackInitiated.value = false;
      attackSequenceRef.current = { runUrl: null, attackUrl: null };
    }

    const activeUrl = currentAnimationUrlRef.current;

    const isActiveUrlCached = isUrlCached(activeUrl) || preloadedImages.has(activeUrl);
    const isTargetUrlCached = targetUrl ? (isUrlCached(targetUrl) || preloadedImages.has(targetUrl)) : true;

    if (isPaused) {
      cancelAnimation(frameIndex);
      cancelAnimation(positionX);
      cancelAnimation(blinkOpacity);
      cancelAnimation(rangeProjectileX);
      blinkOpacity.value = 0;
      return;
    }

    // 🚀 FIX: Require ALL parts of the attack (Melee Run + Attack OR Range Attack + Projectile) to be ready
    let attackReady = true;
    if (currentState === 'attack') {
        if (config.isCompound) {
            const runCached = isUrlCached(config.runUrl) || preloadedImages.has(config.runUrl);
            const attackCached = isUrlCached(config.attackUrl) || preloadedImages.has(config.attackUrl);
            attackReady = runCached && attackCached;
        } else if (config.isRange) {
            const attackCached = isUrlCached(config.attackUrl) || preloadedImages.has(config.attackUrl);
            const rangeCached = config.rangeUrl ? (isUrlCached(config.rangeUrl) || preloadedImages.has(config.rangeUrl)) : true;
            attackReady = attackCached && rangeCached;
        }
    }

    const isCriticalState = currentState === 'attack' || currentState === 'hurt' || currentState === 'dies' || currentState === 'run';
    const canProceed = isCriticalState 
        ? (isActiveUrlCached || isTargetUrlCached) && attackReady 
        : (imageReady || isActiveUrlCached || isTargetUrlCached);
    
    // Hold animation progression completely if assets are streaming into memory
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
      const { runUrl, attackUrl } = config;

      const hasNewCompoundUrls =
        attackSequenceRef.current.runUrl !== runUrl ||
        attackSequenceRef.current.attackUrl !== attackUrl;

      if (attackInitiated.value && !hasNewCompoundUrls) return;
      if (attackInitiated.value && hasNewCompoundUrls) {
        attackInitiated.value = false;
      }
      
      // 🚀 FIX: Double check BOTH urls exist in cache strictly before authorizing movement
      const isRunReady = isUrlCached(runUrl) || preloadedImages.has(runUrl);
      const isAttackReady = isUrlCached(attackUrl) || preloadedImages.has(attackUrl);
      if (!isRunReady || !isAttackReady) return;

      attackSequenceRef.current = { runUrl, attackUrl };
      attackInitiated.value = true;

      if (!runUrl || !attackUrl) {
        runOnJS(notifyAnimationComplete)();
        return;
      }

      if (isUrlCached(runUrl)) preloadedImages.set(runUrl, true);
      if (isUrlCached(attackUrl)) preloadedImages.set(attackUrl, true);

      // Ensure run URL is active before starting — match EnemyCharacter pattern
      currentAnimationUrlRef.current = runUrl;
      setCurrentAnimationUrl(runUrl);

      // Reset position and opacity explicitly — match EnemyCharacter pattern
      positionX.value = 0;
      opacity.value = 1;

       frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }),
        -1,
        false
      );

      // 🐌 Slower: Increase the charge attack distance duration
      positionX.value = withTiming(ATTACK_RUN_DISTANCE, { duration: 700, easing: Easing.in(Easing.quad) }, (finished) => {
        if (!finished) return;

        cancelAnimation(frameIndex);
        frameIndex.value = 0;
        currentAnimationUrlRef.current = attackUrl;
        runOnJS(setCurrentAnimationUrl)(attackUrl);

        frameIndex.value = withTiming(TOTAL_FRAMES - 1, { duration: ANIMATION_DURATIONS.attack, easing: Easing.linear }, (attackFinished) => {
          if (attackFinished) {
            // 🐌 Slower: Increase return (jumping back) duration
            positionX.value = withTiming(0, { duration: 500, easing: Easing.quad }, (returnFinished) => {
              if (returnFinished) runOnJS(notifyAnimationComplete)();
            });
          }
        });
      });
      return;
    }

    if (currentState === 'run' && !config.isCompound) {
      attackInitiated.value = true;

      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }),
        -1,
        false
      );

      // Linear retreat to the right
      positionX.value = withTiming(RUN_AWAY_DISTANCE, { 
        duration: ANIMATION_DURATIONS.run, 
        easing: Easing.linear 
      }, (finished) => {
        if (finished) {
          cancelAnimation(frameIndex);
          runOnJS(notifyAnimationComplete)();
        }
      });
      return;
    }

    if (config.shouldLoop) {
      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }),
        -1,
        false
      );
      return;
    }

    if (currentState === 'hurt') {
      blinkOpacity.value = withRepeat(withTiming(0.7, { duration: 100 }), Math.floor(ANIMATION_DURATIONS.hurt / 200), true);
    } else {
      blinkOpacity.value = 0;
    }

    const duration = ANIMATION_DURATIONS[currentState] || (FRAME_DURATION * TOTAL_FRAMES);

    if (currentState === 'attack' && config.isRange) {
      if (effectiveCharacterName === 'Ryron') {
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
  }, [
    currentState, isPaused, currentAnimationUrl,
    animationConfig.isCompound, animationConfig.shouldLoop, animationConfig.url, 
    animationConfig.runUrl, animationConfig.attackUrl, animationConfig.rangeUrl, animationConfig.isRange,
    notifyAnimationComplete, isUrlCached, effectiveCharacterName, SPRITE_SIZE
  ]);


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

  const shouldApplyHurtTint = useMemo(() => {
    return characterAnimations.character_hurt != null;
  }, [characterAnimations.character_hurt]);

   const renderReactionText = (text) => {
    if (!text) return null;

    // --- Dynamic Height/FontSize calculation based on text length ---
    const len = text.length;
    let fontSize = gameScale(13); // Default
    if (len > 80) fontSize = gameScale(9);
    else if (len > 50) fontSize = gameScale(10.5);
    else if (len > 30) fontSize = gameScale(12);

    const parts = text.split(/(".*?")/g);
    return parts.map((part, index) => {
      const isRed = part.startsWith('"') && part.endsWith('"');
      return (
        <Text key={index} style={[
          { fontSize }, // Apply dynamic font size
          isRed && styles.reactionHighlight
        ]}>
          {part}
        </Text>
      );
    });
  };
  

  
  // ========== Render ==========
   return (
    <Animated.View style={[ styles.characterContainer, containerStyle, propContainerStyle]}>
      
      {displayReaction && (
        <Animated.View style={[styles.reactionContainer, reactionAnimatedStyle]}>
          <View style={styles.reactionBubble}>
            <Text style={styles.reactionText}>{renderReactionText(displayReaction)}</Text>
          </View>
          <View style={styles.curvyTailContainer}>
            <View style={[styles.reactionDot, styles.dotLarge]} />
            <View style={[styles.reactionDot, styles.dotMedium]} />
            <View style={[styles.reactionDot, styles.dotSmall]} />
          </View>
        </Animated.View>
      )}
      
       {attackOverlayUrl && (
        <Animated.View style={[
          styles.attackOverlay, 
          { zIndex: overlayZIndex }, // Applied dynamic zIndex
          overlayAnimatedStyle
        ]}>
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

      {/* 1. Main Character Sprite Container */}
          <View style={[
          styles.spriteContainer,
          { width: SPRITE_SIZE, height: SPRITE_SIZE, zIndex: 10 },
          //  Updated to use effectiveCharacterName
          effectiveCharacterName === 'Leon' 
            ? { marginTop: gameScale(-19), marginLeft: gameScale(-12) } 
            : effectiveCharacterName === 'Ryron' 
              ? { marginTop: gameScale(1) } // Adjust this value as needed for Ryron
              : null 
        ]}>
          <Animated.View style={[ styles.spriteSheet, animatedStyle, { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS } ]}>
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
          
          {currentAnimationUrl && currentState === 'hurt' && shouldApplyHurtTint && (
            <Animated.View style={[StyleSheet.absoluteFill, redFlashStyle, { pointerEvents: 'none' }]}>
              <Image 
                source={{ uri: currentAnimationUrl }} 
                style={[ styles.spriteImage, { tintColor: '#760404a2' }]} 
                contentFit="cover" 
                cachePolicy="memory-disk" 
                priority="high"
              />
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
               cachePolicy="memory-disk" 
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
                    cachePolicy="memory-disk" 
                    priority="high"
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
    left: gameScale(-10),
    top: gameScale(130),
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
  },
    reactionContainer: {
    position: 'absolute',
    bottom: '90%',
    left: gameScale(60),
    alignItems: 'center',
    zIndex: 10000,
  },
  reactionBubble: {
    backgroundColor: 'white',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(8),
    borderRadius: gameScale(8), 
    borderWidth: gameScale(1.5),
    borderColor: '#d4d4d4',
    width: gameScale(220), // Fixed width
    height: gameScale(55), // Fixed height
    justifyContent: 'center', // Centered vertically
  },
   reactionText: {
    color: '#333',
    fontSize: gameScale(12),
    textAlign: 'center',
    fontFamily: 'DynaPuff'
  },
  reactionHighlight: {
    color: '#e30000', // Red color for quoted text
  },
  curvyTailContainer: {
    alignItems: 'center',
    marginTop: gameScale(-2),
    marginLeft: gameScale(-70), // Shift tail towards the character
  },
    reactionDot: {
    backgroundColor: 'white',
    borderWidth: gameScale(1.5),
    borderColor: '#d4d4d4',
    // Added 3D Shadow to dots
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(1),
    elevation: gameScale(2),
  },
  dotLarge: {
    width: gameScale(12),
    height: gameScale(10),
    borderRadius: gameScale(6),
    marginTop: gameScale(4),
    marginLeft: gameScale(9), // Curvy offset
  },
  dotMedium: {
    width: gameScale(8),
    height: gameScale(7),
    borderRadius: gameScale(4),
    marginTop: gameScale(2),
    marginLeft: gameScale(-5), // Further curvy offset
  },
  dotSmall: {
    width: gameScale(5),
    height: gameScale(5),
    borderRadius: gameScale(3),
    marginTop: gameScale(2),
    marginLeft: gameScale(-12), // Final curvy offset
  },
  spriteContainer: { overflow: 'hidden' },
  spriteSheet: {},
  spriteImage: { width: '100%', height: '100%' },
  attackOverlay: {
    position: 'absolute',
    top: gameScale(-30),
    right: gameScale(10),
    width: gameScale(140),
    height: gameScale(140),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(10),
    elevation: gameScale(5),
  },
  overlaySpriteContainer: {
    width: gameScale(140),
    height: gameScale(140),
    opacity: 0.7,
    overflow: 'hidden',
  },
  overlaySpriteSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayImage: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(3),
  }
});

export default React.memo(Character, (prev, next) => {
  return (
    prev.reactionText === next.reactionText && 
    prev.currentState === next.currentState &&
    prev.isPaused === next.isPaused &&
    prev.isBonusRound === next.isBonusRound &&
    prev.characterName === next.characterName &&
    prev.potionEffectUrl === next.potionEffectUrl &&
    prev.attackOverlayUrl === next.attackOverlayUrl &&
    prev.characterAnimations === next.characterAnimations
  );
});