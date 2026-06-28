import { apiRequest } from './client';

function extractCollection(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.value)) return response.value;
  return [];
}

export async function getProductsByRestaurant(restaurantId, { signal } = {}) {
  const response = await apiRequest(
    `/restaurants/${encodeURIComponent(restaurantId)}/products`,
    { signal }
  );
  return extractCollection(response);
}

export async function searchProducts(query, { signal } = {}) {
  const response = await apiRequest(
    `/products/search?q=${encodeURIComponent(query)}`,
    { signal }
  );
  return extractCollection(response);
}