import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

//  Base design dimensions (iPhone 12/13 as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

//  Calculate scale ratios
const widthRatio = width / BASE_WIDTH;
const heightRatio = height / BASE_HEIGHT;
const minRatio = Math.min(widthRatio, heightRatio);

//  Universal scaling function - maintains aspect ratio
export const scale = (size) => {
  const newSize = size * minRatio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

//  Width-based scaling
export const scaleWidth = (size) => {
  const newSize = (size / BASE_WIDTH) * width;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

//  Height-based scaling
export const scaleHeight = (size) => {
  const newSize = (size / BASE_HEIGHT) * height;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

//  Font scaling (slightly different for better readability)
export const scaleFont = (size) => {
  const newSize = size * widthRatio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

//  Percentage-based functions
export const wp = (percentage) => {
  return scaleWidth((percentage * BASE_WIDTH) / 100);
};

export const hp = (percentage) => {
  return scaleHeight((percentage * BASE_HEIGHT) / 100);
};

//  FIXED Device type detection
export const getDeviceType = () => {
  console.log(`📱 Device detection: width=${width}, height=${height}, ratio=${width/height}`);
  
  // Check by width (more reliable than pixel ratio)
  if (width >= 768) {
    console.log('📱 Detected: tablet');
    return 'tablet';
  } else if (width >= 414) {
    console.log('📱 Detected: large-phone');
    return 'large-phone';
  } else if (width <= 320) {
    console.log('📱 Detected: small-phone');
    return 'small-phone';
  } else {
    console.log('📱 Detected: phone');
    return 'phone';
  }
};

//  Screen information
export const SCREEN = {
  width,
  height,
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  widthRatio,
  heightRatio,
  scaleRatio: minRatio,
  deviceType: getDeviceType(),
};

//  Common responsive values
export const RESPONSIVE = {
  // Common margins and paddings
  margin: {
    xs: scale(4),
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(20),
    xxl: scale(24),
  },
  
  // Common border radius
  borderRadius: {
    xs: scale(4),
    sm: scale(6),
    md: scale(8),
    lg: scale(12),
    xl: scale(16),
    round: scale(50),
  },
  
  // Common font sizes
  fontSize: {
    xs: scaleFont(10),
    sm: scaleFont(12),
    md: scaleFont(14),
    lg: scaleFont(16),
    xl: scale(18),
    xxl: scaleFont(20),
    title: scaleFont(24),
    header: scaleFont(28),
  },
  
  // Common icon sizes
  iconSize: {
    xs: scale(16),
    sm: scale(20),
    md: scale(24),
    lg: scale(28),
    xl: scale(32),
    xxl: scale(40),
  },
  
  // Common shadow values
  shadow: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.1,
      shadowRadius: scale(4),
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.2,
      shadowRadius: scale(8),
      elevation: 4,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(8) },
      shadowOpacity: 0.3,
      shadowRadius: scale(12),
      elevation: 8,
    },
  },
};

//  Responsive layout helpers
export const layoutHelpers = {
  // Game-specific layout ratios
  screenPlayHeight: hp(35), // 35% of screen height
  gameQuestionsHeight: hp(40), // 40% of screen height  
  thirdGridHeight: hp(18), // 18% of screen height
  
  // Avatar sizes
  avatarSmall: scale(32),
  avatarMedium: scale(48),
  avatarLarge: scale(64),
  
  // Health bar dimensions
  healthBarHeight: scale(20),
  healthBarMinWidth: scale(100),
  
  // Button dimensions
  buttonHeight: scale(44),
  buttonMinWidth: scale(80),
  
  // Common gaps
  gap: {
    xs: scale(2),
    sm: scale(4),
    md: scale(8),
    lg: scale(12),
    xl: scale(16),
  },
};

export default {
  scale,
  scaleWidth,
  scaleHeight,
  scaleFont,
  wp,
  hp,
  getDeviceType,
  SCREEN,
  RESPONSIVE,
  layoutHelpers,
};