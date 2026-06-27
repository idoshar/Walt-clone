import { apiRequest } from './client';

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  return [];
}

function normalizeId(value) {
  return String(value || '').trim();
}

export async function getMyRestaurants(token) {
  const response = await apiRequest('/restaurants/mine', {
    token,
  });

  return extractCollection(response);
}

export async function getRestaurants({ signal } = {}) {
  const response = await apiRequest('/restaurants', {
    signal,
  });

  return extractCollection(response);
}

export async function getRestaurantById(restaurantId, { signal } = {}) {
  const normalizedRestaurantId = normalizeId(restaurantId);

  if (!normalizedRestaurantId) {
    throw new Error('A restaurant id is required.');
  }

  return apiRequest(
    `/restaurants/${encodeURIComponent(normalizedRestaurantId)}`,
    { signal }
  );
}

export async function getRestaurantProducts(restaurantId, { signal } = {}) {
  const normalizedRestaurantId = normalizeId(restaurantId);

  if (!normalizedRestaurantId) {
    throw new Error('A restaurant id is required.');
  }

  const response = await apiRequest(
    `/restaurants/${encodeURIComponent(normalizedRestaurantId)}/products`,
    { signal }
  );

  return extractCollection(response);
}