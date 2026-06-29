import { apiRequest } from './client';

export async function lookupUserByUsername(token, username) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    throw new Error('Enter a username.');
  }

  return apiRequest(
    `/users/lookup?username=${encodeURIComponent(normalizedUsername)}`,
    {
      token,
    }
  );
}

export function updateCurrentUserImage(token, image) {
  return apiRequest('/users/me/image', {
    method: 'PATCH',
    token,
    body: { image },
  });
}