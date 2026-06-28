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

/**
 * Fetches real recommendations from the C++ ex2 engine via the server.
 * Also reports the product view to the engine (side effect on the server).
 * Requires auth token.
 */
export async function getProductRecommendations(restaurantId, productId, token, { signal } = {}) {
  if (!restaurantId || !productId || !token) return [];

  try {
    const response = await apiRequest(
      `/restaurants/${encodeURIComponent(restaurantId)}/products/${encodeURIComponent(productId)}/recommendations`,
      { token, signal }
    );
    return Array.isArray(response) ? response : [];
  } catch {
    // Recommendations are non-critical — silently return empty on error
    return [];
  }
}