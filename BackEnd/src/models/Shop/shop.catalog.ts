export type StoreItemType = "currency" | "map" | "character" | "bundle";

export type StoreContentItem = {
  item_id: string;
  qty: number;
};

export interface StoreCatalogItem {
  item_id: string;
  google_product_id?: string;
  name: string;
  type: StoreItemType;
  description: string;
  price_php: number;
  contents: StoreContentItem[];
  product_image: string;
}

export const STORE_CATALOG: StoreCatalogItem[] = [
  // ==================== COINS ====================
  {
    item_id: "currency_coins_1000",
    name: "Handful of Coins",
    type: "currency",
    description: "1,000 Coins. Perfect for a quick upgrade.",
    price_php: 19,
    contents: [{ item_id: "coins", qty: 1000 }],
    product_image: "https://micomi-assets.me/Top%20ups/coins/handful.png",
  },
  {
    item_id: "currency_coins_4000",
    name: "Pouch of Coins",
    type: "currency",
    description: "4,000 Coins. Great value for unlocking map nodes.",
    price_php: 59,
    contents: [{ item_id: "coins", qty: 4000 }],
    product_image: "https://micomi-assets.me/Top%20ups/coins/pounce.png",
  },
  {
    item_id: "currency_coins_10000",
    name: "Chest of Coins",
    type: "currency",
    description: "10,000 Coins. Best value for long-term progression.",
    price_php: 119,
    contents: [{ item_id: "coins", qty: 10000 }],
    product_image: "https://micomi-assets.me/Top%20ups/coins/chest.png",
  },

  // ==================== DIAMONDS ====================
  {
    item_id: "currency_diamonds_50",
    name: "Handful of Diamonds",
    type: "currency",
    description: "50 Diamonds for premium perks.",
    price_php: 29,
    contents: [{ item_id: "diamonds", qty: 50 }],
    product_image: "https://micomi-assets.me/Top%20ups/diamonds/handful.png",
  },
  {
    item_id: "currency_diamonds_160",
    name: "Pouch of Diamonds",
    type: "currency",
    description: "160 Diamonds. Enough to unlock ShiShi in-game!",
    price_php: 89,
    contents: [{ item_id: "diamonds", qty: 160 }],
    product_image: "https://micomi-assets.me/Top%20ups/diamonds/pounces.png",
  },
  {
    item_id: "currency_diamonds_360",
    name: "Chest of Diamonds",
    type: "currency",
    description: "360 Diamonds. Enough to unlock the mighty Leon!",
    price_php: 189,
    contents: [{ item_id: "diamonds", qty: 360 }],
    product_image: "https://micomi-assets.me/Top%20ups/diamonds/chest.png",
  },

  // ==================== ENERGY & SUBSCRIPTIONS ====================
  {
    item_id: "infinite_energy_monthly",
    name: "Monthly Infinite Energy",
    type: "bundle",
    description:
      "Unlimited energy for 30 days. Learn and practice without limits for a whole month!",
    price_php: 149,
    contents: [{ item_id: "infinite_energy_monthly", qty: 1 }],
    product_image: "https://micomi-assets.me/Top%20ups/energy/Monthly.png",
  },
  {
    item_id: "infinite_energy_lifetime",
    name: "Lifetime Infinite Energy",
    type: "bundle",
    description:
      "Permanent unlimited energy, Unlocked All Maps, and Get Ryron!",
    price_php: 399,
    contents: [
      { item_id: "infinite_energy_lifetime", qty: 1 },
      { item_id: "map_css_premium", qty: 1 },
      { item_id: "map_js_premium", qty: 1 },
      { item_id: "character_ryron", qty: 1 },
    ],
    product_image: "https://micomi-assets.me/Top%20ups/energy/Lifetime.png",
  },
];
