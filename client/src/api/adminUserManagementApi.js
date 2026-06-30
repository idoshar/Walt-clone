import { apiRequest } from './client.js';

function getUserPath(userId = '') {
  const normalizedId = String(userId || '').trim();

  if (!normalizedId) {
    throw new Error('A user id is required.');
  }

  return `/admin/users/${encodeURIComponent(normalizedId)}`;
}

export function getAdminUsers(query = '') {
  const normalizedQuery = String(query || '').trim();
  const suffix = normalizedQuery
    ? `?q=${encodeURIComponent(normalizedQuery)}`
    : '';

  return apiRequest(`/admin/users${suffix}`);
}

export function updateAdminUserStatus(userId, isActive) {
  return apiRequest(`${getUserPath(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
}

export function updateAdminUserRole(userId, role) {
  return apiRequest(`${getUserPath(userId)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export function resetAdminUserPassword(userId, temporaryPassword) {
  return apiRequest(`${getUserPath(userId)}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ temporaryPassword })
  });
}

export function deleteAdminUser(userId) {
  return apiRequest(getUserPath(userId), {
    method: 'DELETE'
  });
}

function getPasswordResetRequestPath(requestId = '') {
  const normalizedId = String(requestId || '').trim();

  if (!normalizedId) {
    throw new Error('A password-reset request id is required.');
  }

  return `/admin/password-reset-requests/${encodeURIComponent(normalizedId)}`;
}

export function getAdminPasswordResetRequests(status = 'pending') {
  const normalizedStatus = String(status || 'pending').trim();

  return apiRequest(
    `/admin/password-reset-requests?status=${encodeURIComponent(
      normalizedStatus
    )}`
  );
}

export function approveAdminPasswordResetRequest(
  requestId,
  temporaryPassword
) {
  return apiRequest(`${getPasswordResetRequestPath(requestId)}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({
      temporaryPassword
    })
  });
}

export function rejectAdminPasswordResetRequest(requestId) {
  return apiRequest(`${getPasswordResetRequestPath(requestId)}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({})
  });
}
