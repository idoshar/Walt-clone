import { apiRequest } from './client';

export async function createOrder({ token, restaurantId, items }) {
  if (!token) {
    throw new Error('You must be signed in to place an order.');
  }

  if (!restaurantId) {
    throw new Error('A restaurant is required to place an order.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your order must include at least one item.');
  }

  return apiRequest('/orders', {
    method: 'POST',
    token,
    body: {
      restaurantId,
      items,
    },
  });
}
