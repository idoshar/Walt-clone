import { apiRequest } from './client';

function requireToken(token, action) {
  if (!token) {
    throw new Error(`You must be signed in to ${action}.`);
  }
}

function extractOrders(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.orders)) {
    return response.orders;
  }

  return [];
}

export async function createOrder({ token, restaurantId, items }) {
  requireToken(token, 'place an order');

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

export async function getUserOrders(token) {
  requireToken(token, 'view your orders');

  const response = await apiRequest('/orders', {
    token,
  });

  return extractOrders(response);
}

export async function getOrderById(orderId, token) {
  requireToken(token, 'view order details');

  const normalizedOrderId = String(orderId || '').trim();

  if (!normalizedOrderId) {
    throw new Error('An order id is required.');
  }

  return apiRequest(`/orders/${encodeURIComponent(normalizedOrderId)}`, {
    token,
  });
}
