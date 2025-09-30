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
  tickInterval = 200,
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
    const tickObjs = ticks.map(amount => ({
      id: `${Date.now()}-${nextId.current++}`,
      amount,
    }));

    setActiveTicks(prev => [...prev, ...tickObjs]);

    tickObjs.forEach((tick, idx) => {
      const startDelayForTick = idx * tickInterval;
      const t = setTimeout(() => {
        const totalAnimMs = 600;
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
      {activeTicks.map((tickObj, index) => (
        <TickItem
          key={tickObj.id}
          amount={tickObj.amount}
          index={index}
          animated={animated}
        />
      ))}
    </View>
  );
};

const TickItem = ({ amount = 1, index = 0, animated = true }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => {}, 300);
      return () => clearTimeout(t);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100 - Math.min(12 * index, 40),
        duration: 5000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 5000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 5000,
          easing: Easing.out(Easing.quad),
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
          transform: [{ translateY }, { scale }],
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

  ticksContainer: {
    position: 'absolute',
    width: 40,
    pointerEvents: 'none',
  },
  ticksContainerRight: {
    top: width * 0.139,
    right: width * -0.02,
    alignItems: 'flex-start',
  },
  ticksContainerLeft: {
    top: width * 0.150,
    right: width * -0.1,
    alignItems: 'flex-end',
  },

  tick: {
    position: 'relative',
    marginVertical: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  
  tickText: {
    fontSize: 12,
    fontFamily: 'DynaPuff',
    color: '#ff0000ff',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
