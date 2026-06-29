const crypto = require('crypto');

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

async function scenario(name, callback) {
  try {
    await callback();
    results.push(true);
    console.log(`PASS - ${name}`);
  } catch (error) {
    results.push(false);
    console.log(`FAIL - ${name}: ${error.message}`);
  }
}

function createAdminToken() {
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64url');

  const payload = Buffer.from(
    JSON.stringify({
      sub: `scrum480_admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      username: 'scrum480-admin',
      fullName: 'SCRUM 480 Administrator',
      role: 'admin',
      iat: now,
      exp: now + 900,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac(
      'sha256',
      process.env.JWT_SECRET || 'dev-secret-for-course-project'
    )
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

async function createUser(prefix, password = '12345678Aa') {
  const username = `${prefix}_${Date.now()}_${Math.floor(
    Math.random() * 1000
  )}`;

  const { response, data } = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      fullName: 'SCRUM 480 Customer',
      phone: '0500000000',
      address: 'Jerusalem',
    }),
  });

  expect(
    response.status === 201,
    `user registration expected 201, got ${response.status}`
  );

  return { username, password, user: data };
}

async function login(username, password) {
  const { response, data } = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  expect(
    response.status === 200,
    `login expected 200, got ${response.status}`
  );

  expect(data?.token, 'login response did not contain a token');

  return data.token;
}

function getIdFromLocation(response) {
  return response.headers
    .get('location')
    ?.split('/')
    .filter(Boolean)
    .pop();
}

function hasNumericStatisticsShape(data) {
  const expectedFields = [
    'users',
    'restaurants',
    'menuItems',
    'orders',
    'totalRevenue',
    'averageOrderValue',
  ];

  return expectedFields.every(
    (field) => typeof data?.[field] === 'number'
  );
}

async function waitForServer() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const { response } = await request('/api/health');

      if (response.status === 200) {
        console.log(`Server ready after ${attempt} attempt(s).`);
        return;
      }
    } catch {
      // The container may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('server did not become ready within 30 seconds');
}

async function main() {
  let customerToken;
  let adminToken;
  let protectedRestaurant;
  let temporaryRestaurantId;
  let temporaryCategoryId;
  let temporaryProductId;

  try {
    await waitForServer();

    await scenario('health endpoint is available', async () => {
      const { response } = await request('/api/health');

      expect(
        response.status === 200,
        `health expected 200, got ${response.status}`
      );
    });

    await scenario('create a regular customer session', async () => {
      const customer = await createUser('scrum480_customer');
      customerToken = await login(customer.username, customer.password);
      adminToken = createAdminToken();

      expect(customerToken.split('.').length === 3, 'customer token is invalid');
      expect(adminToken.split('.').length === 3, 'admin token is invalid');
    });

    await scenario('moderation list rejects unauthenticated requests', async () => {
      const { response } = await request('/api/admin/restaurants');

      expect(
        response.status === 401,
        `expected 401 without moderation token, got ${response.status}`
      );
    });

    await scenario('moderation list rejects non-admin users', async () => {
      const { response } = await request('/api/admin/restaurants', {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(
        response.status === 403,
        `expected 403 for non-admin moderation request, got ${response.status}`
      );
    });

    await scenario('platform insights rejects unauthenticated requests', async () => {
      const { response } = await request('/api/admin/statistics');

      expect(
        response.status === 401,
        `expected 401 without statistics token, got ${response.status}`
      );
    });

    await scenario('platform insights rejects non-admin users', async () => {
      const { response } = await request('/api/admin/statistics', {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      expect(
        response.status === 403,
        `expected 403 for non-admin statistics request, got ${response.status}`
      );
    });

    await scenario('admin can load moderation list and protected catalog', async () => {
      const { response, data } = await request('/api/admin/restaurants', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(
        response.status === 200,
        `admin moderation list expected 200, got ${response.status}`
      );

      expect(Array.isArray(data), 'moderation list must be an array');

      protectedRestaurant = data.find(
        (restaurant) => restaurant?.isModerationProtected === true
      );

      expect(
        protectedRestaurant?.id,
        'expected at least one protected system catalog restaurant'
      );
    });

    await scenario('admin can load platform insight statistics', async () => {
      const { response, data } = await request('/api/admin/statistics', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(
        response.status === 200,
        `admin statistics expected 200, got ${response.status}`
      );

      expect(
        hasNumericStatisticsShape(data),
        'statistics response does not contain expected numeric metrics'
      );

      expect(
        data?.orderStatuses &&
          typeof data.orderStatuses === 'object' &&
          !Array.isArray(data.orderStatuses),
        'statistics response must contain an orderStatuses object'
      );
    });

    await scenario('protected catalog restaurant cannot be edited', async () => {
      const { response } = await request(
        `/api/admin/restaurants/${protectedRestaurant.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: 'This protected catalog name must not be saved',
          }),
        }
      );

      expect(
        response.status === 403,
        `protected restaurant update expected 403, got ${response.status}`
      );
    });

    await scenario('admin can create a temporary non-system restaurant', async () => {
      const { response, data } = await request('/api/restaurants', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: `SCRUM 480 Automated Test ${Date.now()}`,
          address: '10 Admin Street, Tel Aviv',
          phone: '03-4800480',
          cuisine: 'Verification',
          description:
            'Temporary restaurant for automated administrator moderation verification.',
          latitude: 32.0853,
          longitude: 34.7818,
        }),
      });

      expect(
        response.status === 201,
        `temporary restaurant creation expected 201, got ${response.status}`
      );

      temporaryRestaurantId = data?.id;
      expect(temporaryRestaurantId, 'temporary restaurant id is missing');
    });

    await scenario('temporary restaurant can receive menu category and product', async () => {
      const categoryResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/menu-categories`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: 'Verification mains',
            menuType: 'main',
          }),
        }
      );

      expect(
        categoryResponse.response.status === 201,
        `menu category expected 201, got ${categoryResponse.response.status}`
      );

      temporaryCategoryId = categoryResponse.data?.id;
      expect(temporaryCategoryId, 'temporary category id is missing');

      const productResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/products`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: 'Automated moderation menu item',
            price: 48,
            categoryId: temporaryCategoryId,
            description: 'Temporary menu item for cascade verification.',
            image: '',
          }),
        }
      );

      expect(
        productResponse.response.status === 201,
        `product expected 201, got ${productResponse.response.status}`
      );

      temporaryProductId = getIdFromLocation(productResponse.response);
      expect(temporaryProductId, 'temporary product id is missing');
    });

    await scenario('admin moderation list includes temporary restaurant with product count', async () => {
      const { response, data } = await request('/api/admin/restaurants', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(
        response.status === 200,
        `moderation refresh expected 200, got ${response.status}`
      );

      const temporaryRestaurant = data.find(
        (restaurant) =>
          String(restaurant?.id) === String(temporaryRestaurantId)
      );

      expect(
        temporaryRestaurant,
        'temporary restaurant was not found in moderation list'
      );

      expect(
        temporaryRestaurant.isModerationProtected === false,
        'temporary restaurant should not be moderation-protected'
      );

      expect(
        Number(temporaryRestaurant.productCount) === 1,
        `expected temporary restaurant product count to be 1, got ${temporaryRestaurant.productCount}`
      );
    });

    await scenario('admin can update temporary restaurant and clear coordinates', async () => {
      const { response, data } = await request(
        `/api/admin/restaurants/${temporaryRestaurantId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: 'SCRUM 480 Automated Test Updated',
            cuisine: 'Admin verified',
            description: 'Updated by administrator moderation test.',
            latitude: null,
            longitude: null,
          }),
        }
      );

      expect(
        response.status === 200,
        `admin update expected 200, got ${response.status}`
      );

      expect(
        data?.name === 'SCRUM 480 Automated Test Updated',
        'admin update did not persist restaurant name'
      );

      expect(
        data?.cuisine === 'Admin verified',
        'admin update did not persist cuisine'
      );

      expect(
        data?.latitude === null && data?.longitude === null,
        'admin update did not clear both coordinates'
      );
    });

    await scenario('admin can delete temporary restaurant and related menu data', async () => {
      const { response } = await request(
        `/api/admin/restaurants/${temporaryRestaurantId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(
        response.status === 204,
        `admin delete expected 204, got ${response.status}`
      );
    });

    await scenario('deleted restaurant no longer appears and product data is gone', async () => {
      const moderationResponse = await request('/api/admin/restaurants', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(
        moderationResponse.response.status === 200,
        `final moderation list expected 200, got ${moderationResponse.response.status}`
      );

      expect(
        !moderationResponse.data.some(
          (restaurant) =>
            String(restaurant?.id) === String(temporaryRestaurantId)
        ),
        'deleted temporary restaurant is still listed'
      );

      const productsResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/products`
      );

      if (productsResponse.response.status === 200) {
        expect(
          Array.isArray(productsResponse.data) &&
            !productsResponse.data.some(
              (product) =>
                String(product?.id) === String(temporaryProductId)
            ),
          'deleted restaurant product still exists'
        );
      } else {
        expect(
          productsResponse.response.status === 404,
          `products after deletion expected 200 or 404, got ${productsResponse.response.status}`
        );
      }
    });

    temporaryRestaurantId = null;
  } finally {
    if (temporaryRestaurantId && adminToken) {
      try {
        await request(`/api/admin/restaurants/${temporaryRestaurantId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        console.log('CLEANUP - temporary restaurant deletion attempted');
      } catch {
        console.log('CLEANUP - could not remove temporary restaurant');
      }
    }
  }

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  console.log(`\nSCRUM-480/402 SUMMARY: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`UNEXPECTED TEST ERROR: ${error.message}`);
  process.exitCode = 1;
});
