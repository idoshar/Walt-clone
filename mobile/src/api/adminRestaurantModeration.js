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

function getRestaurantPath(restaurantId = '') {
  const normalizedId = String(restaurantId || '').trim();

  if (!normalizedId) {
    throw new Error('A restaurant id is required.');
  }

  return `/admin/restaurants/${encodeURIComponent(normalizedId)}`;
}

export async function getAdminRestaurants(token) {
  const response = await apiRequest('/admin/restaurants', { token });
  return extractCollection(response);
}

export function updateAdminRestaurant(restaurantId, updates, token) {
  return apiRequest(getRestaurantPath(restaurantId), {
    method: 'PATCH',
    token,
    body: updates,
  });
}

export function deleteAdminRestaurant(restaurantId, token) {
  return apiRequest(getRestaurantPath(restaurantId), {
    method: 'DELETE',
    token,
  });
}
