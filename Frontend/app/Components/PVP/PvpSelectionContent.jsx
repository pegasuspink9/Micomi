import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const TOPIC_IMAGES = {
  HTML: 'https://micomi-assets.me/Pvp%20Assets/Languages/HTML.png',
  CSS: 'https://micomi-assets.me/Pvp%20Assets/Languages/CSSS.png',
  JavaScript: 'https://micomi-assets.me/Pvp%20Assets/Languages/JavaScript.png',
  Computer: 'https://micomi-assets.me/Pvp%20Assets/Languages/Computer.png',
};

const LEVEL_SELECTOR_IMAGES = {
  HTML: require('../Map/Assets/html_selector.png'),
  CSS: require('../Map/Assets/css_selector.png'),
  JavaScript: require('../Map/Assets/javascript_selector.png'),
  Computer: require('../Map/Assets/computer_selector.png'),
};

const ARROW_IMAGE = require('../Map/Assets/right arrow.png');

// --- Animation Logic (Unchanged) ---
const getInitialTranslateX = (index, activeIndex, total) => {
  const prevIndex = (activeIndex - 1 + total) % total;
  const nextIndex = (activeIndex + 1) % total;

  if (index === activeIndex) return 0;
  if (index === prevIndex) return -gameScale(130);
  if (index === nextIndex) return gameScale(130);
  return index > activeIndex ? gameScale(700) : -gameScale(700);
};

const getInitialScale = (index, activeIndex, total) => {
  const prevIndex = (activeIndex - 1 + total) % total;
  const nextIndex = (activeIndex + 1) % total;

  if (index === activeIndex) return 1;
  if (index === prevIndex || index === nextIndex) return 0.82;
  return 0.5;
};

const getInitialOpacity = (index, activeIndex, total) => {
  const prevIndex = (activeIndex - 1 + total) % total;
  const nextIndex = (activeIndex + 1) % total;

  if (index === activeIndex) return 1;
  if (index === prevIndex || index === nextIndex) return 0.65;
  return 0;
};

const PvpSelectionContent = ({
  loadingPreview,
  findingMatch,
  startingMatch,
  settingTopic,
  hasResumableMatch,
  currentTopic,
  pvpTopics,
  currentTopicIndex,
  pvpTopicsLength,
  pvpError,
  primaryButtonLabel,
  matchmakingTimerLabel,
  onPreviousTopic,
  onNextTopic,
  onToggleMatch,
}) => {
  const isBusy = startingMatch || settingTopic;
  const isActionDisabled = !pvpTopicsLength || findingMatch || isBusy;

  const [animations, setAnimations] = useState([]);
  // New Animated Value for the floating effect
  const floatAnim = useRef(new Animated.Value(0)).current;

  // --- Carousel Animation Effects (Unchanged) ---
  useEffect(() => {
    if (!Array.isArray(pvpTopics) || pvpTopics.length === 0) {
      setAnimations([]);
      return;
    }

    const initialAnimations = pvpTopics.map((_, index) => ({
      translateX: new Animated.Value(getInitialTranslateX(index, currentTopicIndex, pvpTopics.length)),
      scale: new Animated.Value(getInitialScale(index, currentTopicIndex, pvpTopics.length)),
      opacity: new Animated.Value(getInitialOpacity(index, currentTopicIndex, pvpTopics.length)),
    }));

    setAnimations(initialAnimations);
  }, [pvpTopics]);

  useEffect(() => {
    if (!animations.length || !pvpTopics.length) {
      return;
    }

    const animatedSet = animations.map((anim, index) => {
      const toTranslateX = getInitialTranslateX(index, currentTopicIndex, pvpTopics.length);
      const toScale = getInitialScale(index, currentTopicIndex, pvpTopics.length);
      const toOpacity = getInitialOpacity(index, currentTopicIndex, pvpTopics.length);

      return Animated.parallel([
        Animated.spring(anim.translateX, {
          toValue: toTranslateX,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(anim.scale, {
          toValue: toScale,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(anim.opacity, {
          toValue: toOpacity,
          duration: 280,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animatedSet).start();
  }, [animations, currentTopicIndex, pvpTopics.length]);

  // --- New Floating Animation Effect ---
  useEffect(() => {
    // Define the floating animation loop
    const startFloating = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -gameScale(8), // Float up by 8 units
            duration: 1500,         // Over 1.5 seconds
            easing: Easing.inOut(Easing.sin), // Smooth sine easing
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,             
            duration: 1500,      
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startFloating();

    // Clean up animation on unmount
    return () => floatAnim.stopAnimation();
  }, [floatAnim]);


  const topicCards = useMemo(() => {
    if (!pvpTopics.length || !animations.length) return [];

    return pvpTopics.map((topic, index) => ({
      topic,
      index,
      image: TOPIC_IMAGES[topic] || TOPIC_IMAGES.HTML,
      animation: animations[index],
    }));
  }, [animations, pvpTopics]);

  return (
    <View style={styles.contentWrap}>
      {loadingPreview ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#BFE2FF" size="small" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      ) : (
        <>
          <View style={styles.carouselContainer} pointerEvents="box-none">
            {topicCards.map(({ topic, index, image, animation }) => (
              <Animated.View
                key={`pvp-topic-${topic}`}
                style={[
                  styles.topicCardWrap,
                  {
                    opacity: animation?.opacity || 0,
                    zIndex: index === currentTopicIndex ? 10 : 1,
                    transform: [
                      { translateX: animation?.translateX || 0 },
                      // Add the floating animation to translateY for the active card only
                      { translateY: index === currentTopicIndex ? floatAnim : 0 },
                      { scale: animation?.scale || 0.2 },
                    ],
                  },
                ]}
                pointerEvents={index === currentTopicIndex ? 'auto' : 'none'}
              >
                <TouchableOpacity
                  style={styles.topicCard}
                  activeOpacity={0.9}
                  onPress={onToggleMatch}
                  disabled={isActionDisabled}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.topicImageFull}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <View style={styles.levelSelector}>
            <TouchableOpacity
              style={styles.navArrow}
              onPress={onPreviousTopic}
              activeOpacity={0.85}
              disabled={isActionDisabled}
            >
              <Image source={ARROW_IMAGE} style={[styles.arrowImage, styles.flippedHorizontal]} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onToggleMatch} activeOpacity={0.8}>
              <ImageBackground
                source={LEVEL_SELECTOR_IMAGES[currentTopic || 'HTML']}
                style={styles.levelSelectorImage}
                resizeMode="contain"
              >
                <View style={styles.currentLevel}>
                  <Text style={styles.currentLevelText} numberOfLines={1} adjustsFontSizeToFit>
                    {primaryButtonLabel}
                  </Text>
                  {findingMatch ? (
                    <Text style={styles.matchmakingTimerText}>{matchmakingTimerLabel}</Text>
                  ) : null}
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navArrow}
              onPress={onNextTopic}
              activeOpacity={0.85}
              disabled={isActionDisabled}
            >
              <Image source={ARROW_IMAGE} style={styles.arrowImage} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {pvpError ? <Text style={styles.errorText}>{pvpError}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: gameScale(14),
    paddingBottom: gameScale(30),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gameScale(8),
    paddingVertical: gameScale(16),
  },
  loadingText: {
    color: '#DCEEFF',
    fontSize: gameScale(13),
    fontFamily: 'DynaPuff',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: gameScale(20),
  },
  levelSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: gameScale(20),
    marginTop: gameScale(-54),
    marginBottom: gameScale(12),
  },
  navArrow: {
    padding: gameScale(10),
  },
  arrowImage: {
    width: gameScale(120),
    height: gameScale(120),
    resizeMode: 'contain',
    marginHorizontal: gameScale(-20),
  },
  flippedHorizontal: {
    transform: [{ scaleX: -1 }],
  },
  carouselContainer: {
    width: gameScale(250),
    height: gameScale(280),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  levelSelectorImage: {
    width: gameScale(150),
    height: gameScale(150),
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLevel: {
    paddingHorizontal: gameScale(30),
    paddingVertical: gameScale(10),
    marginHorizontal: gameScale(20),
    width: gameScale(150),
  },
  currentLevelText: {
    color: '#fff',
    fontSize: gameScale(26),
    textAlign: 'center',
    fontFamily: 'FunkySign',
  },
  matchmakingTimerText: {
    color: '#DFF2FF',
    fontSize: gameScale(14),
    textAlign: 'center',
    marginTop: gameScale(-8),
    fontFamily: 'DynaPuff'
  },
  topicCardWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCard: {
    width: gameScale(190),
    height: gameScale(240),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicImageFull: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#FFB6B6',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(8),
    textAlign: 'center',
  },
});

export default PvpSelectionContent;