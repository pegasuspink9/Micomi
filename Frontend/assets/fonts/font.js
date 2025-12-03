import { useFonts as useExpoFonts } from 'expo-font';

export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    'FunkySign': require('./FunkySign.ttf'),
    'Computerfont': require('./Computerfont.ttf'),
    'GoldenAge': require('./GoldenAgeShad.ttf'),
    'GoldenAgeDark': require('./GoldenAgeDark.ttf'),
    'DynaPuff': require('./DynaPuff.ttf'),
    'MusicVibes': require('./MusicVibes.otf'),
    'Oups': require('./Oups.otf'),
    'DoongaSlash': require('./Doonga Slash.ttf'),
    'Grobold': require('./GROBOLD.ttf'),
    'Coco-extrabold': require('./Coco-Sharp-Extrabold-trial.ttf'),
  });

  return fontsLoaded;
};