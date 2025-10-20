import { prisma } from "../prisma/client";

type MapName = "HTML" | "CSS" | "Computer" | "JavaScript";

const backgrounds: Record<MapName, string[]> = {
  HTML: [
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912109/1_ovz01u.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912108/2_aeuz9s.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912107/3_ufuizs.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912108/4_fz2jab.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912110/5_g53p8i.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912110/6_h2i2cg.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912108/7_dhmixw.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912226/8_f8xwom.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912116/9_zyo2wh.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912110/10_acateh.png`,
  ],
  CSS: [
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917375/1_wte4s6.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917385/2_vositf.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917393/3_rjecww.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917400/4_d5l4w5.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917410/5_tapgvn.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917421/6_jfu1sq.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917436/7_sqafym.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917449/8_marmer.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917466/9_mrpnx5.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759917475/10_zl11oi.png`,
  ],
  Computer: [
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914892/1_p4h55z.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914897/2_uoo8gv.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914901/3_vbatom.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914906/4_wek46q.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914910/5_s4gfie.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914914/6_cqcn04.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914918/7_j3wics.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914921/8_audxck.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914924/9_fs7iuc.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759914927/10_qbcq7a.png`,
  ],
  JavaScript: [
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759918970/1_s354xv.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759918975/2_ihsngr.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759918996/3_tfcsg8.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919004/4_lrzhga.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919037/5_ds6tsv.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919078/6_fzbgoj.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919083/7_rzz4pf.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919088/8_r2hrdn.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919106/9_qoyy4t.png`,
    `https://res.cloudinary.com/dpbocuozx/image/upload/v1759919133/10_motvla.png`,
  ],
};

const defaultBackground = `https://res.cloudinary.com/dpbocuozx/image/upload/v1759912110/default_background.png`;

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
