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

    // Cover, Board & Shop Background
    addAsset(TOP_UP_COVER_URL, 'topup_cover', 'image', 'top_up_shop');
    addAsset(TOP_UP_BOARD_URL, 'topup_board', 'image', 'top_up_shop');
    addAsset(TOP_UP_SHOP_BG_URL, 'topup_shop_bg', 'image', 'top_up_shop');

    return assets;
  },
};
