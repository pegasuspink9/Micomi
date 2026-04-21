export const ENEMY_IDLE_SOUNDS: Record<string, string> = {
  Antristotle: "https://micomi-assets.me/Enemy%20idle%20sound/GreenLand/Antristotle.wav",
  Beertolomy: "https://micomi-assets.me/Enemy%20idle%20sound/GreenLand/Beertolomy.wav",
  Draco: "https://micomi-assets.me/Enemy%20idle%20sound/GreenLand/Draco.wav",
  Formica: "https://micomi-assets.me/Enemy%20idle%20sound/GreenLand/Formica.wav"
};

export const getEnemyIdleAudio = (enemyName: string): string | null => {
  return ENEMY_IDLE_SOUNDS[enemyName] || null;
};