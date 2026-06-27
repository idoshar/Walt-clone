import { apiRequest } from './client';

export async function loginWithCredentials(username, password) {
  return apiRequest('/tokens', {
    method: 'POST',
    body: {
      username,
      password,
    },
  });
}

export async function registerUser({
  username,
  password,
  fullName,
  phone,
  address,
}) {
  return apiRequest('/users', {
    method: 'POST',
    body: {
      username,
      password,
      fullName,
      phone,
      address,
    },
  });
}