import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Static URLs for UI elements (not character-specific)
export const URLS = {
  background: "https://micomi-assets.me/Hero%20Selection%20Components/Background.mp4",
  characterBackground: "https://lottie.host/b3ebb5e0-3eda-4aad-82a3-a7428cbe0aa5/mvEeQ5rDi1.lottie",
  bottomBar: "https://github.com/user-attachments/assets/a913b8b6-2df5-4f08-b746-eb5a277f955a",
  coin: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
  healthIcon: "https://github.com/user-attachments/assets/82a87b3d-bc5c-4bb8-8d3e-46017ffcf1f4"
};

export const VIDEO_ASSETS = {
  characterSelectBackground: URLS.background
};

// Default hero lottie styles (can be overridden by API data)
export const DEFAULT_HERO_LOTTIE_STYLE = {
  width: screenWidth * 1.4,
  height: screenHeight * 1.4,
};