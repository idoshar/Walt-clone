import { apiRequest } from './client';

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  return [];
}

function normalizeRequiredId(value, label) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw new Error(`A ${label} is required.`);
  }

  return normalizedValue;
}

function menuCategoriesPath(restaurantId, categoryId = '') {
  const normalizedRestaurantId = normalizeRequiredId(
    restaurantId,
    'restaurant id'
  );

  const basePath =
    `/restaurants/${encodeURIComponent(
      normalizedRestaurantId
    )}/menu-categories`;

  if (!categoryId) {
    return basePath;
  }

  const normalizedCategoryId = normalizeRequiredId(
    categoryId,
    'menu category id'
  );

  return `${basePath}/${encodeURIComponent(normalizedCategoryId)}`;
}

export async function getMenuCategories(
  restaurantId,
  { signal } = {}
) {
  const response = await apiRequest(
    menuCategoriesPath(restaurantId),
    { signal }
  );

  return extractCollection(response);
}

export function createMenuCategory(
  restaurantId,
  token,
  categoryData
) {
  return apiRequest(menuCategoriesPath(restaurantId), {
    method: 'POST',
    token,
    body: categoryData,
  });
}

export function updateMenuCategory(
  restaurantId,
  categoryId,
  token,
  categoryData
) {
  return apiRequest(
    menuCategoriesPath(restaurantId, categoryId),
    {
      method: 'PATCH',
      token,
      body: categoryData,
    }
  );
}

export async function updateMenuCategoryOrder(
  restaurantId,
  token,
  categoryIds
) {
  const response = await apiRequest(
    `${menuCategoriesPath(restaurantId)}/order`,
    {
      method: 'PATCH',
      token,
      body: { categoryIds },
    }
  );

  return extractCollection(response);
}

export function deleteMenuCategory(
  restaurantId,
  categoryId,
  token
) {
  return apiRequest(
    menuCategoriesPath(restaurantId, categoryId),
    {
      method: 'DELETE',
      token,
    }
  );
}