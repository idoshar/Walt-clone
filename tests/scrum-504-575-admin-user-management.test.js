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

async function waitForServer() {
    for (let attempt = 1; attempt <= 30; attempt += 1) {
        try {
            const { response } = await request('/api/health');

            if (response.status === 200) {
                console.log(`Server ready after ${attempt} attempt(s).`);
                return;
            }
        } catch {
            // Docker may still be starting.
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('web-server did not become ready in time');
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
            script
        ],
        { encoding: 'utf8' }
    ).trim();
}

function updateUser(username, updates) {
    mongoEval(`
        db.users.updateOne(
            { username: ${JSON.stringify(username)} },
            { $set: ${JSON.stringify(updates)} }
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

async function createUser(prefix) {
    const username = `${prefix}_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
    const password = 'AdminUsersPass504';

    const { response, data } = await request('/api/users', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password,
            fullName: `SCRUM 504 ${prefix}`,
            phone: '0500000000',
            address: 'Jerusalem'
        })
    });

    expect(response.status === 201, `expected 201, got ${response.status}`);
    expect(data?.id, 'registration did not return a user id');

    return { id: data.id, username, password };
}

async function login(username, password) {
    return request('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
}

async function main() {
    const createdUsernames = [];
    let admin;
    let customer;
    let adminToken;
    let customerToken;

    try {
        await waitForServer();

        await scenario('test users can register and receive sessions', async () => {
            admin = await createUser('admin');
            customer = await createUser('customer');
            createdUsernames.push(admin.username, customer.username);

            updateUser(admin.username, { role: 'admin' });

            const adminLogin = await login(admin.username, admin.password);
            const customerLogin = await login(
                customer.username,
                customer.password
            );

            expect(
                adminLogin.response.status === 200,
                `admin login expected 200, got ${adminLogin.response.status}`
            );
            expect(
                customerLogin.response.status === 200,
                `customer login expected 200, got ${customerLogin.response.status}`
            );

            adminToken = adminLogin.data?.token;
            customerToken = customerLogin.data?.token;

            expect(adminToken, 'admin login did not return a token');
            expect(customerToken, 'customer login did not return a token');
        });

        await scenario('admin user list rejects a missing token', async () => {
            const { response } = await request('/api/admin/users');

            expect(response.status === 401, `expected 401, got ${response.status}`);
        });

        await scenario('admin user list rejects a non-admin user', async () => {
            const { response } = await request('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${customerToken}`
                }
            });

            expect(response.status === 403, `expected 403, got ${response.status}`);
        });

        await scenario('admin user list returns safe account-management fields', async () => {
            const { response, data } = await request('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });

            expect(response.status === 200, `expected 200, got ${response.status}`);
            expect(Array.isArray(data), 'expected an array response');

            const customerEntry = data.find((user) => user.id === customer.id);

            expect(customerEntry, 'customer was missing from the admin list');
            expect(customerEntry.isActive === true, 'customer should be active');
            expect(customerEntry.role === 'customer', 'customer role is incorrect');
            expect(
                !Object.hasOwn(customerEntry, 'password'),
                'admin list must not expose password'
            );
            expect(
                !Object.hasOwn(customerEntry, 'tokenVersion'),
                'admin list must not expose tokenVersion'
            );
            expect(
                typeof customerEntry.protection?.isSelf === 'boolean',
                'admin list did not include protection flags'
            );
        });

        await scenario('admin user list supports a username search query', async () => {
            const { response, data } = await request(
                `/api/admin/users?q=${encodeURIComponent(customer.username)}`,
                {
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    }
                }
            );

            expect(response.status === 200, `expected 200, got ${response.status}`);
            expect(data.length === 1, `expected one result, got ${data.length}`);
            expect(data[0].id === customer.id, 'search returned the wrong user');
        });

        await scenario('deactivated users lose existing access and cannot log in', async () => {
            updateUser(customer.username, { isActive: false });

            const activeTokenRequest = await request('/api/users/me/location', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    latitude: 31.7683,
                    longitude: 35.2137
                })
            });

            expect(
                activeTokenRequest.response.status === 401,
                `existing token expected 401, got ${activeTokenRequest.response.status}`
            );

            const newLogin = await login(customer.username, customer.password);

            expect(
                newLogin.response.status === 401,
                `deactivated login expected 401, got ${newLogin.response.status}`
            );
            expect(
                newLogin.data?.message === 'Invalid username or password',
                'expected invalid credentials response'
            );
        });
    } finally {
        try {
            cleanupUsers(createdUsernames);
            console.log('CLEANUP - temporary admin-management users removed');
        } catch (error) {
            results.push(false);
            console.log(`CLEANUP FAILED - ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-504/575 SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main();
