import { apiRequest } from './client';

export function checkBackendHealth() {
  return apiRequest('/health');
}
