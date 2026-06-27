import { apiRequest } from './client';

// Normalises whatever shape the server returns into a plain array.
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

export async function getRestaurants({ signal } = {}) {
  const response = await apiRequest('/restaurants', { signal });
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

export function getMyRestaurants(token) {
  return apiRequest('/restaurants/mine', { token });
}

export async function createRestaurant(data, token) {
  return apiRequest('/restaurants', {
    method: 'POST',
    token,
    body: data,
  });
}

export async function updateRestaurant(restaurantId, data, token) {
  const normalizedId = normalizeId(restaurantId);
  return apiRequest(`/restaurants/${encodeURIComponent(normalizedId)}`, {
    method: 'PUT',
    token,
    body: data,
  });
}

export async function deleteRestaurant(restaurantId, token) {
  const normalizedId = normalizeId(restaurantId);
  return apiRequest(`/restaurants/${encodeURIComponent(normalizedId)}`, {
    method: 'DELETE',
    token,
  });
}