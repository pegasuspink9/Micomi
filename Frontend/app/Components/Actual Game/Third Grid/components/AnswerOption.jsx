import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { scale, scaleHeight, RESPONSIVE, wp } from '../../../Responsiveness/gameResponsive';
import { soundManager } from '../../Sounds/UniversalSoundManager';

const borderColors = {
  outerBg: '#044160ff',
  outerBorderTop: '#0d1f33',
  outerBorderBottom: '#01547dff',
  middleBg: '#152d4a',
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

const AnswerOption = ({ item, index, isSelected, isDisabled, onPress, customStyles = null, isSpecialAttack = false }) => {
    console.log('isSpecialAttack:', isSpecialAttack); // Add this line to debug
  const colors = isSpecialAttack ? specialAttackBorderColors : (isDisabled ? disabledBorderColors : (isSelected ? selectedBorderColors : borderColors));

  return (
    <View style={[styles.container, customStyles?.container]}>
      {/* 3-Layer Border - Outer */}
      <View style={[
        styles.borderOuter,
        {
          backgroundColor: colors.outerBg,
          borderTopColor: colors.outerBorderTop,
          borderLeftColor: colors.outerBorderTop,
          borderBottomColor: colors.outerBorderBottom,
          borderRightColor: colors.outerBorderBottom,
        },
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
            onPress={() => {
              if (!isDisabled) {
                soundManager.playButtonTapSound();
                onPress(item);    
              }
            }}
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
    prevProps.isSpecialAttack === nextProps.isSpecialAttack 
  );
});