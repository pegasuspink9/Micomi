import React, { useState, useRef, useEffect, useCallback } from 'react';
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

const LevelCompletionModal = ({
  visible,
  onRetry,
  onHome,
  onNextLevel,
  completionRewards,
  nextLevel,
  isLoading, 
  victoryAudioUrl,
  victoryImageUrl
}) => {
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
      // Try to get cached path first
      const cached = universalAssetPreloader.getCachedAssetPath(victoryImageUrl);
      console.log('🏆 LevelCompletion cached path:', cached);
      setAnimationUrl(cached);
      
      // If it's a cached local file, it's ready immediately
      if (cached && cached.startsWith('file://')) {
        console.log('🏆 LevelCompletion image is cached locally, ready immediately');
        setImageReady(true);
      } else {
        // Need to load from remote URL
        console.log('🏆 LevelCompletion image needs to be loaded from remote:', cached);
        setImageReady(false);
      }
    } else {
      console.warn('🏆 LevelCompletion: No victoryImageUrl provided!');
      setAnimationUrl(null);
      setImageReady(false);
    }
  }, [victoryImageUrl]);

  // ========== Image Loading ==========
  useEffect(() => {
    if (!animationUrl) {
      console.log('🏆 LevelCompletion: No animationUrl set yet');
      setImageReady(false);
      return;
    }

    // If it's already a local file path, it's ready
    if (animationUrl.startsWith('file://')) {
      console.log('🏆 LevelCompletion image is cached locally, ready immediately');
      setImageReady(true);
      return;
    }

    // Otherwise prefetch remote URL
    let mounted = true;
    setImageReady(false);
    
    console.log('🏆 LevelCompletion: Prefetching remote image:', animationUrl);
    
    (async () => {
      try {
        await RNImage.prefetch(animationUrl);
        if (mounted) {
          console.log('🏆 LevelCompletion: Image prefetched successfully');
          setImageReady(true);
        }
      } catch (err) {
        console.warn(`🏆 LevelCompletion prefetch failed:`, err);
        // Still set ready to allow rendering with expo-image handling
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
      // Reset triggers
      setStartCoinCount(false);
      setStartPointCount(false);
      setStartExpCount(false);
      
      startEntranceAnimation();
    } else {
      resetAnimations();
    }
  }, [visible]);

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

    //  FIXED: Reanimated Sequence (Runs on UI Thread)
    
    // 0. Background
    backgroundOpacity.value = withTiming(1, { duration: 300 });

    // 1. Sprite (Slide Up)
    spriteTranslateY.value = withDelay(100, withSpring(0, { damping: 12, stiffness: 90 }));

    // 2. Text (Drop In)
    textScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    textOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

    // 3. Rewards (Pop In)
    reward1Scale.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 120 }, (finished) => {
      if (finished) runOnJS(setStartCoinCount)(true);
    }));

    reward2Scale.value = withDelay(700, withSpring(1, { damping: 10, stiffness: 120 }, (finished) => {
      if (finished) runOnJS(setStartPointCount)(true);
    }));

    reward3Scale.value = withDelay(900, withSpring(1, { damping: 10, stiffness: 120 }, (finished) => {
      if (finished) runOnJS(setStartExpCount)(true);
    }));

    // 4. Buttons
    buttonsTranslateY.value = withDelay(1100, withSpring(0, { damping: 14, stiffness: 80 }, (finished) => {
      if (finished) runOnJS(setIsAnimating)(false);
    }));
  };

  const resetAnimations = () => {
    setIsAnimating(false);
    setStartCoinCount(false);
    setStartPointCount(false);
    setStartExpCount(false);
  };

  const handleImageError = useCallback((error) => {
    console.warn(`🏆 Celebration image load error:`, error);
  }, []);

  const handleImageLoadEnd = useCallback(() => {
    console.log('🏆 LevelCompletion: Image loaded successfully');
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

  if (!visible) return null;

  const levelClearText = 'Level Cleared!';
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
              spriteContainerStyle
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

          {/* 2. Text & Feedback (Drops In) */}
          <Reanimated.View
            style={[
              {
                alignItems: 'center',
                width: '100%'
              },
              textStyle
            ]}
          >
            <Text style={styles.feedbackMessage}>
              {completionRewards?.feedbackMessage}
            </Text>
          </Reanimated.View>

          {/* 3. Rewards Display (Pop In Sequence) */}
          {completionRewards && (
            <View style={styles.rewardsDisplay}>
              {/* Coins */}
              <Reanimated.View style={[styles.rewardItem, reward1Style]}>
                <Image 
                  source={{uri: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e'}} 
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                <NumberCounter value={completionRewards.coinsEarned} start={startCoinCount} duration={1500} />
              </Reanimated.View>

              {/* Points */}
              <Reanimated.View style={[styles.rewardItem, reward2Style]}>
                <Image 
                  source={{uri: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e'}} 
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                <NumberCounter value={completionRewards.currentTotalPoints} start={startPointCount} duration={1500} />
              </Reanimated.View>

              {/* EXP */}
              <Reanimated.View style={[styles.rewardItem, reward3Style]}>
                <Image 
                  source={{uri: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e'}} 
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                <NumberCounter value={completionRewards.currentExpPoints} start={startExpCount} duration={1500} />
              </Reanimated.View>
            </View>
          )}

          {/* 4. Buttons (Slide Up) */}
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
                          source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760510848/Untitled_design_14_rzz5wx.png' }}
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
                            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760514009/Untitled_design_15_tdknw8.png' }}
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
                          source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760510778/Untitled_design_13_ginrqf.png' }}
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
  spriteSheet: {},
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
    width: '80%',
    textAlign: 'center',
    lineHeight: scale(18),
    alignSelf: 'center',
    fontSize: scale(12),
    color: '#ffffffff',
    marginBottom: scale(20),
    fontFamily: 'MusicVibes',
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
    fontSize: scale(30),
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
  },
  lowerGridWrapper: {
    height: hp(12),
    width: '70%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    marginBottom: scale(20),
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
});