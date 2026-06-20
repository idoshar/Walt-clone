export function getRestaurantImage(restaurant = {}) {
  const customImage =
    typeof restaurant?.image === 'string' ? restaurant.image.trim() : '';

  if (customImage) {
    return customImage;
  }

  const restaurantName = String(restaurant?.name || '').toLowerCase();

  if (restaurantName.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80';
  }

  if (restaurantName.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
  }

  if (restaurantName.includes('sushi')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';
}
