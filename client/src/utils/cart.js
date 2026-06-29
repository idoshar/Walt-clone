export function getCartItemKey(item = {}) {
  const restaurantId = item?.restaurantId ?? 'unknown-restaurant';
  const productId = item?.id ?? 'unknown-product';

  return `${String(restaurantId)}:${String(productId)}`;
}

export function normalizeCartItem(item = {}) {
  const parsedQuantity = Number(item.quantity);

  return {
    ...item,
    cartKey: getCartItemKey(item),
    quantity:
      Number.isFinite(parsedQuantity) && parsedQuantity > 0
        ? Math.floor(parsedQuantity)
        : 1
  };
}

export function groupCartItemsByRestaurant(items = []) {
  const groups = new Map();

  items.forEach((item) => {
    const restaurantId = item?.restaurantId ?? 'unknown-restaurant';
    const groupKey = String(restaurantId);
    const price = Number(item?.price) || 0;
    const quantity = Number(item?.quantity) || 0;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        restaurantId,
        restaurantName:
          item?.restaurantName || `Restaurant ${String(restaurantId)}`,
        restaurantImage: item?.restaurantImage || '',
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    const group = groups.get(groupKey);

    if (!group.restaurantImage && item?.restaurantImage) {
      group.restaurantImage = item.restaurantImage;
    }

    group.items.push(item);
    group.totalItems += quantity;
    group.totalPrice += price * quantity;
  });

  return Array.from(groups.values());
}
