import { apiRequest } from './client';

function extractCollection(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.value)) return response.value;
  return [];
}

function productPath(restaurantId, productId = '') {
  const base = `/restaurants/${encodeURIComponent(restaurantId)}/products`;
  return productId ? `${base}/${encodeURIComponent(productId)}` : base;
}

export async function getProductsByRestaurant(restaurantId, { signal } = {}) {
  const response = await apiRequest(productPath(restaurantId), { signal });
  return extractCollection(response);
}

export async function createProduct(restaurantId, token, productData) {
  return apiRequest(productPath(restaurantId), {
    method: 'POST',
    token,
    body: productData,
  });
}

export async function updateProduct(restaurantId, productId, token, productData) {
  const url = productPath(restaurantId, productId);

  console.log('PATCH URL:', url);
  console.log('BODY:', productData);

  return apiRequest(url, {
    method: 'PATCH',
    token,
    body: productData,
  });
}

export async function deleteProduct(restaurantId, productId, token) {
  return apiRequest(productPath(restaurantId, productId), {
    method: 'DELETE',
    token,
  });
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