import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  scale, 
  hp,
  SCREEN
} from '../Responsiveness/gameResponsive';
import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';
import { soundManager } from '../Actual Game/Sounds/UniversalSoundManager'; 
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

// Import Reanimated
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  withRepeat, 
  Easing, 
  cancelAnimation,
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

//  FIXED: Smooth Reanimated Number Counter
const NumberCounter = ({ value, start, duration = 2500 }) => {
  const animatedValue = useSharedValue(0);
  
  useEffect(() => {
    if (!start) {
      animatedValue.value = 0;
      return;
    }
    animatedValue.value = withTiming(value || 0, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [start, value, duration]);

  return (
    <ReanimatedTextInput
      style={styles.rewardValue}
      animatedProps={useAnimatedStyle(() => ({
        text: Math.floor(animatedValue.value).toString()
      }))}
      editable={false}
      value={Math.floor(animatedValue.value).toString()}
    />
  );
};

// Helper for Reanimated Text
const ReanimatedTextInput = Reanimated.createAnimatedComponent(
  React.forwardRef((props, ref) => {
    return <Text ref={ref} {...props}>{props.value}</Text>;
  })
);

// Helper for Diagonal Lines (Shadow Effect)
const StripedFill = () => (
  <View style={styles.stripeContainer}>
    {Array.from({ length: 20 }).map((_, i) => (
      <View key={i} style={styles.stripeLine} />
    ))}
  </View>
);

const LevelCompletionModal = ({
  visible,
  onRetry,
  onHome,
  onNextLevel,
  completionRewards,
  nextLevel,
  isLoading, 
  victoryAudioUrl,
  victoryImageUrl,
  isPvpMode = false,
}) => {
  //  1. Placeholder Data for Stars
  const stars = completionRewards?.stars || 0; 
  const rankProgress = completionRewards?.rankProgress || null;
  const usePvpRankProgress = Boolean(isPvpMode && rankProgress);

  const requiredRankPoints = Math.max(1, Number(rankProgress?.rank_progress_required || 0));
  const beforeRankPoints = Math.max(0, Number(rankProgress?.before_points || 0));
  const currentRankPoints = Math.max(0, Number(rankProgress?.player_rank_points || 0));

  const rankBeforePercent = Math.min(100, Math.max(0, (beforeRankPoints / requiredRankPoints) * 100));
  const rankCurrentPercent = Math.min(100, Math.max(0, (currentRankPoints / requiredRankPoints) * 100));

  const playerRankImage = useMemo(() => {
    const sourceUrl = rankProgress?.player_rank_image;
    if (!sourceUrl) return null;
    return universalAssetPreloader.getCachedAssetPath(sourceUrl);
  }, [rankProgress?.player_rank_image]);

  const nextRankImage = useMemo(() => {
    const sourceUrl = rankProgress?.next_rank_image;
    if (!sourceUrl) return null;
    return universalAssetPreloader.getCachedAssetPath(sourceUrl);
  }, [rankProgress?.next_rank_image]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  //  Triggers
  const [startCoinCount, setStartCoinCount] = useState(false);
  const [startPointCount, setStartPointCount] = useState(false);
  const [startExpCount, setStartExpCount] = useState(false);

  //   FIXED: Reanimated Shared Values for smooth 60fps animation
  const backgroundOpacity = useSharedValue(0);
  const spriteTranslateY = useSharedValue(SCREEN_HEIGHT);
  const textScale = useSharedValue(3);
  const textOpacity = useSharedValue(0);
  
  const reward1Scale = useSharedValue(0);
  const reward2Scale = useSharedValue(0);
  const reward3Scale = useSharedValue(0);
  
  const buttonsTranslateY = useSharedValue(SCREEN_HEIGHT);

  //  2. New Shared Values for Progress Bar & Stars
  const progressValue = useSharedValue(0);
  const starsOpacity = useSharedValue(0); // To fade the bar in
  
  // Star pop animations
  const star1Scale = useSharedValue(1); 
  const star2Scale = useSharedValue(1);
  const star3Scale = useSharedValue(1);

  useEffect(() => {
    if (visible && victoryAudioUrl) {
      soundManager.playVictorySound(victoryAudioUrl);
    }
  }, [visible, victoryAudioUrl]);

  //  FIXED: Round sprite size to integer to prevent sub-pixel flickering
  const SPRITE_SIZE = Math.round(scale(358));
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const frameIndex = useSharedValue(0);

  //  FIXED: Use backend image directly, no fallback arrays
  const [animationUrl, setAnimationUrl] = useState(null);

  //  FIXED: Set image URL from backend prop
  useEffect(() => {
    console.log('🏆 LevelCompletion victoryImageUrl received:', victoryImageUrl);
    
    if (victoryImageUrl && typeof victoryImageUrl === 'string') {
      const cached = universalAssetPreloader.getCachedAssetPath(victoryImageUrl);
      setAnimationUrl(cached);
      
      if (cached && cached.startsWith('file://')) {
        setImageReady(true);
      } else {
        setImageReady(false);
      }
    } else {
      setAnimationUrl(null);
      setImageReady(false);
    }
  }, [victoryImageUrl]);

  // ========== Image Loading ==========
  useEffect(() => {
    if (!animationUrl) {
      setImageReady(false);
      return;
    }

    if (animationUrl.startsWith('file://')) {
      setImageReady(true);
      return;
    }

    let mounted = true;
    setImageReady(false);
    
    (async () => {
      try {
        await RNImage.prefetch(animationUrl);
        if (mounted) {
          setImageReady(true);
        }
      } catch (err) {
        if (mounted) setImageReady(true);
      }
    })();
    
    return () => { mounted = false; };
  }, [animationUrl]);

  // ========== Sprite Animation Logic ==========
  useEffect(() => {
    if (visible && imageReady && animationUrl) {
      frameIndex.value = 0;
      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, {
          duration: TOTAL_FRAMES * FRAME_DURATION,
          easing: Easing.linear,
        }),
        -1, false
      );
    } else {
      cancelAnimation(frameIndex);
      frameIndex.value = 0;
    }
  }, [visible, imageReady, animationUrl, TOTAL_FRAMES, FRAME_DURATION]);

  const spriteSheetStyle = useAnimatedStyle(() => {
    const index = Math.floor(frameIndex.value);
    const col = index % SPRITE_COLUMNS;
    const row = Math.floor(index / SPRITE_COLUMNS);
    return {
      transform: [
        { translateX: -col * SPRITE_SIZE },
        { translateY: -row * SPRITE_SIZE },
      ],
    };
  }, [SPRITE_SIZE, SPRITE_COLUMNS]);

  // ========== ENTRANCE SEQUENCE ==========
  useEffect(() => {
    if (visible) {
      setStartCoinCount(false);
      setStartPointCount(false);
      setStartExpCount(false);
      startEntranceAnimation();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const popStar = (starScaleValue) => {
    starScaleValue.value = withSpring(1.8, { damping: 4, stiffness: 200 }, () => {
      starScaleValue.value = withSpring(1.2, { damping: 10, stiffness: 100 });
    });
  };

  const startEntranceAnimation = () => {
    setIsAnimating(true);
    
    // Reset Values
    backgroundOpacity.value = 0;
    spriteTranslateY.value = SCREEN_HEIGHT;
    textScale.value = 3;
    textOpacity.value = 0;
    reward1Scale.value = 0;
    reward2Scale.value = 0;
    reward3Scale.value = 0;
    buttonsTranslateY.value = SCREEN_HEIGHT;
    progressValue.value = 0;
    starsOpacity.value = 0;
    star1Scale.value = 1;
    star2Scale.value = 1;
    star3Scale.value = 1;

    // Determine target percentage based on mode
    let targetPercentage = 0;
    if (usePvpRankProgress) {
      targetPercentage = rankCurrentPercent;
    } else if (stars === 1) {
      targetPercentage = 30;
    } else if (stars === 2) {
      targetPercentage = 70;
    } else if (stars === 3) {
      targetPercentage = 100;
    }

    // 0. Background
    backgroundOpacity.value = withTiming(1, { duration: 300 });

    // 1. Sprite
    spriteTranslateY.value = withDelay(100, withSpring(0, { damping: 12, stiffness: 90 }));

    //  2. Progress Bar (Moved here, after sprite)
    starsOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    
    // Fill the bar
    if (usePvpRankProgress) {
      progressValue.value = rankBeforePercent;
    }
    progressValue.value = withDelay(500, withTiming(targetPercentage, {
      duration: 1500,
      easing: Easing.out(Easing.cubic)
    }));

    // Trigger star pops based on timing relative to fill duration
    if (!usePvpRankProgress) {
      if (stars >= 1) {
        setTimeout(() => runOnJS(popStar)(star1Scale), 900); // ~30% filled
      }
      if (stars >= 2) {
        setTimeout(() => runOnJS(popStar)(star2Scale), 1300); // ~70% filled
      }
      if (stars >= 3) {
        setTimeout(() => runOnJS(popStar)(star3Scale), 1700); // ~100% filled
      }
    }

    // 3. Text (Delayed further)
    textScale.value = withDelay(1800, withSpring(1, { damping: 12, stiffness: 100 }));
    textOpacity.value = withDelay(1800, withTiming(1, { duration: 300 }));

    // 4. Rewards
    reward1Scale.value = withDelay(2000, withSpring(1, { damping: 10, stiffness: 120 }, (finished) => {
      if (finished) runOnJS(setStartCoinCount)(true);
    }));

    reward2Scale.value = withDelay(2200, withSpring(1, { damping: 10, stiffness: 120 }, (finished) => {
      if (finished) runOnJS(setStartPointCount)(true);
    }));

    reward3Scale.value = withDelay(2400, withSpring(1, { damping: 10, stiffness: 120 }, (finished) => {
      if (finished) runOnJS(setStartExpCount)(true);
    }));

    // 5. Buttons
    buttonsTranslateY.value = withDelay(2600, withSpring(0, { damping: 14, stiffness: 80 }, (finished) => {
      if (finished) runOnJS(setIsAnimating)(false);
    }));
  };

  const resetAnimations = () => {
    setIsAnimating(false);
    setStartCoinCount(false);
    setStartPointCount(false);
    setStartExpCount(false);
    progressValue.value = 0;
    star1Scale.value = 1;
    star2Scale.value = 1;
    star3Scale.value = 1;
  };

  const handleImageError = useCallback((error) => {
    console.warn(`🏆 Celebration image load error:`, error);
  }, []);

  const handleImageLoadEnd = useCallback(() => {
    setImageReady(true);
  }, []);

  // Animated Styles
  const backgroundStyle = useAnimatedStyle(() => ({ opacity: backgroundOpacity.value }));
  const spriteContainerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: spriteTranslateY.value }] }));
  const textStyle = useAnimatedStyle(() => ({ 
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }] 
  }));
  const reward1Style = useAnimatedStyle(() => ({ transform: [{ scale: reward1Scale.value }] }));
  const reward2Style = useAnimatedStyle(() => ({ transform: [{ scale: reward2Scale.value }] }));
  const reward3Style = useAnimatedStyle(() => ({ transform: [{ scale: reward3Scale.value }] }));
  const buttonsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: buttonsTranslateY.value }] }));

  //  Progress Bar Animated Styles
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`
  }));
  
  const starContainerStyle = useAnimatedStyle(() => ({
    opacity: starsOpacity.value,
    transform: [{ translateY: interpolate(starsOpacity.value, [0, 1], [20, 0]) }]
  }));

  const animatedStar1Style = useAnimatedStyle(() => ({ transform: [{ scale: star1Scale.value }] }));
  const animatedStar2Style = useAnimatedStyle(() => ({ transform: [{ scale: star2Scale.value }] }));
  const animatedStar3Style = useAnimatedStyle(() => ({ transform: [{ scale: star3Scale.value }] }));

  const rewardCoinsValue = Number(completionRewards?.coinsEarned ?? 0);
  const rewardPointsValue = Number(
    completionRewards?.currentTotalPoints ?? completionRewards?.totalPointsEarned ?? 0
  );
  const rewardExpValue = Number(
    completionRewards?.currentExpPoints ?? completionRewards?.totalExpPointsEarned ?? 0
  );

  if (!visible) return null;

  const levelClearText = isPvpMode
    ? (completionRewards?.isVictory === false ? 'You Lost!' : 'You Won!')
    : 'Level Cleared!';
  const renderCurvedText = () => {
    return (
      <View style={styles.curvedTextContainer}>
        {levelClearText.split('').map((char, index, array) => {
          const totalChars = array.length;
          const centerIndex = (totalChars - 1) / 2;
          const distanceFromCenter = index - centerIndex;
          const maxRotation = 7;
          const rotationAngle = (distanceFromCenter / centerIndex) * maxRotation;
          const radiusOffset = Math.abs(distanceFromCenter) * -2;
          
          return (
            <Text
              key={index}
              style={[
                styles.levelCompletedTitle,
                {
                  transform: [
                    { rotate: `${rotationAngle}deg` },
                    { translateY: -radiusOffset }
                  ],
                  marginHorizontal: scale(0.5),
                }
              ]}
            >
              {char}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <Reanimated.View 
      style={[
        styles.modalOverlay,
        backgroundStyle
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <ImageBackground
        source={require('./GameOverImage/backgroundMain.png')}
        resizeMode="cover"
        style={styles.backgroundImageContainer}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.contentContainer}>
          
            {renderCurvedText()}
          {/* 1. Sprite Animation (Slides Up) */}
          <Reanimated.View 
            style={[
              styles.spriteContainerWrapper,
              spriteContainerStyle,
              { marginTop: scale(30) } 
            ]}
          >
            <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
              <Reanimated.View
                style={[
                  styles.spriteSheet,
                  {
                    width: SPRITE_SIZE * SPRITE_COLUMNS,
                    height: SPRITE_SIZE * SPRITE_ROWS,
                  },
                  spriteSheetStyle
                ]}
              >
                {/*  FIXED: Only render if we have animationUrl */}
                {animationUrl ? (
                  <Image
                    source={{ uri: animationUrl }}
                    style={styles.spriteImage}
                    contentFit="cover"
                    onLoadEnd={handleImageLoadEnd}
                    onError={handleImageError}
                    cachePolicy="disk"
                    priority="high"
                  />
                ) : (
                  <View style={[styles.spriteImage, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
              </Reanimated.View>
            </View>
          </Reanimated.View>

          {/*  2. PROGRESS BAR - PvE stars / PvP rank */}
          {!isLoading && (
            usePvpRankProgress ? (
              <Reanimated.View style={[styles.pvpRankProgressContainer, starContainerStyle]}>
                <View style={styles.pvpRankTopRow}>
                  <View style={styles.pvpRankEndpoint}>
                    {playerRankImage ? (
                      <Image source={{ uri: playerRankImage }} style={styles.pvpRankImage} contentFit="contain" />
                    ) : (
                      <View style={styles.pvpRankImagePlaceholder} />
                    )}
                    <View style={styles.pvpRankLabelGroup}>
                      <Text style={styles.pvpRankNameText} numberOfLines={1}>
                        {rankProgress?.player_rank_name || 'Current Rank'}
                      </Text>
                      <Text style={styles.pvpRankValueText} numberOfLines={1}>
                        {currentRankPoints}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pvpRankBarWrap}>
                    <View style={styles.progressTrackBorder}>
                      <View style={styles.progressTrack}>
                        <Reanimated.View style={[styles.progressFill, progressBarStyle]}>
                          <LinearGradient
                            colors={['#4ad8ff', '#2f9dff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        </Reanimated.View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.pvpRankEndpoint}>
                    {nextRankImage ? (
                      <Image source={{ uri: nextRankImage }} style={styles.pvpRankImage} contentFit="contain" />
                    ) : (
                      <View style={styles.pvpRankImagePlaceholder} />
                    )}
                    <View style={styles.pvpRankLabelGroup}>
                      <Text style={styles.pvpRankNameText} numberOfLines={1}>
                        {rankProgress?.next_rank_name || 'Next Rank'}
                      </Text>
                      <Text style={styles.pvpRankValueText} numberOfLines={1}>
                        {requiredRankPoints}
                      </Text>
                    </View>
                  </View>
                </View>
              </Reanimated.View>
            ) : (
              <Reanimated.View style={[styles.progressBarContainer, starContainerStyle]}>
                {/* Background Track with 3D Border Effect */}
                <View style={styles.progressTrackBorder}>
                  <View style={styles.progressTrack}>
                    {/* Animated Fill */}
                    <Reanimated.View style={[styles.progressFill, progressBarStyle]}>
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      {/* Diagonal Lines Effect */}
                      <StripedFill />
                    </Reanimated.View>

                    {/* Star Markers (Animated Pop) */}
                    <Reanimated.View style={[styles.starMarker, { left: '30%' }, animatedStar1Style]}>
                      <Image source={require('../RoadMap/stars.png')} style={styles.starIcon} contentFit="contain" />
                    </Reanimated.View>
                    <Reanimated.View style={[styles.starMarker, { left: '70%' }, animatedStar2Style]}>
                      <Image source={require('../RoadMap/stars.png')} style={styles.starIcon} contentFit="contain" />
                    </Reanimated.View>
                    <Reanimated.View style={[styles.starMarker, { left: '98%' }, animatedStar3Style]}>
                      <Image source={require('../RoadMap/stars.png')} style={styles.starIcon} contentFit="contain" />
                    </Reanimated.View>
                  </View>
                </View>
              </Reanimated.View>
            )
          )}

          {/* 3. Text & Feedback (Drops In) */}
          <Reanimated.View
            style={[
              {
                alignItems: 'center',
                width: '100%',
                marginTop: scale(20) // Added margin to separate from progress bar
              },
              textStyle
            ]}
          >
            <Text style={styles.feedbackMessage}>
              {completionRewards?.feedbackMessage}
            </Text>
          </Reanimated.View>

          {/* 4. Rewards Display (Pop In Sequence) */}
          {completionRewards && (
            <View style={styles.rewardsDisplay}>
              {/* Coins */}
              <Reanimated.View style={[styles.rewardItem, reward1Style]}>
                <Image 
                  source={require('../icons/coins.png')} 
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                {isPvpMode ? (
                  <Text style={styles.rewardValue}>{rewardCoinsValue}</Text>
                ) : (
                  <NumberCounter value={rewardCoinsValue} start={startCoinCount} duration={1500} />
                )}
              </Reanimated.View>

              {/* Points */}
              <Reanimated.View style={[styles.rewardItem, reward2Style]}>
                <Image 
                  source={require('../icons/points.png')} 
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                {isPvpMode ? (
                  <Text style={styles.rewardValue}>{rewardPointsValue}</Text>
                ) : (
                  <NumberCounter value={rewardPointsValue} start={startPointCount} duration={1500} />
                )}
              </Reanimated.View>

              {/* EXP */}
              <Reanimated.View style={[styles.rewardItem, reward3Style]}>
                <Image 
                  source={require('../icons/exp.png')} 
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                {isPvpMode ? (
                  <Text style={styles.rewardValue}>{rewardExpValue}</Text>
                ) : (
                  <NumberCounter value={rewardExpValue} start={startExpCount} duration={1500} />
                )}
              </Reanimated.View>
            </View>
          )}

          {/* 5. Buttons (Slide Up) */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Loading next level...</Text>
            </View>
          ) : (
            <Reanimated.View 
              style={[
                styles.lowerGridWrapper,
                buttonsStyle
              ]}
            >

                    <View style={styles.floatingButtonsArea}>
                      
                      <Pressable
                        style={({ pressed }) => [
                          styles.floatingButton,
                          pressed && styles.buttonPressed
                        ]}
                        onPress={onHome}
                        disabled={isAnimating}
                      >
                        <Image
                          source={require('./GameOverImage/Home.png')}
                          style={[styles.buttonImage, styles.buttonImage1]}
                          resizeMode="contain"
                        />
                      </Pressable>
                      {nextLevel ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.floatingButton,
                            pressed && styles.buttonPressed
                          ]}
                          onPress={onNextLevel}
                          disabled={isAnimating}
                        >
                          <Image
                            source={require('./GameOverImage/NextLevel.png')}
                            style={[styles.buttonImage, styles.buttonImage2]}
                            resizeMode="contain"
                          />
                        </Pressable>
                      ) : (
                        <Pressable style={[styles.floatingButton, styles.disabledButton]} disabled>
                          <LinearGradient colors={['rgba(102,102,102,0.85)','rgba(68,68,68,0.95)']} style={styles.buttonGradient}>
                            <Text style={styles.buttonText}>NO MORE LEVELS</Text>
                          </LinearGradient>
                        </Pressable>
                      )}

                      <Pressable
                        style={({ pressed }) => [
                          styles.floatingButton,
                          pressed && styles.buttonPressed
                        ]}
                        onPress={onRetry}
                        disabled={isAnimating}
                      >
                        <Image
                          source={require('./GameOverImage/Retry.png')}
                          style={[styles.buttonImage, styles.buttonImage3]}
                          resizeMode="contain"
                        />
                      </Pressable>

                    </View>
            </Reanimated.View>
          )}

        </View>
      </ImageBackground>
    </Reanimated.View>
  );
};

export default LevelCompletionModal;

const styles = StyleSheet.create({
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
    opacity:0.5
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 39, 47, 1)',
    zIndex: 99999,
    elevation: 99999,
  },
  contentContainer: {
    width: '100%',
    position: 'absolute',
    top: scale(30),
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteContainerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  spriteContainer: {
    overflow: 'hidden',
  },
  spriteSheet: {
  },
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  curvedTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'absolute',
    marginBottom: scale(600),
  },
  levelCompletedTitle: {
    fontSize: scale(55),
    color: '#2ce3f0ff',
    fontFamily: 'MusicVibes',
    textShadowColor: '#3c4747cc',
    textShadowOffset: { width: scale(-4), height: scale(3) },
    textShadowRadius: scale(2)
  },
  feedbackMessage: {
    width: '90%',
    textAlign: 'center',
    lineHeight: scale(18),
    alignSelf: 'center',
    fontSize: scale(12),
    color: '#ffffffff',
    marginBottom: scale(20),
    fontFamily: 'Grobold',
  },
  rewardsDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: scale(40),
  },
  rewardItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(15),
    paddingVertical: scale(15),
    paddingHorizontal: scale(10),
    minWidth: scale(70),
  },
  rewardIcon: {
    width: scale(50),
    height: scale(50),
    marginBottom: scale(5),
  },
  rewardValue: {
    fontSize: scale(20),
    color: '#ffffffff',
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
  lowerGridWrapper: {
    height: hp(12),
    width: '70%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    marginBottom: scale(10), 
  },
  floatingButtonsArea: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(10),
  },
  floatingButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    minWidth: scale(60),
    minHeight: scale(60),
    borderRadius: scale(30),
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonImage: {
    width: scale(80),
    height: scale(80),
  },
  buttonImage1:{
     width: scale(60),
    height: scale(60),
  },
  buttonImage2:{
    width: scale(120),
    height: scale(120),
  },
  buttonImage3:{
    width: scale(60),
    height: scale(60),
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }]
  },
  buttonGradient: {
    padding: scale(10),
    borderRadius: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: scale(14),
    color: '#ffffffe0',
    fontFamily: 'FunkySign',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(20),
    paddingHorizontal: scale(40),
  },
  loadingText: {
    fontSize: scale(14),
    fontFamily: 'DynaPuff',
    color: '#fff',
    textAlign: 'center',
    marginTop: scale(10),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  
  //  UPDATED: Cartoonish 3D Progress Bar Styles
  progressBarContainer: {
    width: '60%',
    height: scale(50), 
    alignItems: 'center',
    justifyContent: 'center',
  },
  pvpRankProgressContainer: {
    width: '78%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(5),
  },
  pvpRankTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  pvpRankBarWrap: {
    flex: 1,
  },
  pvpRankEndpoint: {
    width: scale(14),
    zIndex: 10, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  pvpRankImage: {
    width: scale(60),
    height: scale(60),
  },
  pvpRankImagePlaceholder: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pvpRankBottomRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(4),
    paddingHorizontal: scale(4),
  },
  pvpRankLabelGroup: {
    position: 'absolute',
    top: scale(72),
    alignItems: 'center',
    width: scale(100),
    zIndex: 11,
  },
  pvpRankLabelGroupRight: {
    position: 'absolute',
    top: scale(72),
    alignItems: 'center',
    width: scale(100),
    zIndex: 11,
  },
  pvpRankNameText: {
    color: '#e6f8ff',
    fontSize: scale(10),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
  pvpRankValueText: {
    color: '#ffffff',
    fontSize: scale(10),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },
  // The outer 3D border container
  progressTrackBorder: {
    width: '100%',
    height: scale(17), // Taller to accommodate border/shadow
    backgroundColor: '#ffffffff', // Dark base for 3D depth
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: '#000000ff', // Outer grey border
    padding: 2, // Inner spacing
    // Shadow for 3D pop
    shadowColor: '#87810bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 6,
  },
  // The inner track
  progressTrack: {
    flex: 1,
    backgroundColor: '#ffffffff', // Darker inner track
    borderRadius: scale(8),
    overflow: 'visible', 
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(8),
    overflow: 'hidden',
    borderRightWidth: 2,
    borderRightColor: '#FFFACD', // Highlight on right edge of fill
  },
  // Stripe lines for shadow effect
  stripeContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    opacity: 0.1, // Subtle effect
  },
  stripeLine: {
    width: 5,
    height: '150%',
    backgroundColor: '#9c8500ff',
    transform: [{ rotate: '30deg' }, { translateY: -5 }],
  },
  starMarker: {
    position: 'absolute',
    top: scale(-15), // Pull star slightly above to center on thicker bar
    width: scale(34),
    height: scale(34),
    marginLeft: scale(-17), 
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  starIcon: {
    width: '100%',
    height: '100%',
  }
});