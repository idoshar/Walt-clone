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

export function updateMenuCategoryOrder(restaurantId, categoryIds) {
  return apiRequest(`/restaurants/${restaurantId}/menu-categories/order`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryIds })
  });
}

export function updateMenuCategory(
  restaurantId,
  categoryId,
  category
) {
  return apiRequest(
    `/restaurants/${restaurantId}/menu-categories/${categoryId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(category)
    }
  );
}

export function deleteMenuCategory(restaurantId, categoryId) {
  return apiRequest(
    `/restaurants/${restaurantId}/menu-categories/${categoryId}`,
    {
      method: 'DELETE'
    }
  );
}
