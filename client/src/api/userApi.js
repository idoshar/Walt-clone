import { apiRequest } from './client.js';

export function lookupUserByUsername(username) {
  const query = new URLSearchParams({
    username: String(username || '').trim()
  });

  return apiRequest(`/users/lookup?${query.toString()}`);
}

export function updateCurrentUserProfile(profile) {
  return apiRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(profile)
  });
}

export function updateCurrentUserLocation(location) {
  return apiRequest('/users/me/location', {
    method: 'PATCH',
    body: JSON.stringify(location)
  });
}

export function updateCurrentUserImage(image) {
  return apiRequest('/users/me/image', {
    method: 'PATCH',
    body: JSON.stringify({ image })
  });
}
