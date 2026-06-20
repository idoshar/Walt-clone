const BASE_URL = 'http://localhost:3000';

const results = [];

async function runScenario(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS - ${name}`);
  } catch (err) {
    results.push({ name, ok: false });
    console.log(`FAIL - ${name}: ${err.message}`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { response, data };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function createUserAndToken() {
  const username = `management_user_${Date.now()}`;

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

  expect(login.data.token, 'login did not return token');
  return login.data.token;
}

async function main() {
  let token;
  let restaurantLocation;
  let restaurantId;
  let productLocation;
  let productId;

  await runScenario('login returns JWT for management user', async () => {
    token = await createUserAndToken();
    expect(token.includes('.'), 'token is not JWT-like');
  });

  await runScenario('get restaurants works', async () => {
    const { response, data } = await request('/api/restaurants');
    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'restaurants response is not array');
  });

  await runScenario('create restaurant succeeds', async () => {
    const { response } = await request('/api/restaurants', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: `Test Restaurant ${Date.now()}`,
        address: 'Test Street 1',
        phone: '03-0000000',
        cuisine: 'Test',
        description: 'Created by automated scenario'
      })
    });

    expect(response.status === 201, `expected 201, got ${response.status}`);
    restaurantLocation = response.headers.get('location');
    expect(restaurantLocation, 'missing restaurant location header');
    restaurantId = restaurantLocation.split('/').pop();
  });

  await runScenario('update restaurant succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description: 'Updated description' })
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
  });

  await runScenario('create product succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: `Test Product ${Date.now()}`,
        price: 42,
        description: 'Test product',
        category: 'Test'
      })
    });

    expect(response.status === 201, `expected 201, got ${response.status}`);
    productLocation = response.headers.get('location');
    expect(productLocation, 'missing product location header');
    productId = productLocation.split('/').pop();
  });

  await runScenario('get products includes created product', async () => {
    const { response, data } = await request(`/api/restaurants/${restaurantId}/products`);

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'products response is not array');
    expect(data.some((product) => String(product.id) === String(productId)), 'product not found');
  });

  await runScenario('update product succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price: 55 })
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
  });

  await runScenario('delete product succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await runScenario('delete restaurant succeeds', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log(`\nSCRUM-325 SUMMARY: ${passed} passed, ${failed} failed`);
}

main();