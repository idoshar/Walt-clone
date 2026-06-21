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
  const { response, data } = await request('/api/restaurants', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      address: 'Test Street 1',
      phone: '03-0000000',
      cuisine: 'Test',
      description: 'Created by management test',
      image: 'https://example.com/restaurant.jpg'
    })
  });

  expect(response.status === 201, `create restaurant expected 201, got ${response.status}`);
  expect(data?.id, 'created restaurant response is missing an id');
  expect(data.image === 'https://example.com/restaurant.jpg', 'restaurant image was not saved');
  expect(data.productCount === 0, 'new restaurant should start with zero menu items');

  const locationId = getIdFromLocation(response);
  expect(String(locationId) === String(data.id), 'Location header does not match response id');

  return data.id;
}

async function createProduct(token, restaurantId, name) {
  const { response } = await request(`/api/restaurants/${restaurantId}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      price: 42,
      description: 'Test product',
      category: 'Test',
      image: 'https://example.com/product.jpg'
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

  await scenario('public restaurants list contains seeded restaurants with menu items', async () => {
    const { response, data } = await request('/api/restaurants');

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'restaurants response is not array');
    expect(data.some((restaurant) => restaurant.isDefault === true), 'default restaurants should exist');
  });

  await scenario('my restaurants endpoint requires JWT', async () => {
    const { response } = await request('/api/restaurants/mine');
    expect(response.status === 401, `expected 401, got ${response.status}`);
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

  await scenario('new restaurant is a private draft until it has menu items', async () => {
    restaurantId = await createRestaurant(ownerToken, `My Test Restaurant ${Date.now()}`);

    const myRestaurants = await request('/api/restaurants/mine', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    expect(myRestaurants.response.status === 200, `expected 200, got ${myRestaurants.response.status}`);
    const draft = myRestaurants.data.find((restaurant) => String(restaurant.id) === String(restaurantId));
    expect(draft, 'draft is missing from the owner management list');
    expect(draft.productCount === 0, 'draft should have zero menu items');

    const publicRestaurants = await request('/api/restaurants');
    expect(
      !publicRestaurants.data.some((restaurant) => String(restaurant.id) === String(restaurantId)),
      'draft should not be visible in the public restaurants list'
    );

    const directRestaurant = await request(`/api/restaurants/${restaurantId}`);
    expect(directRestaurant.response.status === 404, 'draft should not be reachable on the public restaurant page');
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

  await scenario('creating a product without JWT is rejected', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products`, {
      method: 'POST',
      body: JSON.stringify({ name: 'No Token Product', price: 42 })
    });

    expect(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario('other user cannot create a product for owner restaurant', async () => {
    const { response } = await request(`/api/restaurants/${restaurantId}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({ name: 'Wrong User Product', price: 42 })
    });

    expect(response.status === 403, `expected 403, got ${response.status}`);
  });

  await scenario('create product publishes the restaurant', async () => {
    productId = await createProduct(ownerToken, restaurantId, `My Test Product ${Date.now()}`);

    const publicRestaurants = await request('/api/restaurants');
    expect(
      publicRestaurants.data.some((restaurant) => String(restaurant.id) === String(restaurantId)),
      'restaurant should become visible after the first menu item is created'
    );

    const directRestaurant = await request(`/api/restaurants/${restaurantId}`);
    expect(directRestaurant.response.status === 200, `expected 200, got ${directRestaurant.response.status}`);
  });

  await scenario('get products includes created product and stored image', async () => {
    const { response, data } = await request(`/api/restaurants/${restaurantId}/products`);

    expect(response.status === 200, `expected 200, got ${response.status}`);
    expect(Array.isArray(data), 'products response is not array');
    const product = data.find((currentProduct) => String(currentProduct.id) === String(productId));
    expect(product, 'created product not found');
    expect(product.image === 'https://example.com/product.jpg', 'product image was not saved');
  });

  await scenario('other user cannot update or delete owner menu items', async () => {
    const update = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({ price: 55 })
    });

    const deletion = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${otherToken}` }
    });

    expect(update.response.status === 403, `update expected 403, got ${update.response.status}`);
    expect(deletion.response.status === 403, `delete expected 403, got ${deletion.response.status}`);
  });

  await scenario('owner can update and delete own menu item', async () => {
    const update = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ price: 55 })
    });

    expect(update.response.status === 204, `update expected 204, got ${update.response.status}`);

    const deletion = await request(`/api/restaurants/${restaurantId}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    expect(deletion.response.status === 204, `delete expected 204, got ${deletion.response.status}`);
  });

  await scenario('deleting the final menu item returns restaurant to draft status', async () => {
    const publicRestaurants = await request('/api/restaurants');
    expect(
      !publicRestaurants.data.some((restaurant) => String(restaurant.id) === String(restaurantId)),
      'restaurant should not remain public after the last menu item is removed'
    );

    const myRestaurants = await request('/api/restaurants/mine', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const draft = myRestaurants.data.find((restaurant) => String(restaurant.id) === String(restaurantId));
    expect(draft?.productCount === 0, 'owner should still see restaurant as a draft');
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

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main();
