const { execFileSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const DATABASE_NAME = process.env.MONGODB_DB_NAME || 'food_delivery';
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

function uniqueTestName(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getIdFromLocation(response) {
  return response.headers
    .get('location')
    ?.split('/')
    .filter(Boolean)
    .pop();
}

function mongoEval(script) {
  return execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'mongo',
      'mongosh',
      DATABASE_NAME,
      '--quiet',
      '--eval',
      script,
    ],
    { encoding: 'utf8' }
  ).trim();
}

function setUserRole(username, role) {
  mongoEval(`
    db.users.updateOne(
      { username: ${JSON.stringify(username)} },
      { $set: { role: ${JSON.stringify(role)} } }
    );
  `);
}

function cleanupUsers(usernames) {
  if (usernames.length === 0) {
    return;
  }

  mongoEval(`
    db.users.deleteMany({
      username: { $in: ${JSON.stringify(usernames)} }
    });
  `);
}

async function createUser(prefix, fullName, password = '12345678Aa') {
  const username = `${prefix}_${Date.now()}_${Math.floor(
    Math.random() * 1000
  )}`;

  const { response, data } = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      fullName,
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

  expect(response.status === 200, `login expected 200, got ${response.status}`);
  expect(data?.token, 'login response did not contain a token');

  return data.token;
}

async function waitForServer() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const { response, data } = await request('/api/health');

      if (response.status === 200 && data?.status === 'ok') {
        console.log(`Server ready after ${attempt} attempt(s).`);
        return;
      }
    } catch {
      // The server may still be starting or restarting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('server did not become ready within 30 seconds');
}

function restartWebServer() {
  execFileSync('docker', ['compose', 'restart', 'web-server'], {
    stdio: 'inherit',
  });
}

async function deleteIfPresent(path, token, label) {
  const { response } = await request(path, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 204 && response.status !== 404) {
    throw new Error(`${label} cleanup expected 204 or 404, got ${response.status}`);
  }
}

async function main() {
  const createdUsernames = [];
  let adminToken;
  let ownerToken;
  let editorToken;
  let temporaryRestaurantId;
  let temporaryRestaurantName;
  let temporaryCategoryId;
  let temporarySecondCategoryId;
  let temporaryProductId;
  let catalogRestaurantId;
  let catalogCategoryId;
  let catalogProductId;

  try {
    await waitForServer();

    await scenario('create owner, editor, and administrator sessions', async () => {
      const owner = await createUser(
        'scrum612_owner',
        'SCRUM 612 Restaurant Owner'
      );
      const editor = await createUser(
        'scrum612_editor',
        'SCRUM 612 Future Editor'
      );
      const admin = await createUser(
        'scrum612_admin',
        'SCRUM 612 Administrator'
      );

      createdUsernames.push(owner.username, editor.username, admin.username);
      setUserRole(admin.username, 'admin');

      ownerToken = await login(owner.username, owner.password);
      editorToken = await login(editor.username, editor.password);
      adminToken = await login(admin.username, admin.password);

      expect(ownerToken.split('.').length === 3, 'owner token is invalid');
      expect(editorToken.split('.').length === 3, 'editor token is invalid');
      expect(adminToken.split('.').length === 3, 'admin token is invalid');
    });

    await scenario('owner creates a restaurant outside the administrator account', async () => {
      temporaryRestaurantName = uniqueTestName('SCRUM-612-Test-Restaurant');

      const { response, data } = await request('/api/restaurants', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          name: temporaryRestaurantName,
          address: '12 Management Street, Jerusalem',
          phone: '02-6120612',
          cuisine: 'Verification',
          description: 'Temporary restaurant for administrator full-management verification.',
        }),
      });

      expect(response.status === 201, `restaurant creation expected 201, got ${response.status}`);
      temporaryRestaurantId = data?.id;
      expect(temporaryRestaurantId, 'temporary restaurant id is missing');
    });

    await scenario('administrator sees every restaurant with administrator access', async () => {
      const { response, data } = await request('/api/restaurants/mine', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status === 200, `admin management list expected 200, got ${response.status}`);
      expect(Array.isArray(data), 'admin management list must be an array');

      const temporaryRestaurant = data.find(
        (restaurant) => String(restaurant?.id) === String(temporaryRestaurantId)
      );
      const catalogRestaurant = data.find((restaurant) => restaurant?.isDefault === true);

      expect(temporaryRestaurant?.accessRole === 'admin', 'admin access role is missing for another owner restaurant');
      expect(catalogRestaurant?.id, 'admin management list is missing a protected catalog restaurant');
      expect(catalogRestaurant?.accessRole === 'admin', 'admin access role is missing for catalog restaurant');

      catalogRestaurantId = catalogRestaurant.id;
    });

    await scenario('administrator can update another owner restaurant through the standard management API', async () => {
      const { response } = await request(`/api/restaurants/${temporaryRestaurantId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: `${temporaryRestaurantName} Updated`,
          cuisine: 'Administrator managed',
        }),
      });

      expect(response.status === 204, `admin restaurant update expected 204, got ${response.status}`);

      const { response: listResponse, data } = await request('/api/restaurants/mine', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(listResponse.status === 200, `admin list refresh expected 200, got ${listResponse.status}`);

      const updatedRestaurant = data.find(
        (restaurant) => String(restaurant?.id) === String(temporaryRestaurantId)
      );

      expect(updatedRestaurant?.name === `${temporaryRestaurantName} Updated`, 'admin restaurant update did not persist');
      expect(updatedRestaurant?.cuisine === 'Administrator managed', 'admin cuisine update did not persist');
    });

    await scenario('administrator can manage categories, products, statistics, and team access for another owner restaurant', async () => {
      const categoryResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/menu-categories`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: uniqueTestName('SCRUM-612-Category'),
            menuType: 'main',
          }),
        }
      );

      expect(categoryResponse.response.status === 201, `admin category creation expected 201, got ${categoryResponse.response.status}`);
      temporaryCategoryId = categoryResponse.data?.id;
      expect(temporaryCategoryId, 'temporary category id is missing');

      const updateCategoryResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/menu-categories/${temporaryCategoryId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: uniqueTestName('SCRUM-612-Category-Updated'),
          }),
        }
      );

      expect(updateCategoryResponse.response.status === 200, `admin category update expected 200, got ${updateCategoryResponse.response.status}`);

      const secondCategoryResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/menu-categories`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: uniqueTestName('SCRUM-612-Category-Second'),
            menuType: 'main',
          }),
        }
      );

      expect(secondCategoryResponse.response.status === 201, `second admin category creation expected 201, got ${secondCategoryResponse.response.status}`);
      temporarySecondCategoryId = secondCategoryResponse.data?.id;
      expect(temporarySecondCategoryId, 'second temporary category id is missing');

      const reorderResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/menu-categories/order`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            categoryIds: [temporarySecondCategoryId, temporaryCategoryId],
          }),
        }
      );

      expect(reorderResponse.response.status === 200, `admin category reorder expected 200, got ${reorderResponse.response.status}`);

      const productResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/products`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: uniqueTestName('SCRUM-612-Product'),
            price: 61.2,
            categoryId: temporaryCategoryId,
            description: 'Created by an administrator for a restaurant owned by another user.',
            image: '',
          }),
        }
      );

      expect(productResponse.response.status === 201, `admin product creation expected 201, got ${productResponse.response.status}`);
      temporaryProductId = getIdFromLocation(productResponse.response);
      expect(temporaryProductId, 'temporary product id is missing');

      const updateProductResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/products/${temporaryProductId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: 'SCRUM-612 Product Updated',
            price: 62.3,
          }),
        }
      );

      expect(updateProductResponse.response.status === 204, `admin product update expected 204, got ${updateProductResponse.response.status}`);

      const statisticsResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(statisticsResponse.response.status === 200, `admin restaurant statistics expected 200, got ${statisticsResponse.response.status}`);

      const accessResponse = await request(`/api/restaurants/${temporaryRestaurantId}/access`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(accessResponse.response.status === 200, `admin restaurant access expected 200, got ${accessResponse.response.status}`);

      const futureEditor = createdUsernames[1];
      const editorUserId = mongoEval(`
        const user = db.users.findOne(
          { username: ${JSON.stringify(futureEditor)} },
          { _id: 0, id: 1 }
        );
        print(user ? user.id : '');
      `).trim();

      expect(editorUserId, 'future editor user id could not be found');

      const addEditorResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/editors`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ userId: editorUserId }),
        }
      );

      expect(addEditorResponse.response.status === 201, `admin add editor expected 201, got ${addEditorResponse.response.status}`);
      expect(
        Array.isArray(addEditorResponse.data?.editors) &&
          addEditorResponse.data.editors.some(
            (editor) => String(editor?.id) === String(editorUserId)
          ),
        'administrator did not grant editor access'
      );

      const removeEditorResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/editors/${editorUserId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(removeEditorResponse.response.status === 204, `admin remove editor expected 204, got ${removeEditorResponse.response.status}`);

      const reAddEditorResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/editors`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ userId: editorUserId }),
        }
      );

      expect(reAddEditorResponse.response.status === 201, `admin re-add editor expected 201, got ${reAddEditorResponse.response.status}`);

      const ownershipResponse = await request(
        `/api/restaurants/${temporaryRestaurantId}/owner`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ userId: editorUserId }),
        }
      );

      expect(ownershipResponse.response.status === 200, `admin ownership transfer expected 200, got ${ownershipResponse.response.status}`);
      expect(
        String(ownershipResponse.data?.owner?.id) === String(editorUserId),
        'administrator ownership transfer did not persist'
      );
    });

    await scenario('administrator can manage protected catalog categories and products', async () => {
      const categoriesResponse = await request(
        `/api/restaurants/${catalogRestaurantId}/menu-categories`
      );

      expect(categoriesResponse.response.status === 200, `catalog categories expected 200, got ${categoriesResponse.response.status}`);
      expect(Array.isArray(categoriesResponse.data) && categoriesResponse.data.length > 0, 'catalog restaurant must have a category');
      catalogCategoryId = categoriesResponse.data[0].id;

      const createdCategoryResponse = await request(
        `/api/restaurants/${catalogRestaurantId}/menu-categories`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: uniqueTestName('SCRUM-613-Catalog-Category'),
            menuType: 'main',
          }),
        }
      );

      expect(createdCategoryResponse.response.status === 201, `catalog category creation expected 201, got ${createdCategoryResponse.response.status}`);
      catalogCategoryId = createdCategoryResponse.data?.id;
      expect(catalogCategoryId, 'temporary catalog category id is missing');

      const createdProductResponse = await request(
        `/api/restaurants/${catalogRestaurantId}/products`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: uniqueTestName('SCRUM-613-Catalog-Product'),
            price: 61.3,
            categoryId: catalogCategoryId,
            description: 'Temporary catalog menu item for administrator persistence verification.',
            image: '',
          }),
        }
      );

      expect(createdProductResponse.response.status === 201, `catalog product creation expected 201, got ${createdProductResponse.response.status}`);
      catalogProductId = getIdFromLocation(createdProductResponse.response);
      expect(catalogProductId, 'temporary catalog product id is missing');

      const updatedProductName = uniqueTestName('SCRUM-613-Catalog-Product-Updated');
      const updateProductResponse = await request(
        `/api/restaurants/${catalogRestaurantId}/products/${catalogProductId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: updatedProductName,
            price: 63.1,
          }),
        }
      );

      expect(updateProductResponse.response.status === 204, `catalog product update expected 204, got ${updateProductResponse.response.status}`);

      restartWebServer();
      await waitForServer();

      const catalogProductsResponse = await request(
        `/api/restaurants/${catalogRestaurantId}/products`
      );

      expect(catalogProductsResponse.response.status === 200, `catalog products after restart expected 200, got ${catalogProductsResponse.response.status}`);

      const persistedProduct = catalogProductsResponse.data.find(
        (product) => String(product?.id) === String(catalogProductId)
      );

      expect(persistedProduct?.name === updatedProductName, 'catalog product edit was overwritten after restart');
      expect(Number(persistedProduct?.price) === 63.1, 'catalog product price edit was overwritten after restart');
    });

    await scenario('administrator cannot delete a protected catalog restaurant', async () => {
      const { response } = await request(`/api/restaurants/${catalogRestaurantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status === 403, `catalog delete expected 403, got ${response.status}`);
    });

    await scenario('administrator can delete a non-catalog restaurant after ownership transfer', async () => {
      const { response } = await request(`/api/restaurants/${temporaryRestaurantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status === 204, `admin delete expected 204, got ${response.status}`);
      temporaryRestaurantId = null;
    });
  } finally {
    const cleanupErrors = [];

    if (catalogProductId && adminToken) {
      try {
        await deleteIfPresent(
          `/api/restaurants/${catalogRestaurantId}/products/${catalogProductId}`,
          adminToken,
          'catalog product'
        );
      } catch (error) {
        cleanupErrors.push(error.message);
      }
    }

    if (catalogCategoryId && adminToken) {
      try {
        await deleteIfPresent(
          `/api/restaurants/${catalogRestaurantId}/menu-categories/${catalogCategoryId}`,
          adminToken,
          'catalog category'
        );
      } catch (error) {
        cleanupErrors.push(error.message);
      }
    }

    if (temporaryRestaurantId && adminToken) {
      try {
        await deleteIfPresent(
          `/api/restaurants/${temporaryRestaurantId}`,
          adminToken,
          'temporary restaurant'
        );
      } catch (error) {
        cleanupErrors.push(error.message);
      }
    }

    try {
      cleanupUsers(createdUsernames);
    } catch (error) {
      cleanupErrors.push(`temporary user cleanup failed: ${error.message}`);
    }

    if (cleanupErrors.length > 0) {
      console.error(`CLEANUP FAILED - ${cleanupErrors.join('; ')}`);
      process.exitCode = 1;
    } else {
      console.log('CLEANUP - SCRUM-612/613 temporary data deleted.');
    }
  }

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  console.log(`\nSCRUM-612/613 SUMMARY: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`UNEXPECTED TEST ERROR: ${error.message}`);
  process.exitCode = 1;
});
