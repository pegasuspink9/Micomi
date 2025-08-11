import { useFonts as useExpoFonts } from 'expo-font';

export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    'FunkySign': require('./FunkySign.ttf'),
    'Computerfont': require('./Computerfont.ttf'),
  });

  return fontsLoaded;
};