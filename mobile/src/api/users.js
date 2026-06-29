import { apiRequest } from './client';

export function updateCurrentUserImage(token, image) {
  return apiRequest('/users/me/image', {
    method: 'PATCH',
    token,
    body: { image },
  });
}
