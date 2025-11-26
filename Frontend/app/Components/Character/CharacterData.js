import { Dimensions } from 'react-native';
import { Video } from 'expo-av';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const HERO_DATA = {
  Gino: {
    character_name: "Gino",
    character_type: "Assassin",
    roleIcon: "https://github.com/user-attachments/assets/d95f6009-ac83-4c34-a486-96b332bf39e4",
    health: 8,
    character_damage: 150,
    character_price: 300,
    character_avatar: "https://github.com/user-attachments/assets/8ac0df18-744e-433e-aece-8d75604b86fc",
    damageIcon: "https://github.com/user-attachments/assets/cbb414c2-500e-46be-ab09-fcc8fb7c636e", 
    character_image_display: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759745063/gino_entrance_dt96xf.png",
    character_hero_lottie: "https://lottie.host/63002a10-050e-4d50-b7cc-a096ce222a44/GZrCk7Bjjq.lottie",
    heroLottieStyle: {
      width: screenWidth * 1.4,
      height: screenHeight * 1.4,
    },
    is_purchased: true,
    is_selected: false
  },
  Leon: {
    character_name: "Leon",
    character_type: "Tank",
    health: 10,
    character_damage: 250,
    character_price: 200,
    character_avatar: "https://github.com/user-attachments/assets/5310c188-d3f4-4992-b001-6b4541d0b1a7",
    roleIcon: "https://github.com/user-attachments/assets/36859900-5dc8-45b3-91e6-fb3820f215e1",
    damageIcon: "https://github.com/user-attachments/assets/d2ad1452-beaf-4e76-b263-99f407002354",
    character_image_display: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759739626/leon_entrance_piyo3y.png",
    character_hero_lottie: "https://lottie.host/2a85fbbe-e3c2-465d-937b-920da478b2c4/uG1UxqpnRO.lottie",
    is_purchased: false,
    is_selected: false
  },
  ShiShi: {
    character_name: "ShiShi",
    character_type: "Mage",
    health: 6,
    character_damage: 200,
    character_price: 250,
    character_avatar: "https://github.com/user-attachments/assets/2ae41431-31db-4bf6-9165-8d7ced09179a",
    roleIcon: "https://github.com/user-attachments/assets/927e2303-ecb2-4009-b64e-1160758f3c1b",
    damageIcon: "https://github.com/user-attachments/assets/595c45b0-d3e4-48f6-acd6-983542c128ec",
    character_image_display: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759744865/shi_entrance_gvekzy.png",
    character_hero_lottie: "https://lottie.host/797bb3f3-5daa-4fad-8c94-2b8ea9f75702/7XrKd9W5hD.lottie",
    is_purchased: false,
    is_selected: false
  },
  Ryron: {
    character_name: "Ryron",
    character_type: "Archer",
    health: 4,
    character_damage: 300,
    character_price: 350,
    character_avatar: "https://github.com/user-attachments/assets/becd78ef-1bb0-42dd-b724-c69cad9bb3f3",
    roleIcon: "https://github.com/user-attachments/assets/38e408df-acdc-4d46-abcc-29bb6f28ab59",
    damageIcon: "https://github.com/user-attachments/assets/f41a9cf8-f03d-418a-8d33-af113d326d91",
    character_image_display: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759739712/ryron_entrance_v0xfga.png",
    character_hero_lottie: "https://lottie.host/7469cba5-5354-43b3-96ef-80c10439cef9/sDQHM1pmOH.lottie",
    is_purchased: false,
    is_selected: false
  }
};

export const URLS = {
  background: "https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Hero%20Selection%20Components/Background.mp4",
  characterBackground: "https://lottie.host/b3ebb5e0-3eda-4aad-82a3-a7428cbe0aa5/mvEeQ5rDi1.lottie",
  bottomBar: "https://github.com/user-attachments/assets/a913b8b6-2df5-4f08-b746-eb5a277f955a",
  coin: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
  healthIcon: "https://github.com/user-attachments/assets/82a87b3d-bc5c-4bb8-8d3e-46017ffcf1f4"
};


export const VIDEO_ASSETS = {
  characterSelectBackground: URLS.background
};
export const getHeroByName = (name) => HERO_DATA[name];

export const getAllHeroNames = () => Object.keys(HERO_DATA);

export const getPurchasedHeroes = () => 
  Object.values(HERO_DATA).filter(hero => hero.is_purchased);

export const getAvailableHeroes = () => 
  Object.values(HERO_DATA).filter(hero => !hero.is_purchased);

export const getSelectedHero = () => 
  Object.values(HERO_DATA).find(hero => hero.is_selected);