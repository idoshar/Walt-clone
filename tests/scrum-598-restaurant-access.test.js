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

function unique(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function getLocationId(response) {
    return response.headers
        .get('location')
        ?.split('/')
        .filter(Boolean)
        .pop();
}

async function waitForServer() {
    for (let attempt = 1; attempt <= 30; attempt += 1) {
        try {
            const { response } = await request('/api/health');

            if (response.status === 200) {
                console.log(
                    `Server ready after ${attempt} attempt(s).`
                );
                return;
            }
        } catch {
            // The container may still be starting.
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('server did not become ready within 30 seconds');
}

async function createUser(prefix) {
    const username = unique(prefix);
    const password = 'AccessPass598';

    const { response, data } = await request('/api/users', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password,
            fullName: `SCRUM 598 ${prefix}`,
            phone: '0500000000',
            address: 'Jerusalem'
        })
    });

    expect(
        response.status === 201,
        `registration expected 201, got ${response.status}`
    );

    expect(data?.id, 'registration response did not include user id');

    return {
        username,
        password,
        user: data
    };
}

async function login(username, password) {
    const { response, data } = await request('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    expect(
        response.status === 200,
        `login expected 200, got ${response.status}`
    );

    expect(data?.token, 'login response did not include a token');

    return data.token;
}

async function main() {
    let owner;
    let editor;
    let ownerToken;
    let editorToken;
    let restaurantId;
    let categoryId;
    let productId;

    try {
        await waitForServer();

        await scenario('create owner and editor accounts', async () => {
            owner = await createUser('scrum598_owner');
            editor = await createUser('scrum598_editor');

            ownerToken = await login(owner.username, owner.password);
            editorToken = await login(editor.username, editor.password);
        });

        await scenario('owner creates a restaurant and menu category', async () => {
            const restaurant = await request('/api/restaurants', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ownerToken}`
                },
                body: JSON.stringify({
                    name: unique('SCRUM 598 Restaurant'),
                    address: 'Test address',
                    phone: '03-0000000',
                    cuisine: 'Test cuisine',
                    description: 'Restaurant access-control verification'
                })
            });

            expect(
                restaurant.response.status === 201,
                `restaurant creation expected 201, got ${restaurant.response.status}`
            );

            restaurantId = restaurant.data?.id;

            expect(restaurantId, 'restaurant creation did not return an id');
            expect(
                restaurant.data?.accessRole === 'owner',
                'creator did not receive owner accessRole'
            );
            expect(
                !Object.prototype.hasOwnProperty.call(
                    restaurant.data,
                    'editorIds'
                ),
                'public management response must not expose editorIds'
            );

            const category = await request(
                `/api/restaurants/${restaurantId}/menu-categories`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    },
                    body: JSON.stringify({
                        name: 'Main',
                        menuType: 'main'
                    })
                }
            );

            expect(
                category.response.status === 201,
                `category creation expected 201, got ${category.response.status}`
            );

            categoryId = category.data?.id;
            expect(categoryId, 'category creation did not return an id');
        });

        await scenario('owner can securely look up the future editor', async () => {
            const { response, data } = await request(
                `/api/users/lookup?username=${encodeURIComponent(
                    editor.username
                )}`,
                {
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    }
                }
            );

            expect(
                response.status === 200,
                `user lookup expected 200, got ${response.status}`
            );

            expect(
                String(data?.id) === String(editor.user.id),
                'lookup returned the wrong user'
            );

            expect(
                !Object.prototype.hasOwnProperty.call(data, 'phone') &&
                    !Object.prototype.hasOwnProperty.call(data, 'address'),
                'lookup must not expose phone or address'
            );
        });

        await scenario('owner grants editor access', async () => {
            const { response, data } = await request(
                `/api/restaurants/${restaurantId}/editors`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    },
                    body: JSON.stringify({
                        userId: editor.user.id
                    })
                }
            );

            expect(
                response.status === 201,
                `add editor expected 201, got ${response.status}`
            );

            expect(
                data?.editors?.some(
                    (currentEditor) =>
                        String(currentEditor.id) === String(editor.user.id)
                ),
                'editor is missing from access response'
            );
        });

        await scenario('editor sees the restaurant in My Restaurants', async () => {
            const { response, data } = await request('/api/restaurants/mine', {
                headers: {
                    Authorization: `Bearer ${editorToken}`
                }
            });

            expect(
                response.status === 200,
                `my restaurants expected 200, got ${response.status}`
            );

            const managedRestaurant = Array.isArray(data)
                ? data.find(
                      (restaurant) =>
                          String(restaurant.id) === String(restaurantId)
                  )
                : null;

            expect(
                managedRestaurant,
                'editor did not receive the delegated restaurant'
            );

            expect(
                managedRestaurant.accessRole === 'editor',
                'delegated restaurant did not return editor accessRole'
            );
        });

        await scenario('editor can update restaurant, category, product and statistics', async () => {
            const restaurantUpdate = await request(
                `/api/restaurants/${restaurantId}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    },
                    body: JSON.stringify({
                        description: 'Updated by delegated editor'
                    })
                }
            );

            expect(
                restaurantUpdate.response.status === 204,
                `editor restaurant update expected 204, got ${restaurantUpdate.response.status}`
            );

            const categoryUpdate = await request(
                `/api/restaurants/${restaurantId}/menu-categories/${categoryId}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    },
                    body: JSON.stringify({
                        name: 'Updated Main'
                    })
                }
            );

            expect(
                categoryUpdate.response.status === 200,
                `editor category update expected 200, got ${categoryUpdate.response.status}`
            );

            const product = await request(
                `/api/restaurants/${restaurantId}/products`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    },
                    body: JSON.stringify({
                        name: 'Editor Product',
                        price: 25,
                        categoryId
                    })
                }
            );

            expect(
                product.response.status === 201,
                `editor product creation expected 201, got ${product.response.status}`
            );

            productId = getLocationId(product.response);

            expect(productId, 'product creation did not return a location id');

            const productUpdate = await request(
                `/api/restaurants/${restaurantId}/products/${productId}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    },
                    body: JSON.stringify({
                        price: 30
                    })
                }
            );

            expect(
                productUpdate.response.status === 204,
                `editor product update expected 204, got ${productUpdate.response.status}`
            );

            const statistics = await request(
                `/api/restaurants/${restaurantId}/statistics`,
                {
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    }
                }
            );

            expect(
                statistics.response.status === 200,
                `editor statistics expected 200, got ${statistics.response.status}`
            );
        });

        await scenario('editor cannot manage access, transfer ownership or delete restaurant', async () => {
            const getAccess = await request(
                `/api/restaurants/${restaurantId}/access`,
                {
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    }
                }
            );

            expect(
                getAccess.response.status === 403,
                `editor access read expected 403, got ${getAccess.response.status}`
            );

            const transfer = await request(
                `/api/restaurants/${restaurantId}/owner`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    },
                    body: JSON.stringify({
                        userId: owner.user.id
                    })
                }
            );

            expect(
                transfer.response.status === 403,
                `editor transfer attempt expected 403, got ${transfer.response.status}`
            );

            const deletion = await request(
                `/api/restaurants/${restaurantId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    }
                }
            );

            expect(
                deletion.response.status === 403,
                `editor deletion attempt expected 403, got ${deletion.response.status}`
            );
        });

        await scenario('owner can revoke editor access and revoked editor loses update access', async () => {
            const removal = await request(
                `/api/restaurants/${restaurantId}/editors/${editor.user.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    }
                }
            );

            expect(
                removal.response.status === 204,
                `remove editor expected 204, got ${removal.response.status}`
            );

            const editorUpdate = await request(
                `/api/restaurants/${restaurantId}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    },
                    body: JSON.stringify({
                        description: 'This change must be rejected'
                    })
                }
            );

            expect(
                editorUpdate.response.status === 403,
                `revoked editor update expected 403, got ${editorUpdate.response.status}`
            );
        });

        await scenario('owner can re-add the editor and transfer ownership', async () => {
            const reAdd = await request(
                `/api/restaurants/${restaurantId}/editors`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    },
                    body: JSON.stringify({
                        userId: editor.user.id
                    })
                }
            );

            expect(
                reAdd.response.status === 201,
                `re-add editor expected 201, got ${reAdd.response.status}`
            );

            const transfer = await request(
                `/api/restaurants/${restaurantId}/owner`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    },
                    body: JSON.stringify({
                        userId: editor.user.id
                    })
                }
            );

            expect(
                transfer.response.status === 200,
                `ownership transfer expected 200, got ${transfer.response.status}`
            );

            expect(
                String(transfer.data?.owner?.id) === String(editor.user.id),
                'ownership transfer did not update the owner'
            );

            expect(
                !transfer.data?.editors?.some(
                    (currentEditor) =>
                        String(currentEditor.id) === String(owner.user.id)
                ),
                'previous owner unexpectedly retained editor access'
            );
        });

        await scenario('previous owner loses management access after transfer', async () => {
            const oldOwnerUpdate = await request(
                `/api/restaurants/${restaurantId}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${ownerToken}`
                    },
                    body: JSON.stringify({
                        description: 'Old owner must not update this'
                    })
                }
            );

            expect(
                oldOwnerUpdate.response.status === 403,
                `previous owner update expected 403, got ${oldOwnerUpdate.response.status}`
            );

            const newOwnerRestaurants = await request(
                '/api/restaurants/mine',
                {
                    headers: {
                        Authorization: `Bearer ${editorToken}`
                    }
                }
            );

            const transferredRestaurant = Array.isArray(
                newOwnerRestaurants.data
            )
                ? newOwnerRestaurants.data.find(
                      (restaurant) =>
                          String(restaurant.id) === String(restaurantId)
                  )
                : null;

            expect(
                transferredRestaurant?.accessRole === 'owner',
                'new owner did not receive owner accessRole'
            );
        });
    } finally {
        if (restaurantId) {
            const cleanupTokens = [...new Set([ownerToken, editorToken].filter(Boolean))];
            const cleanupOutcomes = [];
            let cleanupSucceeded = false;

            for (const token of cleanupTokens) {
                try {
                    const cleanup = await request(
                        `/api/restaurants/${restaurantId}`,
                        {
                            method: 'DELETE',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    cleanupOutcomes.push(cleanup.response.status);

                    if (
                        cleanup.response.status === 204 ||
                        cleanup.response.status === 404
                    ) {
                        cleanupSucceeded = true;
                        break;
                    }
                } catch (cleanupError) {
                    cleanupOutcomes.push(cleanupError.message);
                }
            }

            if (cleanupSucceeded) {
                console.log('CLEANUP - SCRUM-598 temporary restaurant deleted.');
            } else {
                console.error(
                    `CLEANUP FAILED - SCRUM-598 restaurant could not be deleted. Outcomes: ${cleanupOutcomes.join(', ')}`
                );
                process.exitCode = 1;
            }
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-598 SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(`FATAL - ${error.message}`);
    process.exitCode = 1;
});