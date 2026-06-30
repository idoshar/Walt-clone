import { apiRequest } from './client.js';

function getRestaurantPath(restaurantId = '') {
  const normalizedId = String(restaurantId || '').trim();

  if (!normalizedId) {
    throw new Error('A restaurant id is required.');
  }

  return `/admin/restaurants/${encodeURIComponent(normalizedId)}`;
}

export function getAdminRestaurants() {
  return apiRequest('/admin/restaurants');
}

export function getAdminRestaurant(restaurantId) {
  return apiRequest(getRestaurantPath(restaurantId));
}

export function updateAdminRestaurant(restaurantId, restaurantUpdates) {
  return apiRequest(getRestaurantPath(restaurantId), {
    method: 'PATCH',
    body: JSON.stringify(restaurantUpdates)
  });
}

export function updateAdminRestaurantSponsorship(restaurantId, sponsorship) {
  return apiRequest(`${getRestaurantPath(restaurantId)}/sponsorship`, {
    method: 'PATCH',
    body: JSON.stringify(sponsorship)
  });
}

export function updateAdminSponsorshipOrder(restaurantIds) {
  return apiRequest('/admin/restaurants/sponsorship-order', {
    method: 'PUT',
    body: JSON.stringify({ restaurantIds })
  });
}

export function deleteAdminRestaurant(restaurantId) {
  return apiRequest(getRestaurantPath(restaurantId), {
    method: 'DELETE'
  });
}
