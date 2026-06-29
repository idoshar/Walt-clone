function normalizeLimit(limit) {
  const numericLimit = Math.floor(Number(limit));

  return Number.isFinite(numericLimit) && numericLimit > 0
    ? numericLimit
    : 6;
}

function getRestaurantName(restaurant = {}) {
  return String(restaurant.name || '').trim();
}

function compareRestaurants(firstRestaurant, secondRestaurant) {
  const defaultDifference =
    Number(Boolean(secondRestaurant.isDefault)) -
    Number(Boolean(firstRestaurant.isDefault));

  if (defaultDifference !== 0) {
    return defaultDifference;
  }

  const nameDifference = getRestaurantName(firstRestaurant).localeCompare(
    getRestaurantName(secondRestaurant),
    undefined,
    { sensitivity: 'base' }
  );

  if (nameDifference !== 0) {
    return nameDifference;
  }

  return String(firstRestaurant.id).localeCompare(
    String(secondRestaurant.id),
    undefined,
    {
      numeric: true,
      sensitivity: 'base',
    }
  );
}

export function getFeaturedRestaurants(restaurants = [], limit = 6) {
  if (!Array.isArray(restaurants)) {
    return [];
  }

  const restaurantIds = new Set();
  const uniqueRestaurants = [];

  restaurants.forEach((restaurant) => {
    const hasValidId =
      restaurant?.id !== undefined &&
      restaurant?.id !== null;

    if (!hasValidId || !getRestaurantName(restaurant)) {
      return;
    }

    const restaurantId = String(restaurant.id);

    if (restaurantIds.has(restaurantId)) {
      return;
    }

    restaurantIds.add(restaurantId);
    uniqueRestaurants.push(restaurant);
  });

  return uniqueRestaurants
    .sort(compareRestaurants)
    .slice(0, normalizeLimit(limit));
}
