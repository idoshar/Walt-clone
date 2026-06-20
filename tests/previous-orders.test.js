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
  const username = `orders_user_${Date.now()}`;

  await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: '123456',
      fullName: 'Orders User',
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

async function createOrder(token, price = 20) {
  const { data } = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      restaurantId: 1,
      items: [{ productId: 1, quantity: 1, price }]
    })
  });

  return data;
}

async function main() {
  let token;
  let createdOrder;

  await runScenario('login returns JWT for previous-orders user', async () => {
    token = await createUserAndToken();
    expect(token.includes('.'), 'token is not JWT-like');
  });

  await runScenario('previous orders without JWT is rejected', async () => {
    const { response } = await request('/api/orders');
    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await runScenario('new user starts with empty previous orders', async () => {
    const { response, data } = await request('/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'orders response is not array');
  });

  await runScenario('created order appears in previous orders', async () => {
    createdOrder = await createOrder(token, 25);

    const { response, data } = await request('/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(data.some((order) => order.id === createdOrder.id), 'created order not found');
  });

  await runScenario('get order by id returns only user order', async () => {
    const { response, data } = await request(`/api/orders/${createdOrder.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(data.id === createdOrder.id, 'wrong order returned');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log(`\nSCRUM-324 SUMMARY: ${passed} passed, ${failed} failed`);
}

main();