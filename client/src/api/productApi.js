import { apiRequest } from './client.js';

export function getProducts(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/products`);
}

export function createProduct(restaurantId, product) {
  return apiRequest(`/restaurants/${restaurantId}/products`, {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

export function updateProduct(restaurantId, productId, product) {
  return apiRequest(`/restaurants/${restaurantId}/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(product)
  });
}

export function deleteProduct(restaurantId, productId) {
  return apiRequest(`/restaurants/${restaurantId}/products/${productId}`, {
    method: 'DELETE'
  });
}