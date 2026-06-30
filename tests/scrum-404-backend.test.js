const { execSync } = require('child_process');

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
      ...(options.headers || {}),
    },
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

async function createUser(prefix, password = '12345678Aa') {
  const username = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const register = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      fullName: 'SCRUM 404 User',
      phone: '0500000000',
      address: 'Holon',
    }),
  });

  expect(
    register.response.status === 201,
    `register expected 201, got ${register.response.status}`
  );

  return { username, password, user: register.data };
}

async function login(username, password) {
  const loginResponse = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  expect(
    loginResponse.response.status === 200,
    `login expected 200, got ${loginResponse.response.status}`
  );
  expect(loginResponse.data?.token, 'missing token');

  return loginResponse.data.token;
}

function getIdFromLocation(response) {
  return response.headers.get('location')?.split('/').filter(Boolean).pop();
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const { response } = await request('/api/health');
      if (response.status === 200) return;
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('server did not come back after restart');
}

async function main() {
  let owner;
  let ownerToken;
  let otherToken;
  let restaurantId;
  let categoryId;
  let productId;

  await scenario('MongoDB user CRUD creates user and login works', async () => {
    owner = await createUser('scrum404_owner');
    ownerToken = await login(owner.username, owner.password);

    expect(ownerToken.split('.').length === 3, 'token is not JWT');
  });

  await scenario('validation rejects invalid user registration', async () => {
    const { response } = await request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        username: 'ab',
        password: '1',
        fullName: '',
        phone: '',
        address: '',
      }),
    });

    expect(
      response.status >= 400,
      `expected validation error, got ${response.status}`
    );
  });

  await scenario('authorized user can create restaurant', async () => {
    const { response, data } = await request('/api/restaurants', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        name: `SCRUM 404 Restaurant ${Date.now()}`,
        address: 'Test address',
        phone: '03-0000000',
        cuisine: 'Test',
        description: 'Persistence test restaurant',
        image: 'https://example.com/restaurant.jpg',
      }),
    });

    expect(response.status === 201, `expected 201, got ${response.status}`);
    expect(data?.id, 'missing restaurant id');

    restaurantId = data.id;
  });

  await scenario('authorization rejects restaurant create without token', async () => {
    const { response } = await request('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify({ name: 'No Token Restaurant' }),
    });

    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario('validation rejects restaurant without name', async () => {
    const { response } = await request('/api/restaurants', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ address: 'No name' }),
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await scenario('owner can create menu category', async () => {
    const { response, data } = await request(
      `/api/restaurants/${restaurantId}/menu-categories`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          name: 'Main',
          menuType: 'main',
        }),
      }
    );

    expect(response.status === 201, `expected 201, got ${response.status}`);
    expect(data?.id, 'missing category id');

    categoryId = data.id;
  });

  await scenario('owner can create product', async () => {
    const { response } = await request(
      `/api/restaurants/${restaurantId}/products`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          name: 'SCRUM 404 Product',
          price: 25,
          categoryId,
          description: 'Test menu item',
          image: 'https://example.com/product.jpg',
        }),
      }
    );

    expect(response.status === 201, `expected 201, got ${response.status}`);

    productId = getIdFromLocation(response);
    expect(productId, 'missing product id');
  });

  await scenario('validation rejects product with negative price', async () => {
    const { response } = await request(
      `/api/restaurants/${restaurantId}/products`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          name: 'Bad Product',
          price: -1,
          categoryId,
        }),
      }
    );

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await scenario('other user cannot update owner product', async () => {
    const other = await createUser('scrum404_other');
    otherToken = await login(other.username, other.password);

    const { response } = await request(
      `/api/restaurants/${restaurantId}/products/${productId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${otherToken}` },
        body: JSON.stringify({ price: 99 }),
      }
    );

    expect(response.status === 403, `expected 403, got ${response.status}`);
  });

  await scenario('owner can update product', async () => {
    const { response } = await request(
      `/api/restaurants/${restaurantId}/products/${productId}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ price: 30 }),
      }
    );

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await scenario('restart persistence keeps MongoDB data after web-server restart', async () => {
    execSync('docker compose restart web-server', { stdio: 'inherit' });
    await waitForServer();

    const { response, data } = await request(
      `/api/restaurants/${restaurantId}/products`
    );

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'products response is not array');
    expect(
      data.some(
        (product) =>
          String(product.id) === String(productId) &&
          Number(product.price) === 30
      ),
      'updated product did not persist after restart'
    );
  });

  await scenario('owner can delete product', async () => {
    const { response } = await request(
      `/api/restaurants/${restaurantId}/products/${productId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      }
    );

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await scenario('test cleanup removes the temporary restaurant', async () => {
    if (!restaurantId) {
      throw new Error(
        'Cannot clean up because the test restaurant was not created.'
      );
    }

    if (!ownerToken) {
      throw new Error(
        'Cannot clean up because the owner token is unavailable.'
      );
    }

    const { response } = await request(
      `/api/restaurants/${restaurantId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      }
    );

    expect(
      response.status === 204,
      `cleanup expected 204, got ${response.status}`
    );

    console.log('Cleanup - SCRUM-404 test restaurant deleted.');
  });

  const passed = results.filter(Boolean).length;
  console.log(
    `\nSCRUM-404 SUMMARY: ${passed} passed, ${results.length - passed} failed`
  );

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main();