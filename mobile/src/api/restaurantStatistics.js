import { apiRequest } from './client';

function normalizeRestaurantId(restaurantId) {
  const normalizedRestaurantId = String(restaurantId || '').trim();

  if (!normalizedRestaurantId) {
    throw new Error('A restaurant id is required.');
  }

  return normalizedRestaurantId;
}

export function getRestaurantSalesStatistics(restaurantId, token) {
  const normalizedRestaurantId = normalizeRestaurantId(restaurantId);

  return apiRequest(
    `/restaurants/${encodeURIComponent(
      normalizedRestaurantId
    )}/statistics`,
    { token }
  );
}