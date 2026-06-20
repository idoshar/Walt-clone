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
  const username = `test_user_${Date.now()}`;

  await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: '123456',
      fullName: 'Test User',
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

  await runScenario('login returns JWT for test user', async () => {
    token = await createUserAndToken();
    expect(token.includes('.'), 'token is not JWT-like');
  });

  await runScenario('create order without JWT is rejected', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ restaurantId: 1, items: [] })
    });

    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await runScenario('create order with missing restaurantId fails', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ productId: 1, quantity: 1, price: 10 }] })
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await runScenario('create order with empty items fails', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restaurantId: 1, items: [] })
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await runScenario('create order with valid JWT and valid items succeeds', async () => {
    const { response, data } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: 1,
        items: [{ productId: 1, quantity: 2, price: 30 }]
      })
    });

    expect(response.status === 201, `expected 201, got ${response.status}`);
    expect(data.totalPrice === 60, `expected totalPrice 60, got ${data.totalPrice}`);
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log(`\nSCRUM-323 SUMMARY: ${passed} passed, ${failed} failed`);
}

main();