import { getRandomBackgroundForMap } from "./combatBackgroundHelper";

export const VERSUS_AUDIO =
  "https://micomi-assets.me/Sounds/Final/Versus%20Sound%20Effect%20Final.wav";

export const CORRECT_ANSWER_AUDIO =
  "https://micomi-assets.me/Sounds/Final/Correct.wav";

export const WRONG_ANSWER_AUDIO =
  "https://micomi-assets.me/Sounds/Final/Wrong_2.wav";

export const UNIVERSAL_ENEMY_HURT_AUDIO =
  "https://micomi-assets.me/Sounds/In%20Game/Enemies%20SFX/enemies%20universal%20hurt%20sfx.mp3";

const MAP_MEDIA: Record<
  string,
  {
    gameplay_audio: string;
  }
> = {
  HTML: {
    gameplay_audio:
      "https://micomi-assets.me/Sounds/Final/Greenland%20Final.mp3",
  },
  CSS: {
    gameplay_audio: "https://micomi-assets.me/Sounds/Final/Lavaland.mp3",
  },
  JavaScript: {
    gameplay_audio: "https://micomi-assets.me/Sounds/Final/Snowland.mp3",
  },
  Computer: {
    gameplay_audio: "https://micomi-assets.me/Sounds/Final/Autumnland.mp3",
  },
};

const HERO_SS_MAP: Record<
  string,
  { special_skill_image: string; special_skill_description: string }
> = {
  Gino: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Gino_SS.png",
    special_skill_description:
      "Unleashes a powerful lightning attack and heals 25% HP",
  },
  ShiShi: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Shi_SS_FINAL.png",
    special_skill_description:
      "Freezes the enemy, preventing their next attack",
  },
  Ryron: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Ryron_SS.png",
    special_skill_description:
      "God's Judgment: Reveals all blanks in the next challenge",
  },
  Leon: {
    special_skill_image:
      "https://micomi-assets.me/Icons/SS%20Skill%20Icons/Leon_SS.png",
    special_skill_description: "Deals 2x damage with a devastating fire attack",
  },
};

const HERO_ATTACK_AUDIO_MAP: Record<string, Record<string, string>> = {
  Gino: {
    basic_attack: "https://micomi-assets.me/Sounds/Final/Gino_Basic_Attack.wav",
    second_attack: "https://micomi-assets.me/Sounds/Final/Gino%20Bite.wav",
    third_attack:
      "https://micomi-assets.me/Sounds/Final/3rd%20and%204th%20Skill%20Gino.wav",
    special_attack:
      "https://micomi-assets.me/Sounds/Final/3rd%20and%204th%20Skill%20Gino.wav",
  },
  ShiShi: {
    basic_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/Basic.mp3.wav",
    second_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/2nd.wav.wav",
    third_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/Special.wav.wav",
    special_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/Ult.wav.wav",
  },
  Ryron: {
    basic_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/Sounds_In%20Game_Ryron%20Attacks_Basic.wav.wav",
    second_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/2nd%20Attack.wav",
    third_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/Ryron_Special.wav",
    special_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/Sounds_In%20Game_Ryron%20Attacks_Ult.wav.wav",
  },
  Leon: {
    basic_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/Sounds_In%20Game_Leon%20Attacks_Basic.wav.wav",
    second_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/2nd.wav",
    third_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/Leon_Special.wav",
    special_attack:
      "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/Sounds_In%20Game_Leon%20Attacks_Ult.mp3.wav",
  },
};

const HERO_HURT_AUDIO_MAP: Record<string, string> = {
  Gino: "https://micomi-assets.me/Sounds/In%20Game/Hero%20SFX/Gino%20Hurt%20sfx.mp3",
  ShiShi: "https://micomi-assets.me/Sounds/In%20Game/Hero%20SFX/Shis_Hurt.mp3",
  Ryron:
    "https://micomi-assets.me/Sounds/In%20Game/Hero%20SFX/Ryron%20Hurt%20sfx.mp3",
  Leon: "https://micomi-assets.me/Sounds/In%20Game/Hero%20SFX/Leon%20hurt%20sfx%20final.mp3",
};

export const getMapMediaAssets = (mapName: string) => {
  const media = MAP_MEDIA[mapName];
  if (!media) {
    return {
      versus_background: getRandomBackgroundForMap(mapName),
      versus_audio: VERSUS_AUDIO,
      gameplay_audio: "",
    };
  }

  return {
    versus_background: getRandomBackgroundForMap(mapName),
    versus_audio: VERSUS_AUDIO,
    gameplay_audio: media.gameplay_audio,
  };
};

export const getHeroSpecialSkillAssets = (characterName: string) => {
  return (
    HERO_SS_MAP[characterName] ?? {
      special_skill_image: null,
      special_skill_description: null,
    }
  );
};

export const getHeroAttackAudio = (
  characterName: string,
  attackType: string,
): string | null => {
  const row = HERO_ATTACK_AUDIO_MAP[characterName];
  if (!row) return null;
  return row[attackType] ?? row.basic_attack ?? null;
};

export const getHeroHurtAudio = (characterName: string): string | null => {
  return HERO_HURT_AUDIO_MAP[characterName] ?? null;
};

export const getHeroIdleAudio = (characterName: string): string | null => {
  return HERO_RUN_AUDIO_MAP[characterName] ?? null;
};

export const VICTORY_AUDIO =
  "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";
export const DEFEAT_AUDIO =
  "https://micomi-assets.me/Sounds/Final/Defeat_Sound.wav";
export const VICTORY_IMAGES = [
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb1.png",
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb2.png",
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb3.png",
];
export const DEFEAT_IMAGES = [
  "https://micomi-assets.me/Micomi%20Celebrating/Failed1.png",
  "https://micomi-assets.me/Micomi%20Celebrating/Failed2.png",
  "https://micomi-assets.me/Micomi%20Celebrating/Failed3.png",
];

const HERO_RUN_AUDIO_MAP: Record<string, string> = {
  Gino: "https://micomi-assets.me/Sounds/In%20Game/Hero%20Runs/Gino_Run.wav",
  ShiShi:
    "https://micomi-assets.me/Sounds/In%20Game/Hero%20Runs/Shishi_Run.wav",
  Ryron: "https://micomi-assets.me/Sounds/In%20Game/Hero%20Runs/Ryron_Run.wav",
  Leon: "https://micomi-assets.me/Sounds/In%20Game/Hero%20Runs/Leon_Run.wav",
};
