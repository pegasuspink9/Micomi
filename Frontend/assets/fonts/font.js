import { useFonts as useExpoFonts } from 'expo-font';

export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    'FunkySign': require('./FunkySign.ttf'),
  });

  return fontsLoaded;
};