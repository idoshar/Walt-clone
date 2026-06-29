import { apiRequest } from './client.js';

export function getRestaurants() {
  return apiRequest('/restaurants');
}

export function getMyRestaurants() {
  return apiRequest('/restaurants/mine');
}

export function getRestaurantById(id) {
  return apiRequest(`/restaurants/${id}`);
}

export function getRestaurantStatistics(id) {
  return apiRequest(`/restaurants/${id}/statistics`);
}

export function getRestaurantAccess(id) {
  return apiRequest(`/restaurants/${id}/access`);
}

export function addRestaurantEditor(id, userId) {
  return apiRequest(`/restaurants/${id}/editors`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

export function removeRestaurantEditor(id, userId) {
  return apiRequest(`/restaurants/${id}/editors/${userId}`, {
    method: 'DELETE'
  });
}

export function transferRestaurantOwnership(id, userId) {
  return apiRequest(`/restaurants/${id}/owner`, {
    method: 'PUT',
    body: JSON.stringify({ userId })
  });
}

export function createRestaurant(restaurant) {
  return apiRequest('/restaurants', {
    method: 'POST',
    body: JSON.stringify(restaurant)
  });
}

export function updateRestaurant(id, restaurant) {
  return apiRequest(`/restaurants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(restaurant)
  });
}

export function deleteRestaurant(id) {
  return apiRequest(`/restaurants/${id}`, {
    method: 'DELETE'
  });
}