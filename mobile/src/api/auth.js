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
  image = '',
}) {
  return apiRequest('/users', {
    method: 'POST',
    body: {
      username,
      password,
      fullName,
      phone,
      address,
      image,
    },
  });
}

export async function changeCurrentPassword(
  token,
  currentPassword,
  newPassword
) {
  return apiRequest('/users/me/password', {
    method: 'PATCH',
    token,
    body: {
      currentPassword,
      newPassword,
    },
  });
}
