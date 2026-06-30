import { apiRequest } from './client';

export function submitPasswordResetRequest(username) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    throw new Error('Username is required.');
  }

  return apiRequest('/password-reset-requests', {
    method: 'POST',
    body: {
      username: normalizedUsername,
    },
  });
}