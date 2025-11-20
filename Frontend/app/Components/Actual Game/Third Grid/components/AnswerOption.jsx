import React from 'react';
import { Pressable, Text, StyleSheet, Dimensions, View } from 'react-native';
import { scale, scaleWidth, scaleHeight, RESPONSIVE, wp, hp } from '../../../Responsiveness/gameResponsive';

const AnswerOption = ({ 
  item, 
  index, 
  isSelected, 
  isDisabled, 
  onPress,
  customStyles = null
}) => {
  return (
    <View style={[
      styles.buttonFrame,
      isSelected && styles.buttonFrameSelected,
      customStyles?.buttonFrame
    ]}>
      <Pressable 
        style={({ pressed }) => [
          styles.listItemContainer,
          isSelected && styles.listItemSelected,
          isDisabled && styles.listItemDisabled,
          pressed && !isDisabled && styles.listItemPressed,
          customStyles?.listItemContainer
        ]}
        onPress={() => !isDisabled && onPress(item)}
        disabled={isDisabled}
      >
        <View style={[
          styles.innerButton,
          isSelected && styles.innerButtonSelected,
          isDisabled && styles.innerButtonDisabled,
          customStyles?.innerButton // NEW: Apply custom inner button styles
        ]}>
          <View style={[
            styles.buttonHighlight,
            customStyles?.buttonHighlight // NEW: Custom highlight
          ]} />
          <View style={[
            styles.buttonShadow,
            customStyles?.buttonShadow // NEW: Custom shadow
          ]} />
          <Text style={[
            styles.listItemText,
            isSelected && styles.listItemTextSelected,
            isDisabled && styles.listItemTextDisabled,
            customStyles?.listItemText // NEW: Custom text styles
          ]}>
            {item}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};



const styles = StyleSheet.create({
  buttonFrame: {
    marginTop: RESPONSIVE.margin.xs,
    backgroundColor: '#01547dff', 
    borderRadius: RESPONSIVE.borderRadius.sm, 
    borderTopWidth: scale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: scale(1),
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: scale(3),
    borderBottomColor: 'rgba(6, 98, 147, 0.4)',
    borderRightWidth: scale(2),
    borderRightColor: 'rgba(6, 98, 147, 0.4)',
  },



  listItemContainer: {
    width: wp(20),
    borderRadius: RESPONSIVE.borderRadius.sm, 
    position: 'relative',
    overflow: 'hidden',
    
    backgroundColor: '#4a90e2',
    
    borderTopWidth: scale(2),
    borderTopColor: '#93c5fd',
    borderLeftWidth: scale(2),
    borderLeftColor: '#93c5fd',
    borderBottomWidth: scale(3),
    borderBottomColor: '#1e3a8a',
    borderRightWidth: scale(3),
    borderRightColor: '#1e3a8a',
    
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    elevation: 10,
  },

  innerButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RESPONSIVE.borderRadius.xs,
    paddingVertical: RESPONSIVE.margin.xs,
    paddingHorizontal: RESPONSIVE.margin.xs,
    backgroundColor: '#014656ae',
    
    borderTopWidth: scale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: scale(1),
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: scale(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: scale(1),
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },

  innerButtonSelected: {
    backgroundColor: '#014656ae',
  },

  innerButtonDisabled: {
    backgroundColor: '#b0b0b0',
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

  listItemPressed: {
    transform: [{ translateY: scale(0.5) }],
    backgroundColor: '#0044b1ff', 
    borderTopWidth: scale(3),
    borderTopColor: '#1e3a8a',
    borderLeftWidth: scale(3),
    borderLeftColor: '#1e3a8a',
    borderBottomWidth: scale(1),
    borderBottomColor: '#93c5fd',
    borderRightWidth: scale(1),
    borderRightColor: '#93c5fd',
  },

  listItemSelected: {
     transform: [{ translateY: scale(0.6) }],
    backgroundColor: '#272b2fff', 
    borderTopWidth: scale(2),
    borderTopColor: '#1e3a8a',
    borderLeftWidth: scale(3),
    borderLeftColor: '#1e3a8a',
    borderBottomWidth: scale(2),
    borderBottomColor: '#1e3a8a',
    borderRightWidth: scale(1),
    borderRightColor: '#1e3a8a',
  },

  listItemDisabled: {
    opacity: 0.4,
    backgroundColor: '#8e8e93',
    borderTopColor: '#aeaeb2',
    borderLeftColor: '#aeaeb2',
    borderBottomColor: '#636366',
    borderRightColor: '#636366',
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

  listItemTextSelected: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(3),
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