import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  PanResponder, 
  Easing, 
  StatusBar 
} from 'react-native';
import { Image } from 'expo-image';
import { ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { useGameData } from './hooks/useGameData'; 
import MainLoading from './Components/Actual Game/Loading/MainLoading';
import { soundManager } from './Components/Actual Game/Sounds/UniversalSoundManager';

const { width, height } = Dimensions.get('screen');

const PAPER_TEXTURE_URL = 'https://www.transparenttextures.com/patterns/aged-paper.png'; 

export default function Micomic() {
  const router = useRouter(); 
  const params = useLocalSearchParams();
  const levelId = parseInt(params.levelId);

  const { gameState, loading, error } = useGameData(levelId);

  // --- STATE ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // --- ANIMATIONS ---
  const flipAnim = useRef(new Animated.Value(0)).current; 
  const isAnimating = useRef(false);

  // --- 1. SORT PAGES ---
  const pages = useMemo(() => {
    const lessonsData = gameState?.lessons;
    const rawLessons = lessonsData?.lessons;
    const coverPage = lessonsData?.cover_page;
    
    if (!Array.isArray(rawLessons)) return [];

    const sortedPages = [...rawLessons]
      .sort((a, b) => {
        const getNum = (str) => {
          const match = str.match(/Cpage(\d+)\./i);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getNum(a.page_url) - getNum(b.page_url);
      })
      .map(lesson => lesson.page_url);

    // Prepend cover page if it exists
    return coverPage ? [coverPage, ...sortedPages] : sortedPages;
  }, [gameState]);

  const hasCoverPage = !!gameState?.lessons?.cover_page;

  // --- 2. HIDE NAVIGATION BAR ---
  useEffect(() => {
    const hideNavigationBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBackgroundColorAsync('#00000000');
      } catch (error) {
        // console.warn('Failed to hide navigation bar:', error); // Removed console.warn
      }
    };
    hideNavigationBar();
  }, []);

  // --- 3. PRELOAD IMAGES ---
  useEffect(() => {
    if (pages.length > 0) {
      let loadedCount = 0;
      pages.forEach(url => {
        Image.prefetch(url).then(() => {
          loadedCount++;
          if (loadedCount === pages.length) {
            setImagesLoaded(true);
          }
        }).catch(err => {
            // console.warn("Failed to prefetch", url, err); // Removed console.warn
            loadedCount++;
            if (loadedCount === pages.length) setImagesLoaded(true);
        });
      });
    }
  }, [pages]);

  // --- ANIMATION CONTROLLER ---
  const animateTurnPage = useCallback((toValue, callback) => {
    isAnimating.current = true;
    Animated.timing(flipAnim, {
      toValue: toValue,
      duration: 500, // Slightly faster duration for snappier feel
      useNativeDriver: true,
      easing: Easing.out(Easing.poly(4)), // Smoother easing function
    }).start(({ finished }) => {
      if (finished) {
        callback && callback();
        isAnimating.current = false;
      }
    });
  }, [flipAnim]);

  // --- NAVIGATION HANDLERS ---
  const handleNext = useCallback(() => {
    if (isAnimating.current) return;

    soundManager.playPageFlipSound(0.6);

    if (currentIndex >= pages.length - 1) {
      animateTurnPage(1, () => {
        router.back(); 
      });
    } else {
      animateTurnPage(1, () => {
        setCurrentIndex(prev => prev + 1);
        // Ensure flipAnim is reset in the next frame to prevent flicker
        requestAnimationFrame(() => {
           flipAnim.setValue(0);
        });
      });
    }
  }, [currentIndex, pages.length, animateTurnPage, router, flipAnim]);

  const handlePrev = useCallback(() => {
    if (isAnimating.current || currentIndex <= 0) return;
    
    soundManager.playPageFlipSound(0.6);

    // Immediately set to flipped out position so the incoming page
    // starts off-screen and flies in.
    flipAnim.setValue(1); 
    setCurrentIndex(prev => prev - 1);
    
    // Animate [1 -> 0] (flip into view)
    requestAnimationFrame(() => {
      animateTurnPage(0, null); // No callback needed, just animate in
    });
  }, [currentIndex, animateTurnPage, flipAnim]);


  // --- GESTURE HANDLING ---
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const SWIPE_THRESHOLD = 50;

        if (dx < -SWIPE_THRESHOLD) {
          handleNext();
        } else if (dx > SWIPE_THRESHOLD) {
          handlePrev();
        }
      },
    }), 
    [handleNext, handlePrev] 
  );

  // --- INTERPOLATIONS ---
  const animatedCurrentStyle = useMemo(() => {
    const rotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-20deg'], 
    });

    const translateX = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -width * 1.5], // Ensure it moves well off-screen
    });

    const translateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -height * 0.1], 
    });

    // Added opacity to cleanly fade out the outgoing page
    const opacity = flipAnim.interpolate({
      inputRange: [0, 0.7, 1], // Start fading out later in the animation
      outputRange: [1, 1, 0],
      extrapolate: 'clamp',
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
      opacity: opacity, // Apply the opacity animation here
      zIndex: 10, // Ensure this page is always on top when animating
    };
  }, [flipAnim]);

  const renderPage = (index, animatedStyle = {}, zIndexVal) => {
    if (index < 0 || index >= pages.length) return null;
    
    return (
      <Animated.View 
        key={`page-${index}`} // Stable keys are crucial for React performance
        style={[styles.pageWrapper, animatedStyle, { zIndex: zIndexVal }]}
      >
        <ImageBackground 
          source={{ uri: PAPER_TEXTURE_URL }} 
          style={styles.paperBackground}
          resizeMode="repeat" 
        >
          <Image 
            source={{ uri: pages[index] }} 
            style={styles.pageImage} 
            contentFit="contain"
            cachePolicy="memory-disk" 
            // Removed transition prop to prevent any image-specific fading
          />
        </ImageBackground>
      </Animated.View>
    );
  };
  
  const isDataReady = !loading && pages.length > 0 && imagesLoaded;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <MainLoading visible={!isDataReady} />

      {isDataReady && (
        <>
          <View style={styles.bookContainer}>
            {currentIndex < pages.length - 1 && 
              renderPage(currentIndex + 1, {}, 1)
            }
            {renderPage(currentIndex, animatedCurrentStyle, 10)}
          </View>

          {/* Hide counter for the cover page (index 0) if it exists */}
          {(!hasCoverPage || currentIndex > 0) && (
            <View style={styles.floatingHeader}>
              <Text style={styles.pageCounter}>
                Page {hasCoverPage ? currentIndex : currentIndex + 1} / {hasCoverPage ? pages.length - 1 : pages.length}
              </Text>
            </View>
          )}

          <View style={styles.swipeIndicatorContainer}>
              <Text style={styles.swipeText}>
                {currentIndex === 0 && pages.length > 1 ? "Swipe Left to Begin" :
                 currentIndex === pages.length - 1 && pages.length > 0 ? "Swipe Left to Finish" :
                 ""
                }
              </Text>
          </View>
        </>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  bookContainer: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageWrapper: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: '#fdecb7', 
    overflow: 'hidden',
    backfaceVisibility: 'hidden', 
  },
  paperBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: '100%',
    height: '100%', 
  },
  floatingHeader: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10
  },
  pageCounter: {
    color: '#000000',
    fontFamily: 'Grobold', 
    fontSize: 14,
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    bottom: 40, 
    alignSelf: 'center',
    zIndex: 20,
  },
  swipeText: {
    color: '#000000',
    fontFamily: 'Grobold',
    fontSize: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
  }
});