export const TOP_UP_IMAGE_MAP = {
  // Coins
  'currency_coins_1000': 'https://micomi-assets.me/Top%20ups/coins/handful.png',
  'currency_coins_4000': 'https://micomi-assets.me/Top%20ups/coins/pounce.png',
  'currency_coins_10000': 'https://micomi-assets.me/Top%20ups/coins/pounce.png',
  // Diamonds
  'currency_diamonds_50': 'https://micomi-assets.me/Top%20ups/diamonds/handful.png',
  'currency_diamonds_160': 'https://micomi-assets.me/Top%20ups/diamonds/pounces.png',
  'currency_diamonds_360': 'https://micomi-assets.me/Top%20ups/diamonds/chest.png',
  // Energy
  'infinite_energy_monthly': 'https://micomi-assets.me/Top%20ups/energy/Monthly.png',
  'infinite_energy_lifetime': 'https://micomi-assets.me/Top%20ups/energy/Lifetime.png',
};

export const TOP_UP_COVER_URL = 'https://micomi-assets.me/Top%20ups/Cover/Cover.jpg';
export const TOP_UP_BOARD_URL = 'https://micomi-assets.me/Top%20ups/Cover/Board.png';
export const TOP_UP_SHOP_BG_URL = 'https://micomi-assets.me/Top%20ups/Cover/ShopBackground.png';

export const topUpMethods = {
  getStaticTopUpAssets() {
    const assets = [];
    const addedUrls = new Set();

    const addAsset = (url, name, type, category) => {
      if (url && typeof url === 'string' && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    Object.entries(TOP_UP_IMAGE_MAP).forEach(([itemId, url]) => {
      addAsset(url, `topup_${itemId}`, 'image', 'top_up_shop');
    });

    // Cover, Board & Shop Background
    addAsset(TOP_UP_COVER_URL, 'topup_cover', 'image', 'top_up_shop');
    addAsset(TOP_UP_BOARD_URL, 'topup_board', 'image', 'top_up_shop');
    addAsset(TOP_UP_SHOP_BG_URL, 'topup_shop_bg', 'image', 'top_up_shop');

    return assets;
  },
};
