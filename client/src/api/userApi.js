import { apiRequest } from './client.js';

export function updateCurrentUserLocation(location) {
  return apiRequest('/users/me/location', {
    method: 'PATCH',
    body: JSON.stringify(location)
  });
}