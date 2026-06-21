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
