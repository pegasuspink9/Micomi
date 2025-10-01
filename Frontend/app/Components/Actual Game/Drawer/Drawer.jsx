import React, { useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions, PanResponder, Animated } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import OutputBefore from '../Output/OutputBefore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_PEEK = SCREEN_HEIGHT * 0.05;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7;
const SNAP_THRESHOLD = SCREEN_HEIGHT * 0.1;
const VELOCITY_THRESHOLD = 0.9;

export default function Drawer({
  isOutputVisible,
  translateY,
  backdropOpacity,    
  animateToPosition,
  currentQuestion,
  currentQuestionIndex,
  questionsData,
  selectedAnswers
}) {

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        backdropOpacity.stopAnimation();
      },
      
      onPanResponderMove: (_, gestureState) => {
        const startY = isOutputVisible ? 0 : DRAWER_HEIGHT - DRAWER_PEEK;
        const newY = Math.max(0, Math.min(DRAWER_HEIGHT - DRAWER_PEEK, startY + gestureState.dy));
        
        translateY.setValue(newY);
        backdropOpacity.setValue((1 - newY / (DRAWER_HEIGHT - DRAWER_PEEK)) * 0.5);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        
        const shouldOpen = Math.abs(vy) > VELOCITY_THRESHOLD 
          ? vy < 0
          : isOutputVisible ? dy < SNAP_THRESHOLD : dy < -SNAP_THRESHOLD;
        
        animateToPosition(shouldOpen);
      },
    })
  ).current;

  return (
    <>
      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: isOutputVisible ? 'auto' : 'none',
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          onPress={() => animateToPosition(false)}
          activeOpacity={1}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.drawer,
          { transform: [{ translateY }] }
        ]}
      >
        <View 
          style={styles.peekArea}
          {...panResponder.panHandlers}
        >
          <View style={styles.arrowContainer}>
            <FontAwesome 
              name={isOutputVisible ? "arrow-down" : "arrow-up"} 
              size={10} 
              color="white" 
            />
          </View>
          <Text style={{ color: 'white', fontSize: 9 }}>
            {isOutputVisible ? "Hide" : "Output"}
          </Text>
        </View>

        <OutputBefore
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          questionsData={questionsData}
          selectedAnswers={selectedAnswers}
          animateToPosition={animateToPosition}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
  },
  
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: SCREEN_WIDTH * 0.05,
    borderTopRightRadius: SCREEN_WIDTH * 0.05,
    zIndex: 2,
  },
  
  arrowContainer: {
    padding: SCREEN_WIDTH * 0.015,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: SCREEN_WIDTH * 0.02,
    minWidth: SCREEN_WIDTH * 0.1,
    minHeight: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  peekArea: {
    height: DRAWER_PEEK, 
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: SCREEN_WIDTH * 0.05,
    borderTopRightRadius: SCREEN_WIDTH * 0.05,
  },
});