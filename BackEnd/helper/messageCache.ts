import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Pool = Record<string, any[]>;

const cache: { pools: Pool; lastRefresh: number } = {
  pools: {},
  lastRefresh: 0,
};
const REFRESH_INTERVAL = 10 * 60 * 1000;

export async function getMessagePool(category: string, tags: string[] = []) {
  const now = Date.now();

  if (
    now - cache.lastRefresh > REFRESH_INTERVAL ||
    Object.keys(cache.pools).length === 0
  ) {
    console.log("[GameMessage] Refreshing cache...");
    const all = await prisma.gameplayMessage.findMany({
      where: { isActive: true },
      select: {
        id: true,
        textTemplate: true,
        audioUrl: true,
        category: true,
        tags: true,
      },
    });

    cache.pools = {};
    for (const msg of all) {
      const matchesTags =
        tags.length === 0 || tags.every((t) => msg.tags.includes(t as any));
      if (matchesTags) {
        if (!cache.pools[msg.category]) cache.pools[msg.category] = [];
        cache.pools[msg.category].push(msg);
      }
    }
    cache.lastRefresh = now;
  }

  return cache.pools[category] || [];
}
