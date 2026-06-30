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
  const username = `delivery_snapshot_${suffix}`;

  const register = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: 'TestPass123',
      fullName: 'Delivery Snapshot User',
      phone: '050-1234567',
      address: '10 Snapshot Street, Jerusalem'
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
      password: 'TestPass123'
    })
  });

  expect(
    login.response.status === 200,
    `login expected 200, got ${login.response.status}`
  );

  expect(login.data?.token, 'missing authentication token');

  return login.data.token;
}

async function createOrder(token, deliveryDetails) {
  return request('/api/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      restaurantId: 1,
      items: [
        {
          productId: 'pizza-margherita',
          quantity: 1
        }
      ],
      ...(deliveryDetails === undefined
        ? {}
        : { deliveryDetails })
    })
  });
}

async function main() {
  let token;
  let defaultOrder;
  let customOrder;

  await scenario('register and authenticate customer', async () => {
    token = await createUserAndToken();
    expect(token.split('.').length === 3, 'token is not a JWT');
  });

  await scenario('order without delivery details uses profile defaults', async () => {
    const { response, data } = await createOrder(token);

    expect(
      response.status === 201,
      `expected 201, got ${response.status}`
    );

    expect(data?.deliveryDetails, 'missing delivery details snapshot');
    expect(
      data.deliveryDetails.recipientName === 'Delivery Snapshot User',
      'recipient name did not default from user profile'
    );
    expect(
      data.deliveryDetails.phone === '050-1234567',
      'phone did not default from user profile'
    );
    expect(
      data.deliveryDetails.address ===
        '10 Snapshot Street, Jerusalem',
      'address did not default from user profile'
    );
    expect(
      data.deliveryDetails.dinerCount === 1,
      `expected default diner count 1, got ${data.deliveryDetails.dinerCount}`
    );
    expect(
      data.deliveryDetails.notes === '',
      'expected empty default delivery notes'
    );
    expect(
      data.deliveryDetails.location === null,
      'expected no saved location when profile has no coordinates'
    );

    defaultOrder = data;
  });

  await scenario('order saves validated custom delivery details', async () => {
    const { response, data } = await createOrder(token, {
      recipientName: 'Ido Delivery',
      phone: '052-7654321',
      address: '22 Custom Delivery Road, Jerusalem',
      dinerCount: 3,
      notes: 'Please ring the doorbell once.',
      location: {
        latitude: 31.7683,
        longitude: 35.2137
      }
    });

    expect(
      response.status === 201,
      `expected 201, got ${response.status}`
    );

    expect(
      data.deliveryDetails.recipientName === 'Ido Delivery',
      'wrong custom recipient name'
    );
    expect(
      data.deliveryDetails.dinerCount === 3,
      'wrong custom diner count'
    );
    expect(
      data.deliveryDetails.notes ===
        'Please ring the doorbell once.',
      'wrong custom delivery notes'
    );
    expect(
      data.deliveryDetails.location?.latitude === 31.7683,
      'wrong saved latitude'
    );
    expect(
      data.deliveryDetails.location?.longitude === 35.2137,
      'wrong saved longitude'
    );
    expect(
      data.deliveryDetails.location?.source === 'shared',
      'expected shared location source'
    );

    customOrder = data;
  });

  await scenario('current location can replace a manual address', async () => {
    const { response, data } = await createOrder(token, {
      recipientName: 'Location Delivery',
      phone: '053-1112233',
      address: '',
      dinerCount: 2,
      notes: 'Call when you arrive.',
      location: {
        latitude: 31.778,
        longitude: 35.235
      }
    });

    expect(
      response.status === 201,
      `expected 201, got ${response.status}`
    );

    expect(
      data?.deliveryDetails?.address === '',
      'expected an empty address for current-location delivery'
    );
    expect(
      data?.deliveryDetails?.location?.latitude === 31.778,
      'wrong current-location latitude'
    );
    expect(
      data?.deliveryDetails?.location?.longitude === 35.235,
      'wrong current-location longitude'
    );
    expect(
      data?.deliveryDetails?.location?.source === 'shared',
      'expected current location to be marked as shared'
    );
  });

  await scenario('blank address without a location is rejected', async () => {
    const { response } = await createOrder(token, {
      address: '',
      location: null
    });

    expect(
      response.status === 400,
      `expected 400, got ${response.status}`
    );
  });

  await scenario('saved details are returned in previous-order views', async () => {
    const byId = await request(`/api/orders/${customOrder.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(
      byId.response.status === 200,
      `get by id expected 200, got ${byId.response.status}`
    );

    expect(
      byId.data?.deliveryDetails?.address ===
        '22 Custom Delivery Road, Jerusalem',
      'order details are missing saved delivery address'
    );

    const list = await request('/api/orders', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(
      list.response.status === 200,
      `orders list expected 200, got ${list.response.status}`
    );

    const fromList = list.data.find(
      (order) => String(order.id) === String(defaultOrder.id)
    );

    expect(fromList, 'default order was missing from previous orders');
    expect(
      fromList.deliveryDetails?.dinerCount === 1,
      'previous orders are missing delivery details'
    );
  });

  await scenario('invalid diner count is rejected', async () => {
    const { response } = await createOrder(token, {
      dinerCount: 0
    });

    expect(
      response.status === 400,
      `expected 400, got ${response.status}`
    );
  });

  await scenario('partial location is rejected', async () => {
    const { response } = await createOrder(token, {
      location: {
        latitude: 31.7683
      }
    });

    expect(
      response.status === 400,
      `expected 400, got ${response.status}`
    );
  });

  await scenario('delivery details cannot be changed after creation', async () => {
    const { response } = await request(
      `/api/orders/${customOrder.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryDetails: {
            dinerCount: 5
          }
        })
      }
    );

    expect(
      response.status === 400,
      `expected 400, got ${response.status}`
    );
  });

  const passed = results.filter(Boolean).length;

  console.log(
    `\nSCRUM-437 SUMMARY: ${passed} passed, ` +
    `${results.length - passed} failed`
  );

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main();