import { apiRequest } from './client';

export function getMyRestaurants(token) {
  return apiRequest('/restaurants/mine', {
    token,
  });
}