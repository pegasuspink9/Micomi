import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Dimensions,
  Easing,
  Pressable,
} from 'react-native';

const { width } = Dimensions.get('window');

const FloatingDamageTicks = ({
  damage = 0,
  steps = 2,
  animated = true,
  tickInterval = 50, // Faster intervals
  startDelay = 0,
  onTick = null,
  position = 'right', 
  trigger = 0,
}) => {
  const [activeTicks, setActiveTicks] = useState([]);
  const nextId = useRef(0);
  const timers = useRef([]);

  function splitDamage(total, count) {
    if (!Number.isFinite(total) || total <= 0) return [];
    const safeCount = Math.max(1, Math.floor(count) || 1);
    if (total <= safeCount) {
      return Array.from({ length: total }).map(() => 1);
    }
    const base = Math.floor(total / safeCount);
    let rem = total - base * safeCount;
    const arr = [];
    for (let i = 0; i < safeCount; i++) {
      arr.push(base + (rem > 0 ? 1 : 0));
      if (rem > 0) rem--;
    }
    return arr;
  }

  useEffect(() => {
    if (!damage || damage <= 0) return;

    // clear previous timers (avoid overlap)
    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];

    // Start the sequence after the provided startDelay
    const startTimer = setTimeout(() => {
      const ticks = splitDamage(Math.round(damage), steps);
      const tickObjs = ticks.map((amount, index) => ({
        id: `${Date.now()}-${nextId.current++}`,
        amount,
        index, // Pass index for scatter calculation
      }));

      setActiveTicks(prev => [...prev, ...tickObjs]);

      tickObjs.forEach((tick, idx) => {
        const randomDelay = Math.random() * 100;
        const startDelayForTick = idx * tickInterval + randomDelay;
        
        const t = setTimeout(() => {
          const totalAnimMs = 1200 + Math.random() * 300; 
          const endTimer = setTimeout(() => {
            setActiveTicks(curr => curr.filter(x => x.id !== tick.id));
            if (typeof onTick === 'function') {
              try {
                onTick(tick.amount);
              } catch (e) {
                console.warn('onTick callback error', e);
              }
            }
          }, totalAnimMs);

          timers.current.push(endTimer);
        }, startDelayForTick);

        timers.current.push(t);
      });
    }, startDelay);

    timers.current.push(startTimer);

    return () => {
      timers.current.forEach(t => clearTimeout(t));
      timers.current = [];
    };
  }, [damage, startDelay, trigger]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ticksContainer,
        position === 'left' ? styles.ticksContainerLeft : styles.ticksContainerRight,
      ]}
    >
      {activeTicks.map((tickObj) => (
        <TickItem
          key={tickObj.id}
          amount={tickObj.amount}
          index={tickObj.index}
          animated={animated}
        />
      ))}
    </View>
  );
};

const TickItem = ({ amount = 1, index = 0, animated = true }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => {}, 300);
      return () => clearTimeout(t);
    }

    // Generate random scattered positions
    const randomAngle = Math.random() * 360; // Full 360-degree scatter
    const scatterDistance = 30 + Math.random() * 60; // 30-90px scatter radius
    
    // Calculate final scattered positions
    const finalX = Math.cos((randomAngle * Math.PI) / 180) * scatterDistance;
    const finalY = Math.sin((randomAngle * Math.PI) / 180) * scatterDistance;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: finalX,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      // Simple movement to scattered position
      Animated.timing(translateY, {
        toValue: finalY,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      // Simple fade out
      Animated.sequence([
        Animated.delay(400), // Stay visible for a bit
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      
      // Subtle scale effect
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.tick,
        {
          transform: [
            { translateX },
            { translateY },
            { scale }
          ],
          opacity,
        },
      ]}
    >
      <Text style={styles.tickText}>{`-${amount}`}</Text>
    </Animated.View>
  );
};

export default function Damage({
  totalDamage = 0,
  incoming = 0,
  startDelay = 0,
  onTotalChange = null,
  animated = true,
  position = 'right', 
  style = {},
  trigger = 0, 
}) {
  const prevTotalRef = useRef(totalDamage);

  useEffect(() => {
    if (typeof onTotalChange === 'function' && prevTotalRef.current !== totalDamage) {
      try {
        onTotalChange(totalDamage);
      } catch (e) {
        console.warn('onTotalChange error', e);
      }
    }
    prevTotalRef.current = totalDamage;
  }, [totalDamage, onTotalChange]);

  const containerPositionStyle = position === 'left' ? styles.leftContainer : styles.rightContainer;

  return (
    <View style={[styles.container, containerPositionStyle, style]}>
      {/* Floating ticks animate when `incoming` > 0 */}
      {incoming > 0 && (
        <FloatingDamageTicks
          damage={incoming}
          animated={animated}
          startDelay={startDelay}
          position={position}
          trigger={trigger}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    position: 'absolute',
    top: width * 0.15,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  leftContainer: {
    left: width * 0.1,
    alignItems: 'flex-start',
  },
  rightContainer: {
    right: width * 0.1,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 64,
  },
  label: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.85,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff4d4d',
    marginTop: 2,
  },

  // Container for scattered damage numbers
  ticksContainer: {
    position: 'absolute',
    width: 150, 
    height: 150, 
    pointerEvents: 'none',
  },
  ticksContainerRight: {
    top: width * 0.05,
    right: width * -0.1,
    alignItems: 'center',
  },
  ticksContainerLeft: {
    top: width * 0.05,
    left: width * -0.1, 
    alignItems: 'center',
  },

  tick: {
    position: 'absolute',
    top: 75,
    left: 75, 
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  
  tickText: {
    fontSize: 20,
    fontFamily: 'DynaPuff',
    color: 'rgba(174, 7, 7, 0.77)', 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});