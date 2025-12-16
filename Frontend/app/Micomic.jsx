import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  Animated, 
  StatusBar,
  ImageBackground,
  Easing,
  ActivityIndicator,
  PanResponder
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // 1. Import useRouter
import { useGameData } from './hooks/useGameData';
import { NavigationBar } from 'expo-navigation-bar';

const { width, height } = Dimensions.get('screen');

const PAPER_TEXTURE_URL = 'https://www.transparenttextures.com/patterns/aged-paper.png'; 

export default function Micomic() {
  const router = useRouter(); 
  const params = useLocalSearchParams();
  const playerId = parseInt(params.playerId) || 11;
  const levelId = parseInt(params.levelId);

  const { gameState, loading, error } = useGameData(playerId, levelId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [entranceFinished, setEntranceFinished] = useState(false); 
  
  const flipAnim = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  const indicatorOpacity = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);
  const hasInteracted = useRef(false);

  const lessons = gameState?.lessons?.lessons || [];
  const currentLesson = gameState?.currentLesson;
  
  const pages = useMemo(() => lessons.map(lesson => lesson.page_url), [lessons]);

  // --- PRELOAD LOGIC ---
  useEffect(() => {
    if (pages.length > 0) {
      const preloadImages = async () => {
        try {
          const promises = pages.map((url) => Image.prefetch(url));
          promises.push(Image.prefetch(PAPER_TEXTURE_URL));
          await Promise.all(promises);
          setImagesLoaded(true);
        } catch (e) {
          console.warn("Failed to preload images", e);
          setImagesLoaded(true);
        }
      };
      preloadImages();
    }
  }, [pages]);

  // --- ENTRANCE ANIMATION LOGIC ---
  useEffect(() => {
    if (imagesLoaded && pages.length > 0 && !entranceFinished) {
      setCurrentIndex(pages.length - 1);
      
      const runEntranceFlip = (index) => {
        if (index < 0) {
          setEntranceFinished(true);
          setCurrentIndex(0); 
          return;
        }
        setCurrentIndex(index);
        flipAnim.setValue(1); 
        Animated.timing(flipAnim, {
          toValue: 0, 
          duration: 100, 
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }).start(({ finished }) => {
          if (finished) {
            runEntranceFlip(index - 1);
          }
        });
      };

      setTimeout(() => {
        runEntranceFlip(pages.length - 1);
      }, 500);
    }
  }, [imagesLoaded, pages, entranceFinished, flipAnim]);


  useEffect(() => {
  const hideNavigationBar = async () => {
    try {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBackgroundColorAsync('#00000000');
    } catch (error) {
      console.warn('Failed to hide navigation bar:', error);
    }
  };
  
  hideNavigationBar();
  
  return () => {};
}, []);

  // --- BLINK ANIMATION ---
  useEffect(() => {
    const blinkAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkOpacity, {
            toValue: 0,
            duration: 800, 
            useNativeDriver: true,
          }),
          Animated.timing(blinkOpacity, {
            toValue: 1,
            duration: 800, 
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    if (entranceFinished) { 
       blinkAnimation();
    }
  }, [blinkOpacity, entranceFinished]);

  const hideIndicator = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [indicatorOpacity]);

  const runAnimation = useCallback((toValue, callback) => {
    if (!entranceFinished) return;

    isAnimating.current = true;
    Animated.timing(flipAnim, {
      toValue: toValue,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic), 
    }).start(({ finished }) => {
      if (finished) {
        callback && callback();
        isAnimating.current = false;
      }
    });
  }, [flipAnim, entranceFinished]);

  // --- 3. HANDLE NEXT / FINISH LOGIC ---
  const handleNext = useCallback(() => {
    // If on the last page, Finish/Exit
    if (currentIndex >= pages.length - 1) {
      if (isAnimating.current) return;
      
      // Optional: Animate exit before navigating
      runAnimation(1, () => {
         console.log("Book finished! Navigating back...");
         router.back(); // Navigate back to previous screen
      });
      return;
    }

    if (isAnimating.current) return;
    runAnimation(1, () => {
      setCurrentIndex(prev => prev + 1);
      flipAnim.setValue(0);
    });
  }, [isAnimating, currentIndex, pages.length, runAnimation, flipAnim, router]);

  const handlePrev = useCallback(() => {
    if (isAnimating.current || currentIndex <= 0) return;
    setCurrentIndex(prev => {
      const newIndex = prev - 1;
      flipAnim.setValue(1); 
      requestAnimationFrame(() => {
        runAnimation(0);
      });
      return newIndex;
    });
  }, [isAnimating, currentIndex, runAnimation, flipAnim]);

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Only hide indicator if NOT on the last page (keep hint for finish)
        if(currentIndex < pages.length - 1) {
             hideIndicator();
        }
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!entranceFinished) return; 

        const { dx } = gestureState;
        const SWIPE_THRESHOLD = 50;

        if (dx < -SWIPE_THRESHOLD) {
          // Swipe Left -> Next
          handleNext();
        } else if (dx > SWIPE_THRESHOLD) {
          // Swipe Right -> Prev
          handlePrev();
        }
      },
    }), 
    [handleNext, handlePrev, hideIndicator, entranceFinished, currentIndex, pages.length] 
  );

  // --- TRANSFORMATION LOGIC ---
  const animatedPageStyle = useMemo(() => {
    const rotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-20deg'], 
    });

    const translateX = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -width * 1.3], 
    });

    const translateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -height * 0.1], 
    });

    return {
      transform: [
        { perspective: 2000 },
        { translateX: width / 2 },
        { translateY: height / 2},
        { translateX: translateX },
        { translateY: translateY },
        { rotateY: rotateY },
        { translateX: -width / 2 },
        { translateY: -height / 2 },
      ],
      zIndex: 2,
    };
  }, [flipAnim]);

  const renderPage = useCallback((index, style = {}, key) => {
    if (index < 0 || index >= pages.length) return null;
    return (
      <Animated.View key={key} style={[styles.pageWrapper, style]}>
        <ImageBackground 
          source={{ uri: PAPER_TEXTURE_URL }} 
          style={styles.paperBackground}
          resizeMode="repeat" 
        >
          <Image 
            source={{ uri: pages[index] }} 
            style={styles.pageImage} 
            resizeMode="contain" 
          />
        </ImageBackground>
      </Animated.View>
    );
  }, [pages]);

  if (loading || !imagesLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Assets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Determine text for the last page
  const isLastPage = currentIndex === pages.length - 1;
  const indicatorText = isLastPage ? "Swipe Left to Finish" : "Swipe Right or Left to Turn";

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden translucent backgroundColor="transparent" />

      <View style={styles.bookContainer}>
        <View style={[styles.pageWrapper, { position: 'absolute', zIndex: 1 }]}>
           {renderPage(currentIndex + 1, {}, 'static-next')}
        </View>

        {renderPage(currentIndex, animatedPageStyle, 'animated-current')}
      </View>

      <View style={styles.floatingHeader}>
        <Text style={styles.pageCounter}>
          {currentIndex + 1} / {pages.length}
        </Text>
      </View>

      {entranceFinished && (
        <Animated.View 
        style={[
          styles.swipeIndicatorContainer, 
          { opacity: isLastPage ? 1 : indicatorOpacity }
        ]}
        pointerEvents="none"
        >
        <View style={[styles.swipeIndicatorBox, isLastPage && styles.finishBox]}>
          <Text style={styles.swipeText}>
            <Animated.Text style={[styles.middleText, { opacity: blinkOpacity }]}>
               {indicatorText}
            </Animated.Text>
          </Text>
        </View>
      </Animated.View>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 999, 
    backgroundColor: '#000',
  },
  bookContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  pageWrapper: {
    width: width,
    height: height,
    position: 'absolute',
    backgroundColor: '#fdecb7', 
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: '#a3583bff',
    borderBottomWidth: 1,
    borderBottomColor: '#a3583bff',
  },
  paperBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, 
  },
  pageImage: {
    width: '100%',
    height: '100%', 
    resizeMode: 'contain',
  },
  floatingHeader: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10
  },
  pageCounter: {
    color: '#000000ff',
    fontFamily: 'Grobold',
    fontSize: 14,
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    bottom: 50, 
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  swipeIndicatorBox: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeText: {
    textAlign: 'center', 
  },
  middleText: {
    fontSize: 20, 
    color: '#000000ff', // Default black text
    fontFamily: 'Grobold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    width: width,
    height: height,
    position: 'absolute',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    width: width,
    height: height,
    position: 'absolute',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
  },
});