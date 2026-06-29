import { apiRequest } from './client';

export function getAdminStatistics(token) {
  return apiRequest('/admin/statistics', { token });
}
