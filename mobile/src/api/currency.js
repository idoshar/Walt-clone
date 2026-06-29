import { apiRequest } from './client';

export function getCurrencyRates({ signal } = {}) {
  return apiRequest('/currency/rates', { signal });
}
