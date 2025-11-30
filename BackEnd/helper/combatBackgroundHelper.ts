import { prisma } from "../prisma/client";

type MapName = "HTML" | "CSS" | "Computer" | "JavaScript";

const backgrounds: Record<MapName, string[]> = {
  HTML: [
    `https://micomi-assets.me/Maps/Greenland/1.png`,
    `https://micomi-assets.me/Maps/Greenland/2.png`,
    `https://micomi-assets.me/Maps/Greenland/3.png`,
    `https://micomi-assets.me/Maps/Greenland/4.png`,
    `https://micomi-assets.me/Maps/Greenland/5.png`,
    `https://micomi-assets.me/Maps/Greenland/6.png`,
    `https://micomi-assets.me/Maps/Greenland/7.png`,
    `https://micomi-assets.me/Maps/Greenland/8.png`,
    `https://micomi-assets.me/Maps/Greenland/9.png`,
    `https://micomi-assets.me/Maps/Greenland/10.png`,
  ],
  CSS: [
    `https://micomi-assets.me/Maps/Lavaland/1.png`,
    `https://micomi-assets.me/Maps/Lavaland/2.png`,
    `https://micomi-assets.me/Maps/Lavaland/3.png`,
    `https://micomi-assets.me/Maps/Lavaland/4.png`,
    `https://micomi-assets.me/Maps/Lavaland/5.png`,
    `https://micomi-assets.me/Maps/Lavaland/6.png`,
    `https://micomi-assets.me/Maps/Lavaland/7.png`,
    `https://micomi-assets.me/Maps/Lavaland/8.png`,
    `https://micomi-assets.me/Maps/Lavaland/9.png`,
    `https://micomi-assets.me/Maps/Lavaland/10.png`,
  ],
  Computer: [
    `https://micomi-assets.me/Maps/Autumnland/1.png`,
    `https://micomi-assets.me/Maps/Autumnland/2.png`,
    `https://micomi-assets.me/Maps/Autumnland/3.png`,
    `https://micomi-assets.me/Maps/Autumnland/4.png`,
    `https://micomi-assets.me/Maps/Autumnland/5.png`,
    `https://micomi-assets.me/Maps/Autumnland/6.png`,
    `https://micomi-assets.me/Maps/Autumnland/7.png`,
    `https://micomi-assets.me/Maps/Autumnland/8.png`,
    `https://micomi-assets.me/Maps/Autumnland/9.png`,
    `https://micomi-assets.me/Maps/Autumnland/10.png`,
  ],
  JavaScript: [
    `https://micomi-assets.me/Maps/Snowland/1.png`,
    `https://micomi-assets.me/Maps/Snowland/2.png`,
    `https://micomi-assets.me/Maps/Snowland/3.png`,
    `https://micomi-assets.me/Maps/Snowland/4.png`,
    `https://micomi-assets.me/Maps/Snowland/5.png`,
    `https://micomi-assets.me/Maps/Snowland/6.png`,
    `https://micomi-assets.me/Maps/Snowland/7.png`,
    `https://micomi-assets.me/Maps/Snowland/8.png`,
    `https://micomi-assets.me/Maps/Snowland/9.png`,
    `https://micomi-assets.me/Maps/Snowland/10.png`,
  ],
};

const defaultBackground = `https://micomi-assets.me/Maps/Snowland/10.png`;

export async function getBackgroundForLevel(
  mapName: string,
  levelNumber: number
): Promise<string> {
  const key = mapName as MapName;
  const bgList = backgrounds[key];

  if (!bgList) return defaultBackground;

  const existing = await prisma.backgroundMapping.findFirst({
    where: { mapName: key, levelNumber },
  });

  if (existing) return existing.backgroundUrl;

  const usedBackgrounds = await prisma.backgroundMapping.findMany({
    where: { mapName: key },
    select: { backgroundUrl: true },
  });

  const usedUrls = usedBackgrounds.map((b) => b.backgroundUrl);

  const available = bgList.filter((url) => !usedUrls.includes(url));

  let selected: string;

  if (available.length > 0) {
    selected = available[0];
  } else {
    selected = bgList[(levelNumber - 1) % bgList.length];
  }

  await prisma.backgroundMapping.create({
    data: { mapName: key, levelNumber, backgroundUrl: selected },
  });

  return selected;
}
