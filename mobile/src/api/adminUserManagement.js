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

function getUserPath(userId = '') {
  const normalizedId = String(userId || '').trim();

  if (!normalizedId) {
    throw new Error('A user id is required.');
  }

  return `/admin/users/${encodeURIComponent(normalizedId)}`;
}

export async function getAdminUsers(token, query = '') {
  const normalizedQuery = String(query || '').trim();
  const suffix = normalizedQuery
    ? `?q=${encodeURIComponent(normalizedQuery)}`
    : '';

  const response = await apiRequest(`/admin/users${suffix}`, { token });

  return extractCollection(response);
}

export function updateAdminUserStatus(userId, isActive, token) {
  return apiRequest(`${getUserPath(userId)}/status`, {
    method: 'PATCH',
    token,
    body: { isActive },
  });
}

export function updateAdminUserRole(userId, role, token) {
  return apiRequest(`${getUserPath(userId)}/role`, {
    method: 'PATCH',
    token,
    body: { role },
  });
}

export function resetAdminUserPassword(userId, temporaryPassword, token) {
  return apiRequest(`${getUserPath(userId)}/password`, {
    method: 'PATCH',
    token,
    body: { temporaryPassword },
  });
}

export function deleteAdminUser(userId, token) {
  return apiRequest(getUserPath(userId), {
    method: 'DELETE',
    token,
  });
}
