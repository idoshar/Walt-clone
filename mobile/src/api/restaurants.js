import { apiRequest } from './client';

function extractRestaurants(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  return [];
}

export async function getRestaurants({ signal } = {}) {
  const response = await apiRequest('/restaurants', {
    signal,
  });

  return extractRestaurants(response);
}
