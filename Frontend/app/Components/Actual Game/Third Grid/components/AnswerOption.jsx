import React from 'react';
import { Pressable, Text, StyleSheet, Dimensions, View } from 'react-native';
import { scale, scaleWidth, scaleHeight, RESPONSIVE, wp, hp } from '../../../Responsiveness/gameResponsive';
import { soundManager } from '../../Sounds/UniversalSoundManager';

// 3-Layer border colors - Blue theme matching Life component
const borderColors = {
  outerBg: '#01547dff',
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


const AnswerOption = ({ 
  item, 
  index, 
  isSelected, 
  isDisabled, 
  onPress,
  customStyles = null
}) => {
  const colors = isDisabled ? disabledBorderColors : (isSelected ? selectedBorderColors : borderColors);

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
        isSelected && styles.borderOuterSelected, // Apply selected transform here
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
              isDisabled && styles.innerButtonDisabled,
              customStyles?.innerButton
            ]}>
              <View style={[
                styles.buttonHighlight,
                customStyles?.buttonHighlight
              ]} />
              <View style={[
                styles.buttonShadow,
                customStyles?.buttonShadow
              ]} />
              <Text style={[
                styles.listItemText,
                isDisabled && styles.listItemTextDisabled,
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
    marginTop: RESPONSIVE.margin.xs + scaleHeight(2),
    minWidth: wp(20),
  },

  // 3-Layer Border styles
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
    // Invert border colors for pushed-in effect
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
    paddingHorizontal: RESPONSIVE.margin.xs,
    backgroundColor: 'transparent', // Make inner button transparent to see border background
  },

  innerButtonDisabled: {
    backgroundColor: 'rgba(176, 176, 176, 0.5)',
  },

  buttonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: RESPONSIVE.borderRadius.xs,
    borderTopRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },

  buttonShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
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
    prevProps.onPress === nextProps.onPress
  );
});