import { apiRequest } from './client';

// Normalises whatever shape the server returns into a plain array.
function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  return [];
}

function normalizeId(value) {
  return String(value || '').trim();
}

function restaurantPath(restaurantId) {
  const normalizedRestaurantId = normalizeId(restaurantId);

  if (!normalizedRestaurantId) {
    throw new Error('A restaurant id is required.');
  }

  return `/restaurants/${encodeURIComponent(normalizedRestaurantId)}`;
}

export async function getMyRestaurants(token) {
  const response = await apiRequest('/restaurants/mine', {
    token,
  });

  return extractCollection(response);
}

export async function getRestaurants({ signal } = {}) {
  const response = await apiRequest('/restaurants', { signal });
  return extractCollection(response);
}

export async function getRestaurantById(restaurantId, { signal } = {}) {
  return apiRequest(restaurantPath(restaurantId), { signal });
}

export async function getRestaurantProducts(restaurantId, { signal } = {}) {
  const response = await apiRequest(
    `${restaurantPath(restaurantId)}/products`,
    { signal }
  );

  return extractCollection(response);
}

export async function getRestaurantAccess(restaurantId, token) {
  return apiRequest(`${restaurantPath(restaurantId)}/access`, {
    token,
  });
}

export async function addRestaurantEditor(restaurantId, userId, token) {
  return apiRequest(`${restaurantPath(restaurantId)}/editors`, {
    method: 'POST',
    token,
    body: { userId },
  });
}

export async function removeRestaurantEditor(
  restaurantId,
  userId,
  token
) {
  return apiRequest(
    `${restaurantPath(restaurantId)}/editors/${encodeURIComponent(
      String(userId)
    )}`,
    {
      method: 'DELETE',
      token,
    }
  );
}

export async function transferRestaurantOwnership(
  restaurantId,
  userId,
  token
) {
  return apiRequest(`${restaurantPath(restaurantId)}/owner`, {
    method: 'PUT',
    token,
    body: { userId },
  });
}

export async function createRestaurant(data, token) {
  return apiRequest('/restaurants', {
    method: 'POST',
    token,
    body: data,
  });
}

export async function updateRestaurant(restaurantId, data, token) {
  return apiRequest(restaurantPath(restaurantId), {
    method: 'PATCH',
    token,
    body: data,
  });
}

export async function deleteRestaurant(restaurantId, token) {
  return apiRequest(restaurantPath(restaurantId), {
    method: 'DELETE',
    token,
  });
}