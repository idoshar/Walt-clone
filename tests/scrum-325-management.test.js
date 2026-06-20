const BASE_URL = 'http://localhost:3000';
const results = [];

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { response, data };
}

async function scenario(name, fn) {
  try {
    await fn();
    results.push(true);
    console.log(`PASS - ${name}`);
  } catch (err) {
    results.push(false);
    console.log(`FAIL - ${name}: ${err.message}`);
  }
}

function getIdFromLocation(response) {
  const location = response.headers.get('location');
  return location?.split('/').filter(Boolean).pop();
}

async function createUserAndToken(prefix) {
  const username = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: '123456',
      fullName: 'Management User',
      phone: '0500000000',
      address: 'Test Address'
    })
  });

  const login = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({ username, password: '123456' })
  });

  expect(login.response.status === 200, `login expected 200, got ${login.response.status}`);
  expect(login.data?.token, 'missing token');

  return login.data.token;
}

async function createRestaurant(token, name) {
  const { response } = await request('/api/restaurants', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      address: 'Test Street 1',
      phone: '03-0000000',
      cuisine: 'Test',
      description: 'Created by management test'
    })
  });

  expect(response.status === 201, `create restaurant expected 201, got ${response.status}`);

  const restaurantId = getIdFromLocation(response);
  expect(restaurantId, 'missing restaurant id from Location header');

  return restaurantId;
}

async function createProduct(token, restaurantId, name) {
  const { response } = await request(`/api/restaurants/${restaurantId}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      price: 42,
      description: 'Test product',
      category: 'Test'
    })
  });

  expect(response.status === 201, `create product expected 201, got ${response.status}`);

  const productId = getIdFromLocation(response);
  expect(productId, 'missing product id from Location header');

  return productId;
}

async function main() {
  let ownerToken;
  let otherToken;
  let restaurantId;
  let productId;

  await scenario('management user login returns JWT', async () => {
    ownerToken = await createUserAndToken('management_owner');
    expect(ownerToken.split('.').length === 3, 'token is not JWT');
  });

  await scenario('public restaurants list works', async () => {
    const { response, data } = await request('/api/restaurants');

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'restaurants response is not array');
    expect(data.some((r) => r.isDefault === true), 'default restaurants should exist');
  });

  await scenario('create restaurant without JWT is rejected', async () => {
    const { response } = await request('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({ name: 'No Token Restaurant' })
    });

    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario('create restaurant with missing name fails', async () => {
    const { response } = await request('/api/restaurants', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ address: 'No Name Street' })
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await scenario('create restaurant with JWT succeeds and has ownerId', async () => {
    restaurantId = await createRestaurant(ownerToken, `My Test Restaurant ${Date.now()}`);

    const { response, data } = await request(`/api/restaurants/${restaurantId}`);

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(String(data.id) === String(restaurantId), 'wrong restaurant returned');
    expect(data.isDefault === false, 'created restaurant should not be default');
    expect(data.ownerId, 'created restaurant missing ownerId');
  });

  await scenario('owner can update own restaurant', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ description: 'Updated by owner' })
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await scenario('other user cannot update owner restaurant', async () => {
    otherToken = await createUserAndToken('management_other');

    const { response } = await request(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({ description: 'Wrong user update' })
    });

    expect(response.status === 403, `expected 403, got ${response.status}`);
  });

  await scenario('default restaurant cannot be deleted by regular user', async () => {
    const { response } = await request('/api/restaurants/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    expect(response.status === 403, `expected 403, got ${response.status}`);
  });

  await scenario('create product for managed restaurant succeeds', async () => {
    productId = await createProduct(ownerToken, restaurantId, `My Test Product ${Date.now()}`);
    expect(productId, 'product id missing');
  });

  await scenario('get products includes created product', async () => {
    const { response, data } = await request(`/api/restaurants/${restaurantId}/products`);

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'products response is not array');
    expect(data.some((product) => String(product.id) === String(productId)), 'created product not found');
  });

  await scenario('update product succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ price: 55 })
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await scenario('delete product succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await scenario('owner can delete own restaurant', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  const passed = results.filter(Boolean).length;
  console.log(`\nSCRUM-325 SUMMARY: ${passed} passed, ${results.length - passed} failed`);
}

main();