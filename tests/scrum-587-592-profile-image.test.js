const { execFileSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const results = [];

const VALID_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9XQAAAABJRU5ErkJggg==';

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

async function waitForServer() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const { response } = await request('/api/health');

      if (response.status === 200) {
        console.log(`Server ready after ${attempt} attempt(s).`);
        return;
      }
    } catch {
      // The container may be running while Node is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('web-server did not become ready in time');
}

async function createUser() {
  const username = `scrum592_profile_${Date.now()}_${Math.floor(
    Math.random() * 1000
  )}`;

  const password = 'ProfilePass592';

  const { response, data } = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      fullName: 'SCRUM 592 Profile User',
      phone: '0500000000',
      address: 'Jerusalem',
    }),
  });

  expect(
    response.status === 201,
    `registration expected 201, got ${response.status}`
  );

  expect(data?.id, 'registration response is missing user id');

  return {
    id: data.id,
    username,
    password,
    fullName: data.fullName,
    phone: data.phone,
    address: data.address,
  };
}

async function login(username, password) {
  const { response, data } = await request('/api/tokens', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  expect(response.status === 200, `login expected 200, got ${response.status}`);
  expect(data?.token, 'login response is missing token');

  return data.token;
}

function cleanupUser(username) {
  if (!username) {
    return;
  }

  const mongoScript = `
    const result = db.users.deleteMany({
      username: ${JSON.stringify(username)}
    });

    print(JSON.stringify({
      deletedCount: result.deletedCount
    }));
  `;

  execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'mongo',
      'mongosh',
      'food_delivery',
      '--quiet',
      '--eval',
      mongoScript,
    ],
    {
      stdio: 'inherit',
    }
  );
}

async function main() {
  let user;
  let token;

  await waitForServer();

  try {
    await scenario('profile-image test user can register and log in', async () => {
      user = await createUser();
      token = await login(user.username, user.password);
    });

    await scenario('profile-image update rejects missing token', async () => {
      const { response } = await request('/api/users/me/image', {
        method: 'PATCH',
        body: JSON.stringify({ image: VALID_IMAGE }),
      });

      expect(response.status === 401, `expected 401, got ${response.status}`);
    });

    await scenario('profile-image update requires the image field', async () => {
      const { response } = await request('/api/users/me/image', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status === 400, `expected 400, got ${response.status}`);
    });

    await scenario('profile-image update rejects unsupported image values', async () => {
      const { response } = await request('/api/users/me/image', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: 'https://example.com/not-accepted-as-profile-image.png',
        }),
      });

      expect(response.status === 400, `expected 400, got ${response.status}`);
    });

    await scenario('profile-image update stores valid image without exposing password', async () => {
      const { response, data } = await request('/api/users/me/image', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: VALID_IMAGE,
        }),
      });

      expect(response.status === 200, `expected 200, got ${response.status}`);
      expect(data?.image === VALID_IMAGE, 'returned image does not match update');
      expect(data?.fullName === user.fullName, 'full name changed unexpectedly');
      expect(data?.phone === user.phone, 'phone changed unexpectedly');
      expect(data?.address === user.address, 'address changed unexpectedly');
      expect(
        !Object.prototype.hasOwnProperty.call(data || {}, 'password'),
        'password must not be included in profile-image response'
      );
    });

    await scenario('profile-image update persists on user read endpoint', async () => {
      const { response, data } = await request(`/api/users/${user.id}`);

      expect(response.status === 200, `expected 200, got ${response.status}`);
      expect(data?.image === VALID_IMAGE, 'stored image is not returned by user read');
    });

    await scenario('profile-image removal clears the stored image', async () => {
      const { response, data } = await request('/api/users/me/image', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: '',
        }),
      });

      expect(response.status === 200, `expected 200, got ${response.status}`);
      expect(data?.image === '', 'image was not cleared');
    });
  } finally {
    try {
      cleanupUser(user?.username);
      console.log('CLEANUP - temporary profile-image user removed');
    } catch (error) {
      console.log(`CLEANUP FAILED - ${error.message}`);
      results.push(false);
    }
  }

  const passed = results.filter(Boolean).length;

  console.log(
    `\nSCRUM-587/592 SUMMARY: ${passed} passed, ${
      results.length - passed
    } failed`
  );

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main();
