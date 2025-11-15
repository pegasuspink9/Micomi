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

const TickItem = ({ amount = 1, index = 0, animated = true, position = 'right' }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => {}, 300);
      return () => clearTimeout(t);
    }

    const randomAngle = position === 'right' 
      ? 145 + Math.random() * 90
      : -40 + Math.random() * 90;
    
    const scatterDistance = 50 + Math.random() * 100;
    
    const finalX = Math.cos((randomAngle * Math.PI) / 180) * scatterDistance;
    const finalY = Math.sin((randomAngle * Math.PI) / 180) * scatterDistance;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: finalX,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      Animated.timing(translateY, {
        toValue: finalY,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [position]);

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

const FloatingDamageTicks = ({
  damage = 0,
  steps = 2,
  animated = true,
  tickInterval = 50,
  startDelay = 0,
  onTick = null,
  position = 'right', 
  trigger = 0,
}) => {
  const [activeTicks, setActiveTicks] = useState([]);
  const nextId = useRef(0);
  const timers = useRef([]);

  function splitDamageRandomly(total, minCount = 4) {
    if (!Number.isFinite(total) || total <= 0) return [];
    
    let count;
    if (total < 30) {
      count = 3;
    } else if (total < 100) {
      count = 5;
    } else {
      count = 7;
    }
    
    const amounts = [];
    let remaining = total;

    for (let i = 0; i < count - 1; i++) {
      const maxAmount = Math.floor(remaining / (count - i));
      const minAmount = Math.max(1, Math.floor(maxAmount * 0.4));
      const amount = minAmount + Math.floor(Math.random() * (maxAmount - minAmount + 1));
      amounts.push(amount);
      remaining -= amount;
    }
    
    amounts.push(remaining);
    
    return amounts.sort(() => Math.random() - 0.5);
  }

  useEffect(() => {
    if (!damage || damage <= 0) return;

    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];

    const startTimer = setTimeout(() => {
      const ticks = splitDamageRandomly(Math.round(damage), 4);
      const tickObjs = ticks.map((amount, index) => ({
        id: `${Date.now()}-${nextId.current++}`,
        amount,
        index,
      }));

      setActiveTicks(prev => [...prev, ...tickObjs]);

      tickObjs.forEach((tick, idx) => {
        const randomDelay = Math.random() * 100;
        const startDelayForTick = idx * tickInterval + randomDelay;
        
        const t = setTimeout(() => {
          const totalAnimMs = 2200 + Math.random() * 300;
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
          position={position}
        />
      ))}
    </View>
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
    zIndex: 9999,
    elevation: 9999,
  },
  rightContainer: {
    right: width * 0.1,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
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
    width: 150, 
    height: 150, 
    pointerEvents: 'none',
    zIndex: 9999,
    elevation: 9999,
  },
  ticksContainerRight: {
    top: width * 0.05,
    right: width * -0.1,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  ticksContainerLeft: {
    top: width * 0.05,
    left: width * -0.1, 
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },

  tick: {
    position: 'absolute',
    top: 75,
    left: 75, 
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 9999,
    elevation: 9999,
  },
  
  tickText: {
    fontSize: 10,
    fontFamily: 'DynaPuff',
    color: 'rgba(174, 7, 7, 0.77)', 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 9999,
    elevation: 9999,
  },
});