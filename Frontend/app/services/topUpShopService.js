import { apiService } from './api';

export const topUpShopService = {
  getCatalog: async () => {
    try {
      const response = await apiService.get('/shop/catalog');

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to fetch top up shop catalog');
      }

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch top up shop catalog:', error);
      throw error;
    }
  },

  /**
   * Verify & fulfill an in-app purchase.
   * @param {string} productId  – item_id from the catalog (e.g. "currency_coins_1000")
   * @param {string} purchaseToken – Google Play purchase token (or any random string when MOCK_IAP=true on the backend)
   * @returns {Promise<object>} fulfillment data (coinsAdded, diamondsAdded, unlockedMaps, unlockedCharacters, …)
   */
  verifyPurchase: async (productId, purchaseToken) => {
    try {
      const response = await apiService.post('/payment/verify', {
        productId,
        purchaseToken,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Purchase verification failed');
      }

      return response;
    } catch (error) {
      console.error('Purchase verification failed:', error);
      throw error;
    }
  },
};
