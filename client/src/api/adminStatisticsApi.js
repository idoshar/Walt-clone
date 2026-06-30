import { apiRequest } from './client.js';

export function getAdminStatistics() {
  return apiRequest('/admin/statistics');
}
