export const TOP_UP_CATEGORIES = [
  { key: 'coins', label: 'Coins' },
  { key: 'diamonds', label: 'Diamonds' },
  { key: 'energy', label: 'Energy' },
];

export const TOP_UP_CATEGORY_MATCHERS = {
  coins: (item) => String(item?.item_id || '').includes('coins'),
  diamonds: (item) => String(item?.item_id || '').includes('diamonds'),
  energy: (item) => String(item?.item_id || '').includes('energy'),
};

export const getTopUpCategoryFromItemId = (itemId) => {
  const normalizedItemId = String(itemId || '').toLowerCase();

  if (normalizedItemId.includes('coins')) return 'coins';
  if (normalizedItemId.includes('diamonds')) return 'diamonds';
  if (normalizedItemId.includes('energy')) return 'energy';
  return 'all';
};

export const formatPhpPrice = (value) => {
  const numericValue = Number(value || 0);
  return `PHP ${numericValue.toLocaleString()}`;
};

export const formatTopUpQuantity = (qty) => {
  return Number(qty || 0).toLocaleString();
};
