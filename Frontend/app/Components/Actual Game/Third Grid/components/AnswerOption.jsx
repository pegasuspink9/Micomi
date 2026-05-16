import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { scale, scaleHeight, RESPONSIVE, wp } from '../../../Responsiveness/gameResponsive';
import { soundManager } from '../../Sounds/UniversalSoundManager';

const borderColors = {
  outerBg: '#FFB300',
  outerBorderTop: '#FFB300',
  outerBorderBottom: '#FFB300',
  middleBg: '#FFB300',
  middleBorderTop: '#01547dff',
  middleBorderBottom: '#0a1929',
  innerBg: 'rgba(74, 144, 217, 0.15)',
  innerBorder: 'rgba(74, 144, 217, 0.3)',
};

const selectedBorderColors = {
  outerBg: '#2d2d30',
  outerBorderTop: '#1a1a1c',
  outerBorderBottom: '#454549',
  middleBg: '#222225',
  middleBorderTop: '#555559',
  middleBorderBottom: 'rgba(36, 155, 161, 0.15)',
  innerBg: 'rgba(36, 155, 161, 0.15)',
  innerBorder: 'rgba(36, 155, 161, 0.15)',
};

const disabledBorderColors = {
  outerBg: '#6b6b6e',
  outerBorderTop: '#4a4a4c',
  outerBorderBottom: '#8e8e91',
  middleBg: '#5a5a5d',
  middleBorderTop: '#9e9ea1',
  middleBorderBottom: '#3a3a3c',
  innerBg: 'rgba(158, 158, 161, 0.15)',
  innerBorder: 'rgba(158, 158, 161, 0.3)',
};

const specialAttackBorderColors = {
  outerBg: '#3a3a3a', // Darker gray
  outerBorderTop: '#2a2a2a',
  outerBorderBottom: '#4a4a4a',
  middleBg: '#444444', // Solid gray
  middleBorderTop: '#555555',
  middleBorderBottom: '#2a2a2a',
  innerBg: 'rgba(60, 60, 60, 0.8)', // Much more opaque gray
  innerBorder: 'rgba(100, 100, 100, 0.5)',
};

const AnswerOption = ({ item, index, isSelected, isDisabled, onPress, customStyles = null, isSpecialAttack = false, enemyName = null, themeColor = null }) => {
  const resolvedThemeColor = themeColor || borderColors.outerBg;
  const baseBorderColors = React.useMemo(() => ({
    ...borderColors,
    outerBg: resolvedThemeColor,
    outerBorderTop: resolvedThemeColor,
    outerBorderBottom: resolvedThemeColor,
    middleBg: resolvedThemeColor,
  }), [resolvedThemeColor]);

  const specialAttackColors = React.useMemo(() => {
    if (!isSpecialAttack) {
      return null;
    }

    if (enemyName === 'Boss Joshy') {
      return {
        outerBg: '#3a3a3a',
        outerBorderTop: '#2a2a2a',
        outerBorderBottom: '#4a4a4a',
        middleBg: '#444444',
        middleBorderTop: '#555555',
        middleBorderBottom: '#2a2a2a',
        innerBg: 'rgba(60, 60, 60, 0.8)',
        innerBorder: 'rgba(100, 100, 100, 0.5)',
      };
    }

    if (enemyName === 'Boss Antcool') {
      return {
        outerBg: '#224f25',
        outerBorderTop: '#1c3f1e',
        outerBorderBottom: '#2f6b32',
        middleBg: '#2f6b32',
        middleBorderTop: '#3c7f40',
        middleBorderBottom: '#18361a',
        innerBg: 'rgba(33, 82, 35, 0.82)',
        innerBorder: 'rgba(90, 150, 95, 0.55)',
      };
    }

    if (enemyName === 'King Grimnir') {
      return {
        outerBg: '#3b0b0b',
        outerBorderTop: '#5a0e0e',
        outerBorderBottom: '#260606',
        middleBg: '#2a0707',
        middleBorderTop: '#5c1a1a',
        middleBorderBottom: '#120303',
        innerBg: 'rgba(68, 0, 0, 0.85)',
        innerBorder: 'rgba(120, 20, 20, 0.5)',
      };
    }

    if (enemyName === 'Boss Darco') {
      return {
        outerBg: '#0b0b0b',
        outerBorderTop: '#1a1a1a',
        outerBorderBottom: '#030303',
        middleBg: '#040404',
        middleBorderTop: '#2b2b2b',
        middleBorderBottom: '#000000',
        innerBg: 'rgba(10, 10, 10, 0.9)',
        innerBorder: 'rgba(60, 60, 60, 0.6)',
      };
    }

    if (enemyName === 'Boss Maggmaw') {
      return {
        outerBg: '#2a0000',
        outerBorderTop: '#4b0000',
        outerBorderBottom: '#120000',
        middleBg: '#160000',
        middleBorderTop: '#3d0000',
        middleBorderBottom: '#0b0000',
        innerBg: 'rgba(22, 0, 0, 0.9)',
        innerBorder: 'rgba(61, 0, 0, 0.6)',
      };
    }

    if (enemyName === 'Boss Pyroformic') {
      return {
        outerBg: '#3a1c00',
        outerBorderTop: '#5a2b00',
        outerBorderBottom: '#1b0b00',
        middleBg: '#1f0b00',
        middleBorderTop: '#4e2600',
        middleBorderBottom: '#0c0400',
        innerBg: 'rgba(31, 11, 0, 0.9)',
        innerBorder: 'rgba(78, 38, 0, 0.6)',
      };
    }

    if (enemyName === 'King San Pydero') {
      return {
        outerBg: '#3b2518',
        outerBorderTop: '#664337',
        outerBorderBottom: '#2c1a0f',
        middleBg: '#2a160e',
        middleBorderTop: '#5b3b2a',
        middleBorderBottom: '#130a06',
        innerBg: 'rgba(42, 22, 14, 0.9)',
        innerBorder: 'rgba(91, 59, 42, 0.55)',
      };
    }

    if (enemyName === 'Boss Scorcharach') {
      return {
        outerBg: '#4a1400',
        outerBorderTop: '#7a2000',
        outerBorderBottom: '#2a0f00',
        middleBg: '#2e1000',
        middleBorderTop: '#6b2a0b',
        middleBorderBottom: '#170700',
        innerBg: 'rgba(46, 16, 0, 0.9)',
        innerBorder: 'rgba(107, 42, 11, 0.55)',
      };
    }

    if (enemyName === 'Boss Icycreamero') {
      return {
        outerBg: '#0b5f8a',
        outerBorderTop: '#1280a9',
        outerBorderBottom: '#063b54',
        middleBg: '#083a50',
        middleBorderTop: '#4ea9d6',
        middleBorderBottom: '#021924',
        innerBg: 'rgba(8, 58, 80, 0.9)',
        innerBorder: 'rgba(78, 169, 214, 0.45)',
      };
    }

    if (enemyName === 'Boss Scythe') {
      return {
        outerBg: '#00163a',
        outerBorderTop: '#00285d',
        outerBorderBottom: '#000b20',
        middleBg: '#000f2a',
        middleBorderTop: '#003366',
        middleBorderBottom: '#00060f',
        innerBg: 'rgba(0, 15, 42, 0.95)',
        innerBorder: 'rgba(0, 51, 102, 0.45)',
      };
    }

    if (enemyName === 'Boss Bebeetle') {
      return {
        outerBg: '#2a0036',
        outerBorderTop: '#4c005e',
        outerBorderBottom: '#15001f',
        middleBg: '#18001f',
        middleBorderTop: '#5a1a6f',
        middleBorderBottom: '#0b0010',
        innerBg: 'rgba(24, 0, 31, 0.9)',
        innerBorder: 'rgba(90, 26, 111, 0.55)',
      };
    }

    if (enemyName === 'King Feanaly') {
      return {
        outerBg: '#071522',
        outerBorderTop: '#0f2a44',
        outerBorderBottom: '#02080d',
        middleBg: '#04101a',
        middleBorderTop: '#16314a',
        middleBorderBottom: '#000609',
        innerBg: 'rgba(4, 16, 26, 0.95)',
        innerBorder: 'rgba(22, 49, 74, 0.5)',
      };
    }

    return {
      ...specialAttackBorderColors,
      outerBg: '#3a2a1f',
      outerBorderTop: '#2a1e16',
      outerBorderBottom: '#4a3327',
      middleBg: '#3b2a1f',
      middleBorderTop: '#5b4434',
      middleBorderBottom: '#24170f',
      innerBg: 'rgba(42, 28, 20, 0.88)',
      innerBorder: 'rgba(112, 82, 58, 0.5)',
    };
  }, [enemyName, isSpecialAttack]);

  const colors = specialAttackColors || (isDisabled ? disabledBorderColors : (isSelected ? selectedBorderColors : baseBorderColors));

  // useMemo for container style to prevent unnecessary object creation
  const dynamicBorderStyles = React.useMemo(() => ({
    backgroundColor: colors.outerBg,
    borderTopColor: colors.outerBorderTop,
    borderLeftColor: colors.outerBorderTop,
    borderBottomColor: colors.outerBorderBottom,
    borderRightColor: colors.outerBorderBottom,
  }), [colors]);

  const handlePress = React.useCallback(() => {
    if (isDisabled) {
      return;
    }

    soundManager.playButtonTapSound();
    onPress(index);
  }, [index, isDisabled, onPress]);

  return (
    <View style={[styles.container, customStyles?.container]}>
      {/* 3-Layer Border - Outer */}
      <View style={[
        styles.borderOuter,
        dynamicBorderStyles,
        isSelected && styles.borderOuterSelected, 
        customStyles?.buttonFrame
      ]}>
        {/* 3-Layer Border - Middle */}
        <View style={[
          styles.borderMiddle,
          {
            backgroundColor: colors.middleBg,
            borderTopColor: colors.middleBorderTop,
            borderLeftColor: colors.middleBorderTop,
            borderBottomColor: colors.middleBorderBottom,
            borderRightColor: colors.middleBorderBottom,
          }
        ]}>
          {/* 3-Layer Border - Inner (Pressable) */}
           <Pressable 
            style={({ pressed }) => [
              styles.borderInner,
              {
                backgroundColor: colors.innerBg,
                borderColor: colors.innerBorder,
              },
              pressed && !isDisabled && styles.listItemPressed,
              customStyles?.listItemContainer
            ]}
            onPress={handlePress}
            disabled={isDisabled}
          >
            <View style={[
              styles.innerButton,
              isDisabled && !isSpecialAttack && styles.innerButtonDisabled,
              customStyles?.innerButton
            ]}>
              <View style={[styles.buttonHighlight, customStyles?.buttonHighlight]} />
              <View style={[styles.buttonShadow, customStyles?.buttonShadow]} />
              
              <Text style={[
                 styles.listItemText,
                isDisabled && styles.listItemTextDisabled,
                isSpecialAttack && styles.listItemTextSpecialAttack, 
                customStyles?.listItemText
              ]}>
                {item}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: RESPONSIVE.margin.xs,
    minWidth: wp(20),
    maxWidth: '100%', 
  },

  borderOuter: {
    borderRadius: scale(10),
    borderWidth: scale(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 4,
  },
  borderMiddle: {
    borderRadius: scale(10),
    borderWidth: scale(1),
  },
  borderInner: {
    borderRadius: scale(8),
    borderWidth: scale(1),
    overflow: 'hidden',
  },
  borderOuterSelected: {
    transform: [{ translateY: scale(0.6) }],
  },
  listItemPressed: {
    transform: [{ translateY: scale(1) }],
    borderTopColor: 'rgba(0, 0, 0, 0.3)',
    borderLeftColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  innerButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RESPONSIVE.borderRadius.xs,
    paddingVertical: RESPONSIVE.margin.xs,
    paddingHorizontal: RESPONSIVE.margin.sm, // Increased slightly for text breathing room
    backgroundColor: 'transparent',
  },
  innerButtonDisabled: {
    backgroundColor: 'rgba(176, 176, 176, 0.5)',
  },
  buttonHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: RESPONSIVE.borderRadius.xs,
    borderTopRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },
  buttonShadow: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)', 
    borderBottomLeftRadius: RESPONSIVE.borderRadius.xs,
    borderBottomRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },
  listItemText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ffffff', 
    textAlign: 'center',
    fontFamily: 'DynaPuff', 
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    zIndex: 1,
    // CRITICAL FIXES FOR LONG TEXT:
    flexShrink: 1,  // Allows text to shrink
    flexWrap: 'wrap', // Forces wrapping
  },
  listItemTextDisabled: {
    color: '#f2f2f7',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default React.memo(AnswerOption, (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.isSpecialAttack === nextProps.isSpecialAttack &&
    prevProps.enemyName === nextProps.enemyName &&
    prevProps.themeColor === nextProps.themeColor
  );
});