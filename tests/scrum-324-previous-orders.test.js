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

async function createUserAndToken(prefix) {
  const username = `${prefix}_${Date.now()}`;

  await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: 'TestPass123',
      fullName: 'Previous Orders User',
      phone: '0500000000',
      address: 'Test Address'
    })
  });

  const login = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({ username, password: 'TestPass123' })
  });

  expect(login.response.status === 200, `login expected 200, got ${login.response.status}`);
  expect(login.data?.token, 'missing token');

  return login.data.token;
}

async function createOrder(token, price) {
  const { response, data } = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      restaurantId: 1,
      items: [{ productId: 'pizza-margherita', quantity: 2, price }]
    })
  });

  expect(response.status === 201, `create order expected 201, got ${response.status}`);
  expect(data?.id, 'missing created order id');

  return data;
}

async function main() {
  let tokenA;
  let tokenB;
  let orderA;

  await scenario('login returns JWT for first user', async () => {
    tokenA = await createUserAndToken('previous_user_a');
    expect(tokenA.split('.').length === 3, 'token is not JWT');
  });

  await scenario('previous orders without token is rejected', async () => {
    const { response } = await request('/api/orders');
    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario('new user can fetch empty previous orders list', async () => {
    const { response, data } = await request('/api/orders', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'orders response is not array');
  });

  await scenario('created order stores restaurant and menu item snapshots', async () => {
    orderA = await createOrder(tokenA, 25);

    expect(orderA.restaurantName === 'Pizza Roma', `expected Pizza Roma, got ${orderA.restaurantName}`);
    expect(orderA.items?.[0]?.productName === 'Margherita Pizza', 'missing product name snapshot');
    expect(orderA.items?.[0]?.quantity === 2, 'wrong item quantity snapshot');
  });

  await scenario('created order appears in previous orders with readable details', async () => {
    const { response, data } = await request('/api/orders', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);

    const previousOrder = data.find((order) => String(order.id) === String(orderA.id));
    expect(previousOrder, 'created order not found');
    expect(previousOrder.restaurantName === 'Pizza Roma', 'previous order is missing restaurant name');
    expect(previousOrder.items?.[0]?.productName === 'Margherita Pizza', 'previous order is missing product name');
    expect(previousOrder.items?.[0]?.quantity === 2, 'previous order is missing item quantity');
  });

  await scenario('get previous order by id succeeds for owner', async () => {
    const { response, data } = await request(`/api/orders/${orderA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(String(data.id) === String(orderA.id), 'wrong order returned');
    expect(data.restaurantName === 'Pizza Roma', 'order details are missing restaurant name');
  });

  await scenario('another user cannot see first user order by id', async () => {
    tokenB = await createUserAndToken('previous_user_b');

    const { response } = await request(`/api/orders/${orderA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    expect(response.status === 404, `expected 404, got ${response.status}`);
  });

  const passed = results.filter(Boolean).length;
  console.log(`\nSCRUM-324 SUMMARY: ${passed} passed, ${results.length - passed} failed`);
}

main();
