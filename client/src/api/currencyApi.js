import { apiRequest } from './client.js';

export function getCurrencyRates() {
  return apiRequest('/currency/rates');
}
