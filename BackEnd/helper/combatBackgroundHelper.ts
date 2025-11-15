import { prisma } from "../prisma/client";

type MapName = "HTML" | "CSS" | "Computer" | "JavaScript";

const backgrounds: Record<MapName, string[]> = {
  HTML: [
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/1.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/2.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/3.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/4.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/5.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/6.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/7.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/8.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/9.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Greenland/10.png`,
  ],
  CSS: [
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/1.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/2.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/3.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/4.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/5.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/6.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/7.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/8.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/9.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Lavaland/10.png`,
  ],
  Computer: [
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/1.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/2.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/3.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/4.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/5.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/6.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/7.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/8.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/9.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Autumnland/10.png`,
  ],
  JavaScript: [
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/1.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/2.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/3.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/4.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/5.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/6.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/7.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/8.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/9.png`,
    `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/10.png`,
  ],
};

const defaultBackground = `https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Maps/Snowland/10.png`;

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

  const selected =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : bgList[(levelNumber - 1) % bgList.length];

  await prisma.backgroundMapping.create({
    data: { mapName: key, levelNumber, backgroundUrl: selected },
  });

  return selected;
}
