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
  matchCharacterStyle = false,
  animationTriggerKey = null,
}) => {
  // ========== Shared Animation Values ==========
  const frameIndex = useSharedValue(0);
  const positionX = useSharedValue(0);
  const rangeProjectileX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const blinkOpacity = useSharedValue(0);
  const attackInitiated = useSharedValue(false);
  const detectedNameRef = useRef(null);

  const overlayOpacity = useSharedValue(0);
  const overlayScale = useSharedValue(1);
  const overlayFrameIndex = useSharedValue(0);

  // Add ref to track previous trigger key
  const prevTriggerKeyRef = useRef(null);
  // ✅ FIX: Add a ref to signal skipping the frame reset for seamless transitions
  const shouldSkipNextFrameResetRef = useRef(false);

  const REACTION_OFFSET = useMemo(() => gameScale(10), []);
  const OVERLAY_SIZE = useMemo(() => gameScale(140), []);
  const SHADOW_BLUR_START = useMemo(() => gameScale(8), []);
  const SHADOW_BLUR_END = useMemo(() => gameScale(45), []);
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

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const shadowBlur = interpolate(overlayScale.value, [1, 6], [SHADOW_BLUR_START, SHADOW_BLUR_END], Extrapolate.CLAMP);
    const shadowAlpha = interpolate(overlayScale.value, [1, 6], [0.7, 0.1], Extrapolate.CLAMP);

    return {
      opacity: overlayOpacity.value,
      shadowRadius: shadowBlur,
      shadowOpacity: shadowAlpha,
      transform: [
        { scale: overlayScale.value },
        {
          translateY:
            overlayScale.value < 1.1
              ? withRepeat(withTiming(FLOAT_OFFSET_ENEMY, { duration: 1500 }), -1, true)
              : 0,
        },
      ],
    };
  });

  const attackOverlayZIndex = useMemo(() => {
    if (enemyCurrentState === 'Frozen') {
      return 20;
    }

    return 1;
  }, [enemyCurrentState]);



  const effectiveEnemyName = useMemo(() => {
    // 1. Return already detected name if we have one (prevents flickering to default)
    if (detectedNameRef.current) return detectedNameRef.current;

    let detected = '';

    // 2. Direct prop check
    if (enemyName === 'Boss Darco' || enemy?.enemy_name === 'Boss Darco') detected = 'Boss Darco';
    else if (enemyName === 'King Grimnir' || enemy?.enemy_name === 'King Grimnir') detected = 'King Grimnir';
    else if (enemyName === 'Draco' || enemy?.enemy_name === 'Draco') detected = 'Draco';
    else if (enemyName === 'Boss Joshy' || enemy?.enemy_name === 'Boss Joshy') detected = 'Boss Joshy';
    
    // 3. Update Ref if valid name found
    if (detected) {
      detectedNameRef.current = detected;
      return detected;
    }

    // 4. Fallback (only if never detected)
    return enemyName || enemy?.enemy_name || 'Enemy';
  }, [enemyName, enemy?.enemy_name]);


    const bossLayout = useMemo(() => {
    if (matchCharacterStyle) {
      return {};
    }

    const baseBossStyle = { right: gameScale(-30) };

    if (effectiveEnemyName === 'Boss Darco') {
      return { ...baseBossStyle, marginTop: gameScale(-37) };
    } 
    else if (effectiveEnemyName === 'King Grimnir') {
      return { ...baseBossStyle, marginTop: gameScale(-32) };
    }
    else if (effectiveEnemyName === 'Draco') {
      return { marginTop: gameScale(-5) };
    }
    else if (effectiveEnemyName === 'Boss Joshy') {
      return { ...baseBossStyle, marginTop: gameScale(-48) };
    }

    return {};
  }, [effectiveEnemyName, matchCharacterStyle]);



  const wasBonusRound = useRef(false);

  // ========== Animation Configuration ==========
   const SPRITE_SIZE = useMemo(() => {
    if (matchCharacterStyle) {
      return gameScale(128);
    }

    if (effectiveEnemyName === 'Boss Darco') {
      return gameScale(190); 
    }
    if (effectiveEnemyName === 'King Grimnir') {
      return gameScale(200);
    }
    if (effectiveEnemyName === 'Boss Joshy') {
      return gameScale(200);
    }
    return gameScale(150);

    
  }, [effectiveEnemyName, matchCharacterStyle]);
  
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
    diesOutro: 500
  }), []);

  const RUN_DISTANCE = useMemo(() => {
    return -(SCREEN.width - gameScale(200)); 
  }, []);

  const RUN_AWAY_DISTANCE = useMemo(() => {
    // Moves to the right (off-screen)
    return -(SCREEN.width - gameScale(200)); 
  }, []);

  const isUrlCached = useCallback((url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('file://')) return true;
    const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
    return (typeof cachedPath === 'string') && cachedPath !== url && cachedPath.startsWith('file://');
  }, []);

  const hasUsableAnimationUrl = useCallback((url) => {
    return typeof url === 'string' && url.trim().length > 0;
  }, []);

  const resolveCachedUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return '';
    const cached = universalAssetPreloader.getCachedAssetPath(url);
    return typeof cached === 'string' ? cached : '';
  }, []);

  const getDisplayUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return '';
    const cached = universalAssetPreloader.getCachedAssetPath(url);
    if (typeof cached === 'string' && cached.trim().length > 0) {
      return cached;
    }
    return url;
  }, []);

  const normalizedAnimations = useMemo(() => {
    const pick = (...values) => values.find((value) => value !== undefined && value !== null);

    return {
      idle: pick(characterAnimations.character_idle, characterAnimations.enemy_idle, characterAnimations.idle),
      run: pick(characterAnimations.character_run, characterAnimations.enemy_run, characterAnimations.run),
      attack: pick(characterAnimations.character_attack, characterAnimations.enemy_attack, characterAnimations.attack),
      rangeAttack: pick(
        characterAnimations.character_range_attack,
        characterAnimations.enemy_range_attack,
        characterAnimations.range_attack
      ),
      isRange: pick(
        characterAnimations.character_is_range,
        characterAnimations.enemy_is_range_attack,
        characterAnimations.is_range_attack
      ),
      hurt: pick(characterAnimations.character_hurt, characterAnimations.enemy_hurt, characterAnimations.hurt),
      dies: pick(characterAnimations.character_dies, characterAnimations.enemy_dies, characterAnimations.dies),
    };
  }, [characterAnimations]);


  // ========== State Management ==========
  const initialUrl = useMemo(() => {
    const candidates = [
      getDisplayUrl(normalizedAnimations.idle),
      getDisplayUrl(enemy?.enemy_idle),
      getDisplayUrl(enemy?.idle),
    ].filter(url => url && typeof url === 'string');
    return candidates[0] || '';
  }, [enemy, normalizedAnimations, getDisplayUrl]);

  const onAnimationCompleteRef = useRef(onAnimationComplete);
  
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  const animationConfig = useMemo(() => {
    const attackUrl = Array.isArray(normalizedAnimations.attack)
      ? normalizedAnimations.attack.filter(url => url && typeof url === 'string')[0]
      : normalizedAnimations.attack;
    const rangeUrl = getDisplayUrl(normalizedAnimations.rangeAttack);
    const isRange = normalizedAnimations.isRange === true;

    const configs = {
      idle: {
        url: getDisplayUrl(normalizedAnimations.idle),
        shouldLoop: true,
        isCompound: false,
      },
      attack: {
        runUrl: getDisplayUrl(normalizedAnimations.run),
        attackUrl: getDisplayUrl(attackUrl),
        rangeUrl,
        isRange,
        url: getDisplayUrl(attackUrl),
        shouldLoop: false,
        isCompound: !isRange && !!getDisplayUrl(normalizedAnimations.run),
      },
      hurt: {
        url: getDisplayUrl(normalizedAnimations.hurt),
        shouldLoop: isBonusRound && fightStatus !== 'won',
        isCompound: false,
      },
      run: {
        url: getDisplayUrl(normalizedAnimations.run),
        shouldLoop: true,
        isCompound: false,
      },
      dies: {
        url: getDisplayUrl(normalizedAnimations.dies),
        shouldLoop: false,
        isCompound: false,
      },
    };
    return configs[currentState] || configs.idle;
  }, [currentState, normalizedAnimations, isBonusRound, fightStatus, getDisplayUrl]);

  // FIX: Pre-check ALL animation URLs on mount to populate memory cache
  const allAnimationUrls = useMemo(() => {
    const urls = [];
    if (normalizedAnimations.idle) urls.push(getDisplayUrl(normalizedAnimations.idle));
    if (normalizedAnimations.run) urls.push(getDisplayUrl(normalizedAnimations.run));
    if (normalizedAnimations.hurt) urls.push(getDisplayUrl(normalizedAnimations.hurt));
    if (normalizedAnimations.dies) urls.push(getDisplayUrl(normalizedAnimations.dies));
    if (normalizedAnimations.rangeAttack) urls.push(getDisplayUrl(normalizedAnimations.rangeAttack));
    if (Array.isArray(normalizedAnimations.attack)) {
      normalizedAnimations.attack.filter(Boolean).forEach(url => urls.push(getDisplayUrl(url)));
    } else if (normalizedAnimations.attack) {
      urls.push(getDisplayUrl(normalizedAnimations.attack));
    }
    // Also include enemy-specific URLs
    if (enemy?.enemy_idle) urls.push(getDisplayUrl(enemy.enemy_idle));
    if (enemy?.enemy_run) urls.push(getDisplayUrl(enemy.enemy_run));
    if (enemy?.enemy_attack) urls.push(getDisplayUrl(enemy.enemy_attack));
    if (enemy?.enemy_hurt) urls.push(getDisplayUrl(enemy.enemy_hurt));
    if (enemy?.enemy_dies) urls.push(getDisplayUrl(enemy.enemy_dies));
    return urls.filter(url => url && typeof url === 'string');
  }, [normalizedAnimations, enemy, getDisplayUrl]);

  useEffect(() => {
    if (!animationTriggerKey) {
      return;
    }

    const resetUrl = animationConfig.isCompound ? animationConfig.runUrl : animationConfig.url;

    // ✅ FIX: Smart reset logic for PvP freezing issue.
    // Split keys to analyze changes. Index 0 is Challenge ID, Index 14 is Enemy State in ScreenPlay.js structure.
    const currentParts = animationTriggerKey.split('|');
    const prevParts = (prevTriggerKeyRef.current || '').split('|');
    prevTriggerKeyRef.current = animationTriggerKey;

    // Only parse if we have previous data to compare against
    if (prevParts.length > 0 && currentParts.length > 14) {
      const currentId = currentParts[0];
      const prevId = prevParts[0];
      // Normalizing state to handle 'na' as 'idle' for comparison
      const currentStateStr = currentParts[14] === 'na' ? 'idle' : currentParts[14];
      // const prevStateStr = prevParts[14] === 'na' ? 'idle' : prevParts[14]; // <-- REMOVED

      const isNewRound = currentId !== prevId;
      
      // ---------- CRITICAL FIX ----------
      // Relaxed condition: If it's a new round AND the *new* intended state is 'idle',
      // we skip the hard reset, regardless of what the previous state was.
      if (isNewRound && currentStateStr === 'idle') {
        console.log('🔄 PvP: New round with idle state detected. Flagging to skip frame reset to prevent freeze.');
        shouldSkipNextFrameResetRef.current = true; // Set flag for main animation effect
        
        // Ensure URL is up to date without killing animation
        if (resetUrl && currentAnimationUrlRef.current !== resetUrl) {
          currentAnimationUrlRef.current = resetUrl;
          setCurrentAnimationUrl(resetUrl);
        }
        return; // Exit early to prevent the hard reset below
      }
      // ----------------------------------
    }

    // --- Original Hard Reset Logic (runs if states are changing meaningfully) ---
    attackInitiated.value = false;
    attackSequenceRef.current = { runUrl: null, attackUrl: null };
    // This cancelAnimation is what causes the freeze if called incorrectly
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(rangeProjectileX);
    cancelAnimation(blinkOpacity);
    // We only reset frameIndex here if it's NOT a seamless transition
    frameIndex.value = 0;
    positionX.value = 0;
    rangeProjectileX.value = 0;
    blinkOpacity.value = 0;

    if (resetUrl && currentAnimationUrlRef.current !== resetUrl) {
      currentAnimationUrlRef.current = resetUrl;
      setCurrentAnimationUrl(resetUrl);
    }
  }, [
    animationTriggerKey,
    animationConfig.isCompound,
    animationConfig.runUrl,
    animationConfig.url,
    attackInitiated,
    blinkOpacity,
    frameIndex,
    positionX,
    rangeProjectileX,
  ]);

  // FIX: Check if ALL animations are cached (for immediate playback)
  // ... rest of the file remains unchanged ...

  // FIX: Check if ALL animations are cached (for immediate playback)
  const allAnimationsCached = useMemo(() => {
    return allAnimationUrls.every(url => isUrlCached(url));
  }, [allAnimationUrls, isUrlCached]);

  const [currentAnimationUrl, setCurrentAnimationUrl] = useState(initialUrl);
  const currentAnimationUrlRef = useRef(initialUrl);
  const attackSequenceRef = useRef({ runUrl: null, attackUrl: null });
  


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


    useEffect(() => {
    if (currentState !== 'hurt') {
      blinkOpacity.value = 0;
    }
  }, [currentState]);

  // FIX: Set imageReady to true if ALL animations are cached
  const [imageReady, setImageReady] = useState(allAnimationsCached || isUrlCached(initialUrl));
  const [preloadedImages] = useState(new Map());
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

  if (isBonusRound) wasBonusRound.current = true;
  else if (currentState === 'idle') wasBonusRound.current = false;

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
  const shouldFlipRangeAttack = matchCharacterStyle || animationConfig.isRange;

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

  // FIX: Sync URL immediately via ref instead of returning early
  if (targetUrl && currentAnimationUrlRef.current !== targetUrl) {
    currentAnimationUrlRef.current = targetUrl;
    setCurrentAnimationUrl(targetUrl);
    // DON'T return — continue to start the animation below
  }

  if (currentState !== 'attack' && currentState !== 'run') {
    attackInitiated.value = false;
    attackSequenceRef.current = { runUrl: null, attackUrl: null };
  }

  const activeUrl = currentAnimationUrlRef.current;

  const isActiveUrlCached = isUrlCached(activeUrl) || preloadedImages.has(activeUrl);
  const isTargetUrlCached = targetUrl ? (isUrlCached(targetUrl) || preloadedImages.has(targetUrl)) : true;
  const hasActiveUrl = hasUsableAnimationUrl(activeUrl);
  const hasTargetUrl = hasUsableAnimationUrl(targetUrl);
  
  if (isPaused || isFrozen) {
    cancelAnimation(frameIndex);
    cancelAnimation(positionX);
    cancelAnimation(rangeProjectileX);
    cancelAnimation(opacity);
    cancelAnimation(blinkOpacity);
    blinkOpacity.value = 0;
    return;
  }

  let compoundReady = true;
  if (config.isCompound && currentState === 'attack') {
      const { runUrl, attackUrl } = config;
      const runCached = isUrlCached(runUrl) || preloadedImages.has(runUrl);
      const attackCached = isUrlCached(attackUrl) || preloadedImages.has(attackUrl);
      const runUsable = hasUsableAnimationUrl(runUrl);
      const attackUsable = hasUsableAnimationUrl(attackUrl);
      compoundReady = (runCached || runUsable) && (attackCached || attackUsable);
  }

  const isCriticalState = currentState === 'attack' || currentState === 'hurt' || currentState === 'dies' || currentState === 'run';
    const canProceed = isCriticalState 
      ? (isActiveUrlCached || isTargetUrlCached || hasActiveUrl || hasTargetUrl) && compoundReady 
      : (imageReady || isActiveUrlCached || isTargetUrlCached || hasActiveUrl || hasTargetUrl);

  // 🚀 FIX: Hold all movement and frame logic until sprite-sheet is in memory
  if (!canProceed) {
    return; 
  }
  
  cancelAnimation(frameIndex);
  cancelAnimation(positionX);
  cancelAnimation(opacity);
  cancelAnimation(blinkOpacity);
  blinkOpacity.value = 0;
  
  // ✅ FIX: Check flag before resetting frame to 0. This ensures continuous animation.
  if (shouldSkipNextFrameResetRef.current) {
       console.log('⏩ PvP: Skipping frame reset for seamless transition.');
       shouldSkipNextFrameResetRef.current = false; // Reset flag immediately
       // Do NOT set frameIndex.value = 0 here. Reanimated will pick up from current frame.
  } else {
       // Normal behavior for actual state changes (attack, run, etc.)
       frameIndex.value = 0;
  }

  positionX.value = 0; 
  opacity.value = 1;

  if (config.isRange && currentState === 'attack') {
    const attackUrl = config.attackUrl;
    const rangeUrl = config.rangeUrl;
    const attackReady = isUrlCached(attackUrl) || preloadedImages.has(attackUrl);
    const rangeReady = !rangeUrl || isUrlCached(rangeUrl) || preloadedImages.has(rangeUrl);
    const attackUsable = hasUsableAnimationUrl(attackUrl);
    const rangeUsable = !rangeUrl || hasUsableAnimationUrl(rangeUrl);

    if ((!attackReady && !attackUsable) || (!rangeReady && !rangeUsable)) {
      return;
    }

    attackSequenceRef.current = { runUrl: null, attackUrl };
    attackInitiated.value = true;

    currentAnimationUrlRef.current = attackUrl;
    setCurrentAnimationUrl(attackUrl);

    const duration = ANIMATION_DURATIONS.attack;
    const ATTACK_RUN_DISTANCE = RUN_DISTANCE;

    if (effectiveEnemyName === 'Ryron') {
      rangeProjectileX.value = 0;
      rangeProjectileX.value = withDelay(
        900,
        withTiming(ATTACK_RUN_DISTANCE, {
          duration: duration * 0.3,
          easing: Easing.linear,
        })
      );
    } else {
      rangeProjectileX.value = ATTACK_RUN_DISTANCE + gameScale(-50);
    }

    frameIndex.value = withTiming(
      TOTAL_FRAMES - 1,
      { duration: ANIMATION_DURATIONS.attack, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(notifyAnimationComplete)();
        }
      }
    );

    return;
  }

  if (config.isCompound && currentState === 'attack') {
    const { runUrl, attackUrl } = config;

    const hasNewCompoundUrls =
      attackSequenceRef.current.runUrl !== runUrl ||
      attackSequenceRef.current.attackUrl !== attackUrl;

    if (attackInitiated.value && !hasNewCompoundUrls) return;
    if (attackInitiated.value && hasNewCompoundUrls) {
      attackInitiated.value = false;
    }

    // Double check BOTH urls are cached before authorizing movement.
    const isRunReady = isUrlCached(runUrl) || preloadedImages.has(runUrl);
    const isAttackReady = isUrlCached(attackUrl) || preloadedImages.has(attackUrl);
    if ((!isRunReady && !hasUsableAnimationUrl(runUrl)) || (!isAttackReady && !hasUsableAnimationUrl(attackUrl))) return;
    
    attackSequenceRef.current = { runUrl, attackUrl };
    attackInitiated.value = true;

    if (!runUrl || !attackUrl) {
      runOnJS(notifyAnimationComplete)();
      return;
    }

    if (isUrlCached(runUrl)) preloadedImages.set(runUrl, true);
    if (isUrlCached(attackUrl)) preloadedImages.set(attackUrl, true);

    // Ensure run URL is active before starting.
    currentAnimationUrlRef.current = runUrl;
    setCurrentAnimationUrl(runUrl);

    const RUN_DURATION = 700;
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
      currentAnimationUrlRef.current = attackUrl;
      runOnJS(setCurrentAnimationUrl)(attackUrl);

      frameIndex.value = withTiming(TOTAL_FRAMES - 1, { duration: ATTACK_DURATION, easing: Easing.linear }, (attackFinished) => {
        if (attackFinished) {
          // 🐌 Slower: Increase return (jumping back) duration
          positionX.value = withTiming(0, { duration: 500, easing: Easing.quad }, (returnFinished) => {
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

    const shouldPingPong = currentState === 'idle' || currentState === 'hurt';

    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, { duration: FRAME_DURATION * TOTAL_FRAMES, easing: Easing.linear }), 
      -1, 
      shouldPingPong
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
  currentState, isPaused, isFrozen, currentAnimationUrl,
  animationConfig.isCompound, animationConfig.shouldLoop, animationConfig.url,
  animationConfig.runUrl, animationConfig.attackUrl, notifyAnimationComplete, isUrlCached, hasUsableAnimationUrl, imageReady, animationTriggerKey
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

  const rangeContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rangeProjectileX.value }],
  }), []);

  const redFlashStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }), []);

  const isFront = useMemo(() => currentState === 'attack' || isAttacking, [currentState, isAttacking]);

  const shouldApplyHurtTint = useMemo(() => {
      return characterAnimations.character_hurt != null;
    }, [characterAnimations.character_hurt]);

  const showRangeAttack = currentState === 'attack' && animationConfig.isRange && animationConfig.rangeUrl;

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
    <Animated.View 
      style={[ 
        styles.enemyContainer, 
        matchCharacterStyle && styles.enemyContainerCharacterStyle,
        bossLayout, 
        containerStyle, 
        isFront && styles.front,
        displayReaction && { zIndex: 1000005 } 
      ]} 
    >

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
        <Animated.View
          style={[
            styles.attackOverlay,
            { zIndex: attackOverlayZIndex },
            overlayAnimatedStyle,
            matchCharacterStyle && styles.flipHorizontal,
          ]}
        >
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

      <View
        style={[
          styles.spriteContainer,
          { width: SPRITE_SIZE, height: SPRITE_SIZE, zIndex: 10 },
          matchCharacterStyle && styles.flipHorizontal,
        ]}
      >
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

          {currentAnimationUrl && currentState === 'hurt' && shouldApplyHurtTint && (
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

      {showRangeAttack && (
        <Animated.View
          style={[
            styles.spriteContainer,
            rangeContainerStyle,
            {
              position: 'absolute',
              width: SPRITE_SIZE,
              height: SPRITE_SIZE,
              zIndex: 20,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spriteSheet,
              animatedStyle,
              { width: SPRITE_SIZE * SPRITE_COLUMNS, height: SPRITE_SIZE * SPRITE_ROWS },
            ]}
          >
            <Image
              source={{ uri: animationConfig.rangeUrl }}
              style={[styles.spriteImage, shouldFlipRangeAttack && styles.flipHorizontal]}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={0}
            />
          </Animated.View>
        </Animated.View>
      )}
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
  enemyContainerCharacterStyle: {
    right: gameScale(-10),
    top: gameScale(130),
  },
  reactionContainer: {
    position: 'absolute',
    bottom: '90%',
    right: gameScale(30), 
    alignItems: 'center',
    zIndex: 1000000,
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
    fontFamily: 'DynaPuff',
  },
  reactionHighlight: {
    color: '#e30000', // Red color for quoted text
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
  flipHorizontal: {
    transform: [{ scaleX: -1 }],
  },
  front: {
    zIndex: 9999,
  },
  attackOverlay: {
    position: 'absolute',
    top: gameScale(-30),
    right: gameScale(-20),
    width: gameScale(140),
    height: gameScale(140),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
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
    
    opacity: 0.7, 
    height: '100%',
  },
});


export default React.memo(EnemyCharacter, (prev, next) => {
  return (
    prev.reactionText === next.reactionText &&
    prev.animationTriggerKey === next.animationTriggerKey &&
    prev.currentState === next.currentState &&
    prev.isPaused === next.isPaused &&
    prev.isAttacking === next.isAttacking &&
    prev.isBonusRound === next.isBonusRound &&
    prev.fightStatus === next.fightStatus &&
    prev.enemyName === next.enemyName && 
    prev.index === next.index &&      
    prev.attackOverlayUrl === next.attackOverlayUrl && 
    prev.enemyCurrentState === next.enemyCurrentState &&
    prev.characterAnimations === next.characterAnimations &&
    prev.matchCharacterStyle === next.matchCharacterStyle
  );
});