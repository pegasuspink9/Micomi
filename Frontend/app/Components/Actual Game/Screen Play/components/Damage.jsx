// components/Damage.jsx
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

/**
 * Floating damage ticks animation component
 * Props:
 *  - damage (number): the total damage to split & animate (e.g. 10)
 *  - steps (number): how many ticks to split into
 *  - animated (bool)
 *  - tickInterval (ms)
 *  - onTick (fn)
 */
const FloatingDamageTicks = ({
  damage = 0,
  steps = 5,
  animated = true,
  tickInterval = 140,
  onTick = null,
}) => {
  const [activeTicks, setActiveTicks] = useState([]); // array of {id, amount}
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

    const ticks = splitDamage(Math.round(damage), steps);
    const tickObjs = ticks.map(amount => ({
      id: `${Date.now()}-${nextId.current++}`,
      amount,
    }));

    setActiveTicks(prev => [...prev, ...tickObjs]);

    tickObjs.forEach((tick, idx) => {
      const startDelay = idx * tickInterval;
      const t = setTimeout(() => {
        const totalAnimMs = 600; // must match TickItem animation length
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
      }, startDelay);

      timers.current.push(t);
    });

    return () => {
      timers.current.forEach(t => clearTimeout(t));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damage]);

  return (
    <View pointerEvents="none" style={styles.ticksContainer}>
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
        toValue: -36 - Math.min(12 * index, 40),
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

/**
 * Damage display component (default export)
 *
 * Props:
 *  - totalDamage (number): the total damage counter to display (like coin total)
 *  - incoming (number): damage just received (this is what triggers the floating ticks)
 *  - onTotalChange (fn): called when displayed totalDamage changes
 *  - animated (bool)
 *  - style (object) override for container
 */
export default function Damage({
  totalDamage = 0,
  incoming = 0,
  onTotalChange = null,
  animated = true,
  style = {},
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

  return (
    <View style={[styles.container, style]}>
      <View style={styles.badge}>
        <Text style={styles.label}>Damage</Text>
        <Text style={styles.value}>{totalDamage}</Text>
      </View>

      {/* Floating ticks animate when `incoming` > 0 */}
      {incoming > 0 && (
        <FloatingDamageTicks damage={incoming} animated={animated} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: width * 0.18,
    right: width * 0.08,
    alignItems: 'center',
    pointerEvents: 'box-none',
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
    top: -36,
    left: 6,
    width: 80,
    alignItems: 'flex-start',
    pointerEvents: 'none',
  },
  tick: {
    position: 'relative',
    marginVertical: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tickText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#ff4d4d',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
