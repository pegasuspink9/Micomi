import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  StatusBar,
  ImageBackground,
  Easing,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGameData } from './hooks/useGameData';

const { width, height } = Dimensions.get('window');

const PAPER_TEXTURE_URL = 'https://www.transparenttextures.com/patterns/aged-paper.png'; 

export default function Micomic() {
  const params = useLocalSearchParams();
  const playerId = parseInt(params.playerId) || 11;
  const levelId = parseInt(params.levelId);

  const { gameState, loading, error } = useGameData(playerId, levelId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const lessons = gameState?.lessons?.lessons || [];
  const currentLesson = gameState?.currentLesson;
  const pages = lessons.map(lesson => lesson.page_url);

  useEffect(() => {
    if (currentLesson && lessons.length > 0) {
      const initialIndex = lessons.findIndex(lesson => lesson.lesson_id === currentLesson.lesson_id);
      if (initialIndex >= 0) {
        setCurrentIndex(initialIndex);
      }
    }
  }, [currentLesson, lessons]);

  const runAnimation = (toValue, callback) => {
    isAnimating.current = true;
    Animated.timing(flipAnim, {
      toValue: toValue,
      duration: 1000, 
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic), 
    }).start(({ finished }) => {
      if (finished) {
        callback && callback();
        isAnimating.current = false;
      }
    });
  };

  const handleNext = () => {
    if (isAnimating.current || currentIndex >= pages.length - 1) return;
    runAnimation(1, () => {
      setCurrentIndex(prev => prev + 1);
      flipAnim.setValue(0);
    });
  };

  const handlePrev = () => {
    if (isAnimating.current || currentIndex <= 0) return;
    setCurrentIndex(prev => {
      const newIndex = prev - 1;
      flipAnim.setValue(1); 
      requestAnimationFrame(() => {
        runAnimation(0);
      });
      return newIndex;
    });
  };

  // --- TRANSFORMATION LOGIC FOR BOTTOM-RIGHT CORNER PEEL ---

  // 1. Curl Angle: Tilts the page so bottom-right lifts up sharply (-45deg)
  const rotateZ = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-2deg'], 
  });

  // 2. Flip Over: Standard page flip rotation
  const rotateY = flipAnim.interpolate({
    inputRange: [0, 5],
    outputRange: ['0deg', '-90deg'], 
  });

  const rotateX = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-80deg'], 
  });

  // 3. Move Diagonally: Pulls the page up and left
  const translateX = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 1.2], 
  });

  const translateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.2], 
  });

  const animatedPageStyle = {
    transform: [
      { perspective: 2000 },
      
      // Add this line for the tilt
      { rotateY: '-5deg' },
      
      // 1. Move pivot to bottom-right corner
      { translateX: width / 2.2 },
      { translateY: height / 2},

      // 2. Apply Peel Motion (Global Movement)
      { translateX: translateX },
      { translateY: translateY },

      // 3. Apply Curl Rotation
      { rotateZ: '1deg' },
      { rotateY: rotateY },

      // 4. Move pivot back to center
      { translateX: -width / 2 },
      { translateY: -height / 2 },
    ],
    zIndex: 2,
  };

  const renderPage = (index, style = {}, key) => {
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
        
        {/* Shadow Overlay - Removed to prevent darkening */}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Micomic...</Text>
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

  if (gameState?.level?.level_type !== "micomiButton") {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>This is not a Micomi level.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.bookContainer}>
        {/* LAYER 1: The Static Page (Next Page) */}
        <View style={[styles.pageWrapper, { position: 'absolute', zIndex: 1 }]}>
           {renderPage(currentIndex + 1, {}, 'static-next')}
        </View>

        {/* LAYER 2: The Peeling Page (Current Page) */}
        {renderPage(currentIndex, animatedPageStyle, 'animated-current')}
      </View>

      {/* --- FLOATING UI CONTROLS --- */}
      <View style={styles.floatingHeader}>
        <Text style={styles.pageCounter}>
          Page {currentIndex + 1} / {pages.length}
        </Text>
      </View>

      <View style={styles.floatingControls}>
        <TouchableOpacity 
          style={[styles.floatButton, styles.leftBtn, currentIndex === 0 && styles.buttonDisabled]} 
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.buttonArrow}>←</Text>
          <Text style={styles.buttonText}>PREV</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.floatButton, styles.rightBtn, currentIndex === pages.length - 1 && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={currentIndex === pages.length - 1}
        >
          <Text style={styles.buttonText}>NEXT</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
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
    backgroundColor: '#F2E8C9', 
    overflow: 'hidden',
    borderColor: '#DDD6B8',
    borderWidth: 1,
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
    borderWidth: 1,
    borderColor: '#F2E8C9'
  },
  shadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  
  // --- Floating Controls Styles ---
  floatingHeader: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  pageCounter: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  floatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0, 
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonArrow: {
    color: '#fff',
    fontSize: 18,
    marginHorizontal: 5,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
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
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
  },
});