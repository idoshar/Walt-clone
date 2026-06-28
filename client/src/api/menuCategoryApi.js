import { apiRequest } from './client.js';

export function getMenuCategories(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/menu-categories`);
}

export function createMenuCategory(restaurantId, category) {
  return apiRequest(`/restaurants/${restaurantId}/menu-categories`, {
    method: 'POST',
    body: JSON.stringify(category)
  });
}