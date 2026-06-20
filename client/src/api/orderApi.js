import { apiRequest } from './client.js';

export function createOrder(order) {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

export function getOrders() {
  return apiRequest('/orders');
}