
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg'; // Added SVG for Radial Gradient
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming
} from 'react-native-reanimated';
import { gameScale } from '../../Responsiveness/gameResponsive';
import { soundManager } from '../Sounds/UniversalSoundManager';

const DialogueOverlay = ({ visible, dialogueData, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Shared values for animations
  const slideAnim = useSharedValue(0); 
  const scaleAnim = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      slideAnim.value = withSpring(1);
      scaleAnim.value = withSpring(1);
    }
  }, [visible]);

  const currentScript = useMemo(() => {
    if (!dialogueData || !dialogueData.script || currentIndex >= dialogueData.script.length) {
      return null;
    }
    return dialogueData.script[currentIndex];
  }, [dialogueData, currentIndex]);

  const parsedContent = useMemo(() => {
    if (!currentScript) return null;

    const rawSpeaker = Object.keys(currentScript)[0];
    const rawText = currentScript[rawSpeaker];

    // Replace placeholders
    let speakerName = rawSpeaker;
    if (speakerName.includes('{enemy_name}')) speakerName = speakerName.replace(/{enemy_name}/g, dialogueData.enemy_name);
    if (speakerName.includes('{character_name}')) speakerName = speakerName.replace(/{character_name}/g, dialogueData.character_name);

    let text = rawText;
    if (text) {
      text = text.replace(/{enemy_name}/g, dialogueData.enemy_name);
      text = text.replace(/{character_name}/g, dialogueData.character_name);
    }

    const isMicomi = rawSpeaker === 'Micomi';
    const imageUri = isMicomi ? dialogueData.micomi_image : dialogueData.enemy_image;
    const alignment = isMicomi ? 'left' : 'right';

    return { speakerName, text, imageUri, alignment };
  }, [currentScript, dialogueData]);

  // Typing Effect Logic
  useEffect(() => {
    if (parsedContent?.text) {
      setDisplayedText('');
      setIsTyping(true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      let charIndex = 0;
      const fullText = parsedContent.text;

      const typeNextChar = () => {
        if (charIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, charIndex + 1));
          charIndex++;
          typingTimeoutRef.current = setTimeout(typeNextChar, 25); // Typing speed (ms)
        } else {
          setIsTyping(false);
        }
      };

      typeNextChar();
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [parsedContent]);

  const handlePress = () => {
    soundManager.playGameButtonTapSound();
    
    if (isTyping) {
      // Instant finish typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setDisplayedText(parsedContent.text);
      setIsTyping(false);
    } else {
      // Proceed to next
      if (currentIndex < dialogueData.script.length - 1) {
        scaleAnim.value = 0.98;
        scaleAnim.value = withSpring(1);
        setCurrentIndex(prev => prev + 1);
      } else {
        slideAnim.value = withTiming(0, { duration: 300 });
        onComplete();
      }
    }
  };

  if (!visible || !parsedContent) return null;

  const isLeft = parsedContent.alignment === 'left';
  
  // Dynamic Theme Colors
  const themeColor = isLeft ? '#4dabf7' : '#9c1515ff'; // Blue vs Red
  const themeDark = isLeft ? '#1e3a5f' : '#9c1515ff';   // Dark Blue vs Dark Red
  const gradientCenter = isLeft ? '#4dabf7' : '#ff4d4d'; // Bright Blue vs Bright Red
  const gradientEdge = isLeft ? '#0a1a2f' : '#4a0000';   // Deep Blue vs Deep Red

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={styles.backdrop} />

      <TouchableOpacity 
        style={styles.touchLayer} 
        activeOpacity={1} 
        onPress={handlePress}
      >
        <Animated.View style={[
          styles.dialogueRow, 
          isLeft ? styles.rowLeft : styles.rowRight,
          { opacity: slideAnim, transform: [{ scale: scaleAnim }] }
        ]}>
          
          {/* === 3D LAYERED IMAGE BOX === */}
          <View style={[
            styles.imageFrameOuter, 
            isLeft ? styles.skewLeft : styles.skewRight,
            { 
              backgroundColor: themeDark, 
              borderColor: themeColor 
            }
          ]}>
            <View style={[styles.imageFrameMiddle, { backgroundColor: themeColor }]}>
              <View style={styles.imageFrameInner}>
                {/* RADIAL GRADIENT BACKGROUND */}
                <View style={StyleSheet.absoluteFill}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <RadialGradient
                        id="grad"
                        cx="50%"
                        cy="100%"
                        rx="100%"
                        ry="50%"
                        fx="100%"
                        fy="50%"
                        gradientUnits="userSpaceOnUse"
                      >
                        <Stop offset="0%" stopColor={gradientCenter} stopOpacity="1" />
                        <Stop offset="100%" stopColor={gradientEdge} stopOpacity="1" />
                      </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
                  </Svg>
                </View>

                {/* Counter-skew image so it looks straight */}
                <View style={[
                  styles.imageWrapper,
                  isLeft ? styles.counterSkewLeft : styles.counterSkewRight
                ]}>
                  <Image 
                    source={{ uri: parsedContent.imageUri }} 
                    style={styles.characterImage}
                    contentFit="cover"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* === TURBO SCRIPT BOX === */}
          <View style={[
            styles.scriptBox, 
            isLeft ? styles.scriptBoxLeft : styles.scriptBoxRight,
            isLeft ? styles.skewLeft : styles.skewRight,
            { borderColor: themeColor }
          ]}>
            
            {/* Text Content (Counter-skewed) */}
            <View style={[
              styles.textWrapper,
              isLeft ? styles.counterSkewLeft : styles.counterSkewRight
            ]}>
              
              {/* Name Tag Header (Inside the box now) */}
               <View style={[
                styles.nameTagHeader,
                isLeft ? styles.nameTagHeaderLeft : styles.nameTagHeaderRight,
                !isLeft && { backgroundColor: '#a73f3fff', marginRight: gameScale(-15) } 
              ]}>
                <Text style={styles.nameText}>{parsedContent.speakerName}</Text>
              </View>

              <Text style={styles.dialogueText}>
                {displayedText}
                {isTyping && <Text style={{color: themeColor}}>|</Text>}
              </Text>
              
                 {!isTyping && (
                <Text style={[
                  styles.tapHint, 
                  { 
                    color: themeColor,
                    textAlign: isLeft ? 'right' : 'left' 
                  }
                ]}>
                  {isLeft ? 'Tap to continue ►' : '◄ Tap to continue'}
                </Text>
              )}
            </View>
          </View>

        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // ...existing code...
  overlayContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2000,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.69)',
  },
  touchLayer: {
    flex: 1,
    justifyContent: 'center',
  },
  dialogueRow: {
    flexDirection: 'row',
    alignItems: 'stretch', 
    paddingHorizontal: gameScale(2),
    marginBottom: gameScale(60),
    width: '100%',
    minHeight: gameScale(190), // Minimum height for the row
  },
  rowLeft: { flexDirection: 'row' },
  rowRight: { flexDirection: 'row-reverse' },

  // === SKEW TRANSFORMS ===
  skewLeft: { transform: [{ skewX: '-12deg' }] },
  skewRight: { transform: [{ skewX: '12deg' }] },
  counterSkewLeft: { transform: [{ skewX: '12deg' }] },
  counterSkewRight: { transform: [{ skewX: '-12deg' }] },

  // === 3D IMAGE FRAME ===
  imageFrameOuter: {
    width: gameScale(130),
    borderWidth: gameScale(1),
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 10,
    padding: gameScale(2), 
    borderRadius: gameScale(8),
  },
  imageFrameMiddle: {
    flex: 1,
    borderRadius: gameScale(8),
    width: '100%',
    padding: gameScale(2), 
  },
  imageFrameInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000', // Base color for gradient
    borderRadius: gameScale(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  characterImage: {
    width: '200%', 
    height: '200%',
    alignSelf: 'center',
    left: gameScale(-2),
    marginTop: gameScale(-70),
  },

  // === SCRIPT BOX ===
  scriptBox: {
    flex: 1,
    backgroundColor: '#f9f9f9ff',
    borderWidth: gameScale(3),
    borderRadius: gameScale(12), // Full radius
    padding: gameScale(15),
    paddingTop: gameScale(15),
    justifyContent: 'flex-start', // FIXED: Keeps header at the top
    shadowColor: '#c2c0c0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  scriptBoxLeft: {
    marginLeft: gameScale(-13), 
    borderLeftWidth: 0, 
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  scriptBoxRight: {
    marginRight: gameScale(-13), 
    borderRightWidth: 0, 
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  // === TEXT & LABELS ===
  textWrapper: {
    width: '100%',
  },
   nameTagHeader: {
    paddingHorizontal: gameScale(19),
    paddingVertical: gameScale(3),
    marginBottom: gameScale(20), 
    marginLeft: gameScale(-15),
    backgroundColor: '#4dabf7b1', 

  },

  nameTagHeaderLeft: {
    alignSelf: 'flex-start',
    borderBottomRightRadius: gameScale(10),
    borderTopRightRadius: gameScale(10),
  },
  nameTagHeaderRight: {
    alignSelf: 'flex-end',
    borderBottomLeftRadius: gameScale(10),
    borderTopLeftRadius: gameScale(10),
  },


  nameText: {
    color: '#000000ff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(20),
    lineHeight: gameScale(20),
    textTransform: 'uppercase'
  },
  dialogueText: {
    color: '#1e3a5f',
    left: gameScale(2),
    fontFamily: 'DynaPuff',
    fontSize: gameScale(16),
    lineHeight: gameScale(20),
    fontWeight: '600',
    marginBottom: gameScale(19), 
  },
  tapHint: {
    fontSize: gameScale(10),
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
});

export default DialogueOverlay