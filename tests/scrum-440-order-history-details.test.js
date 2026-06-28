const BASE_URL = 'http://localhost:3000';
const results = [];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
  } catch (error) {
    results.push(false);
    console.log(`FAIL - ${name}: ${error.message}`);
  }
}

async function createUserAndToken() {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const username = `order_history_${suffix}`;

  const register = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: '123456',
      fullName: 'Order History Customer',
      phone: '052-4444444',
      address: '40 History Street, Jerusalem'
    })
  });

  expect(
    register.response.status === 201,
    `register expected 201, got ${register.response.status}`
  );

  const login = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: '123456'
    })
  });

  expect(
    login.response.status === 200,
    `login expected 200, got ${login.response.status}`
  );

  expect(login.data?.token, 'missing JWT token');

  return login.data.token;
}

async function main() {
  let token;
  let restaurant;
  let createdOrder;

  await scenario('load restaurant used for image snapshot', async () => {
    const result = await request('/api/restaurants/1');

    expect(
      result.response.status === 200,
      `restaurant expected 200, got ${result.response.status}`
    );

    restaurant = result.data?.restaurant || result.data;

    expect(restaurant?.id, 'restaurant response is missing id');
  });

  await scenario('register and authenticate customer', async () => {
    token = await createUserAndToken();
  });

  await scenario('create order saves restaurant image and delivery details', async () => {
    const result = await request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        items: [
          {
            productId: 'pizza-margherita',
            quantity: 1
          }
        ],
        deliveryDetails: {
          recipientName: 'Order History Recipient',
          phone: '052-3333333',
          address: '7 Snapshot Avenue, Jerusalem',
          dinerCount: 2,
          notes: 'Leave the order with reception.'
        }
      })
    });

    expect(
      result.response.status === 201,
      `order expected 201, got ${result.response.status}`
    );

    createdOrder = result.data;

    expect(
      createdOrder.restaurantImage ===
        (typeof restaurant.image === 'string'
          ? restaurant.image
          : ''),
      'restaurant image was not saved as an order snapshot'
    );

    expect(
      createdOrder.deliveryDetails?.address ===
        '7 Snapshot Avenue, Jerusalem',
      'delivery address was not saved in response'
    );

    expect(
      createdOrder.deliveryDetails?.dinerCount === 2,
      'diner count was not saved in response'
    );
  });

  await scenario('previous orders include saved image and delivery details', async () => {
    const result = await request('/api/orders', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(
      result.response.status === 200,
      `orders list expected 200, got ${result.response.status}`
    );

    const listedOrder = result.data.find(
      (order) => String(order.id) === String(createdOrder.id)
    );

    expect(listedOrder, 'created order is missing from previous orders');

    expect(
      listedOrder.restaurantImage === createdOrder.restaurantImage,
      'previous orders response is missing restaurant image snapshot'
    );

    expect(
      listedOrder.deliveryDetails?.recipientName ===
        'Order History Recipient',
      'previous orders response is missing recipient name'
    );

    expect(
      listedOrder.deliveryDetails?.notes ===
        'Leave the order with reception.',
      'previous orders response is missing delivery notes'
    );
  });

  const passed = results.filter(Boolean).length;

  console.log(
    `\nSCRUM-440 SUMMARY: ${passed} passed, ` +
    `${results.length - passed} failed`
  );

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main();
