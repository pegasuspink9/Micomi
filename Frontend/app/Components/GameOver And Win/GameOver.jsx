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

//  COPIED: Smooth Reanimated Number Counter
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

//  COPIED: Helper for Reanimated Text
const ReanimatedTextInput = Reanimated.createAnimatedComponent(
  React.forwardRef((props, ref) => {
    return <Text ref={ref} {...props}>{props.value}</Text>;
  })
);

const GameOverModal = ({
  visible = false,
  onRetry = null,
  onHome = null,
  characterName = 'Character',
  enemyName = 'Enemy',
  isRetrying = false,
  completionRewards = null
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [preloadedImages] = useState(new Map());

  //  COPIED: Triggers for reward counters
  const [startCoinCount, setStartCoinCount] = useState(false);
  const [startPointCount, setStartPointCount] = useState(false);
  const [startExpCount, setStartExpCount] = useState(false);

  //  COPIED: Reanimated Shared Values
  const backgroundOpacity = useSharedValue(0);
  const spriteTranslateY = useSharedValue(SCREEN_HEIGHT);
  const textScale = useSharedValue(3);
  const textOpacity = useSharedValue(0);
  
  const reward1Scale = useSharedValue(0);
  const reward2Scale = useSharedValue(0);
  const reward3Scale = useSharedValue(0);
  
  const buttonsTranslateY = useSharedValue(SCREEN_HEIGHT);

  //  COPIED: Sprite configuration
  const SPRITE_SIZE = Math.round(scale(358));
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 50;

  const frameIndex = useSharedValue(0);
  
  //  COPIED: Animation URLs
  const animationUrls = [
    'https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Micomi%20Celebrating/micomiceleb1.png',
    'https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Micomi%20Celebrating/micomiceleb2.png',
    'https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Micomi%20Celebrating/micomiceleb3.png'
  ];

  const [animationUrl, setAnimationUrl] = useState(() => animationUrls[Math.floor(Math.random() * animationUrls.length)]);

  // ========== Image Preloading ==========
  const prefetchWithCache = useCallback(async () => {
    if (!animationUrl) return;
    try {
      if (preloadedImages.has(animationUrl)) {
        setImageReady(true);
        return;
      }
      await RNImage.prefetch(animationUrl);
      preloadedImages.set(animationUrl, true);
      setImageReady(true);
    } catch (err) {
      console.warn(`GameOver prefetch failed:`, err);
    }
  }, [animationUrl, preloadedImages]);

  useEffect(() => {
    let mounted = true;
    setImageReady(false);
    if (!animationUrl) return;
    if (preloadedImages.has(animationUrl)) {
      if (mounted) setImageReady(true);
      return;
    }
    prefetchWithCache();
    return () => { mounted = false; };
  }, [animationUrl, prefetchWithCache]);

  // ========== Sprite Animation Logic ==========
  useEffect(() => {
    if (visible && imageReady) {
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
  }, [visible, imageReady, TOTAL_FRAMES, FRAME_DURATION]);

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
      setAnimationUrl(animationUrls[Math.floor(Math.random() * animationUrls.length)]);
      
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

    //  COPIED: Reanimated Sequence
    
    // 0. Background
    backgroundOpacity.value = withTiming(1, { duration: 300 });

    // 1. Text (Drop In) - NOW FIRST
    textScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));
    textOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));

    // 2. Sprite (Slide Up) - NOW SECOND
    spriteTranslateY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 90 }));

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
    console.warn(`🎮 GameOver image load error:`, error);
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

  if (!visible) return null;

  return (
    <Reanimated.View 
      style={[
        styles.modalOverlay,
        backgroundStyle
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <ImageBackground
        source={require('./GameOverImage/backgroundMainFail.png')}
        resizeMode="cover"
        style={styles.backgroundImageContainer}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.contentContainer}>
        
        <Text style={styles.gameOverTitle}>GAME OVER</Text>

          {/* 2. Sprite Animation (Slides Up) -  MOVED BELOW TEXT */}
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
                {animationUrl && imageReady ? (
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
                  <View style={[styles.spriteImage, { backgroundColor: 'transparent' }]} />
                )}
              </Reanimated.View>
            </View>
          </Reanimated.View>

            
          {/* 1. Text (Game Over + Defeated Message) -  MOVED TO TOP */}
          <Reanimated.View
            style={[
              {
                alignItems: 'center',
                width: '100%',
                marginBottom: scale(20),
                zIndex: 20
              },
              textStyle
            ]}
          >
            <Text style={styles.defeatMessage}>
              {characterName} was defeated by {enemyName}
            </Text>
            {/*  Added feedback message support */}
            {completionRewards?.feedbackMessage && (
               <Text style={styles.feedbackMessage}>
                 {completionRewards.feedbackMessage}
               </Text>
            )}
          </Reanimated.View>

          

          {/* 4. Buttons (Slide Up) */}
          {isRetrying ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Restarting level...</Text>
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
                  onPress={onRetry}
                  disabled={isAnimating}
                >
                  <Image
                    source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760510778/Untitled_design_13_ginrqf.png' }}
                    style={[styles.buttonImage, styles.buttonImage1]}
                    resizeMode="contain"
                  />
                </Pressable>

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
                    style={[styles.buttonImage, styles.buttonImage2]}
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

export default GameOverModal;

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
    opacity: 0.5
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 5, 30, 1)',
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
    alignSelf: 'center',
    width: '100%'
  },
  spriteContainer: {
    overflow: 'hidden',
  },
  spriteSheet: {},
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  gameOverTitle: {
    fontSize: scale(60),
    color: '#ff4444ff',
    fontFamily: 'MusicVibes',
    textShadowColor: '#3c4747cc',
    textShadowOffset: { width: scale(-4), height: scale(3) },
    textShadowRadius: scale(2),
    marginBottom: scale(-70)
  },
  defeatMessage: {
    fontSize: scale(20),
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(135, 206, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    paddingHorizontal: scale(20),
    marginBottom: scale(10),
  },
  feedbackMessage: {
    width: '80%',
    textAlign: 'center',
    lineHeight: scale(18),
    alignSelf: 'center',
    fontSize: scale(12),
    color: '#ffffffff',
    marginBottom: scale(30),
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
    gap: scale(30),
  },
  floatingButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: scale(30),
  },
  buttonImage: {
    width: scale(80),
    height: scale(80),
  },
  buttonImage1: {
    width: scale(100),
    height: scale(100),
  },
  buttonImage2: {
    width: scale(100),
    height: scale(100),
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }]
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