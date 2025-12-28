import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Dimensions,
  Easing,
  Pressable,
  Image
} from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const { width } = Dimensions.get('window');

const TickItem = ({ amount = 1, index = 0, animated = true, isBonusRound = false, position = 'right' }) => {
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
     {isBonusRound ? (
        <View style={styles.coinContainer}>
          <Text style={styles.coinText}>+{amount}</Text>
          <Image source={require('./Image/coin.png')} style={styles.coinImage} />
        </View>
      ) : (
        <Text style={[
          styles.tickText,
          { color: 'rgba(174, 7, 7, 0.77)' }  // Removed bonus color since it's now handled by image
        ]}>
          -{amount}
        </Text>
      )}
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
  isBonusRound = false,
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
          isBonusRound={isBonusRound}
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
  isBonusRound = false,
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
          isBonusRound={isBonusRound}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    position: 'absolute',
    top: gameScale(59),
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  leftContainer: {
    left: gameScale(39),
    alignItems: 'flex-start',
    zIndex: 9999,
    elevation: 9999,
  },
  rightContainer: {
    right: gameScale(39),
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  badge: {
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(6),
    borderRadius: gameScale(10),
    alignItems: 'center',
    minWidth: gameScale(64),
  },
  label: {
    fontSize: gameScale(10),
    color: '#fff',
    opacity: 0.85,
  },
  value: {
    fontSize: gameScale(16),
    fontWeight: '700',
    color: '#ff0000ff',
    marginTop: gameScale(2),
  },
  ticksContainer: {
    position: 'absolute',
    width: gameScale(150), 
    height: gameScale(150), 
    pointerEvents: 'none',
    zIndex: 9999,
    elevation: 9999,
  },
  ticksContainerRight: {
    top: gameScale(20),
    right: gameScale(-39),
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  ticksContainerLeft: {
    top: gameScale(20),
    left: gameScale(-39), 
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  tick: {
    position: 'absolute',
    top: gameScale(75),
    left: gameScale(75), 
    paddingHorizontal: gameScale(4),
    paddingVertical: gameScale(2),
    zIndex: 9999,
    elevation: 9999,
  },
  tickText: {
    fontSize: gameScale(9),
    fontFamily: 'DynaPuff',
    color: '#fe3232f8', 
    elevation: 9999,
  },
    coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImage: {
    width: gameScale(12),
    height: gameScale(12),
    marginRight: gameScale(2),
  },
  coinText: {
    fontSize: gameScale(9),
    fontFamily: 'DynaPuff',
    color: 'rgba(218, 200, 0, 0.88)',  // Gold color for bonus text
  },
});