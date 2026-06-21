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

  const register = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: '123456',
      fullName: 'Test User',
      phone: '0500000000',
      address: 'Test Address'
    })
  });

  expect(register.response.status === 201, `register expected 201, got ${register.response.status}`);

  const login = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({ username, password: '123456' })
  });

  expect(login.response.status === 200, `login expected 200, got ${login.response.status}`);
  expect(login.data?.token, 'missing token');

  return login.data.token;
}

async function main() {
  let token;
  let orderId;

  await scenario('login returns valid JWT', async () => {
    token = await createUserAndToken('order_user');
    expect(token.split('.').length === 3, 'token is not JWT');
  });

  await scenario('create order without token is rejected', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId: 1,
        items: [{ productId: 'pizza-margherita', quantity: 1, price: 52 }]
      })
    });

    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario('create order with invalid token is rejected', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong.token.value' },
      body: JSON.stringify({
        restaurantId: 1,
        items: [{ productId: 'pizza-margherita', quantity: 1, price: 52 }]
      })
    });

    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario('create order without restaurantId fails', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: 'pizza-margherita', quantity: 1, price: 52 }]
      })
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await scenario('create order with invalid restaurant fails', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: 999999,
        items: [{ productId: 'pizza-margherita', quantity: 1, price: 52 }]
      })
    });

    expect(response.status === 404, `expected 404, got ${response.status}`);
  });

  await scenario('create order with empty items fails', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: 1,
        items: []
      })
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await scenario('create order with invalid item fails', async () => {
    const { response } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: 1,
        items: [{ productId: 'pizza-margherita', quantity: 0, price: 52 }]
      })
    });

    expect(response.status === 400, `expected 400, got ${response.status}`);
  });

  await scenario('create order with valid data succeeds', async () => {
    const { response, data } = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: 1,
        items: [
          { productId: 'pizza-margherita', quantity: 2, price: 52 },
          { productId: 'tiramisu', quantity: 1, price: 32 }
        ]
      })
    });

    expect(response.status === 201, `expected 201, got ${response.status}`);
    expect(data?.id, 'missing order id');
    expect(data.totalPrice === 136, `expected totalPrice 136, got ${data?.totalPrice}`);

    orderId = data.id;
  });

  await scenario('created order can be updated', async () => {
    const { response } = await request(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'confirmed' })
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  await scenario('created order can be deleted', async () => {
    const { response } = await request(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status === 204, `expected 204, got ${response.status}`);
  });

  const passed = results.filter(Boolean).length;
  console.log(`\nSCRUM-323 SUMMARY: ${passed} passed, ${results.length - passed} failed`);
}

main();