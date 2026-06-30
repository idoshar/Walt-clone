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

    try {
        return {
            response,
            data: text ? JSON.parse(text) : null
        };
    } catch {
        return {
            response,
            data: text
        };
    }
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

function setUserRole(username, role) {
    mongoEval(`
        db.users.updateOne(
            { username: ${JSON.stringify(username)} },
            { $set: { role: ${JSON.stringify(role)} } }
        );
    `);
}

function createProtectedRelations(orderUserId, restaurantOwnerId, ids) {
    mongoEval(`
        db.orders.insertOne({
            id: ${JSON.stringify(ids.orderId)},
            userId: ${JSON.stringify(orderUserId)},
            status: 'created'
        });

        db.restaurants.insertOne({
            id: ${JSON.stringify(ids.restaurantId)},
            ownerId: ${JSON.stringify(restaurantOwnerId)},
            name: 'SCRUM 504 protected restaurant'
        });
    `);
}

function readDeleteAudit(actorUserId, targetUserId) {
    const output = mongoEval(`
        const logs = db.admin_audit_logs.find(
            {
                actorUserId: ${JSON.stringify(actorUserId)},
                targetUserId: ${JSON.stringify(targetUserId)},
                action: 'user.deleted'
            },
            { action: 1, details: 1 }
        ).sort({ createdAt: 1 }).toArray();

        print(JSON.stringify(logs.map((log) => ({
            action: log.action,
            details: log.details
        }))));
    `);

    return JSON.parse(output);
}

function cleanup(usernames, userIds, ids) {
    mongoEval(`
        db.orders.deleteMany({
            id: ${JSON.stringify(ids.orderId)}
        });

        db.restaurants.deleteMany({
            id: ${JSON.stringify(ids.restaurantId)}
        });

        db.admin_audit_logs.deleteMany({
            $or: [
                { actorUserId: { $in: ${JSON.stringify(userIds)} } },
                { targetUserId: { $in: ${JSON.stringify(userIds)} } }
            ]
        });

        db.users.deleteMany({
            username: { $in: ${JSON.stringify(usernames)} }
        });
    `);
}

async function createUser(prefix) {
    const username = `${prefix}_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
    const password = 'DeleteUserPass504';

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

    return {
        id: data.id,
        username,
        password
    };
}

async function login(username, password) {
    return request('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password
        })
    });
}

async function deleteUser(token, userId) {
    return request(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

async function main() {
    const usernames = [];
    const userIds = [];
    const relationIds = {
        orderId: `scrum504_order_${Date.now()}_${Math.floor(
            Math.random() * 1000
        )}`,
        restaurantId: `scrum504_restaurant_${Date.now()}_${Math.floor(
            Math.random() * 1000
        )}`
    };

    let admin;
    let deletableCustomer;
    let orderCustomer;
    let restaurantOwner;
    let otherAdmin;
    let adminToken;
    let customerToken;

    try {
        await waitForServer();

        await scenario(
            'creates administrator and protected user test accounts',
            async () => {
                admin = await createUser('delete_admin');
                deletableCustomer = await createUser('delete_customer');
                orderCustomer = await createUser('delete_order_customer');
                restaurantOwner = await createUser('delete_restaurant_owner');
                otherAdmin = await createUser('delete_other_admin');

                for (const user of [
                    admin,
                    deletableCustomer,
                    orderCustomer,
                    restaurantOwner,
                    otherAdmin
                ]) {
                    usernames.push(user.username);
                    userIds.push(user.id);
                }

                setUserRole(admin.username, 'admin');
                setUserRole(otherAdmin.username, 'admin');

                createProtectedRelations(
                    orderCustomer.id,
                    restaurantOwner.id,
                    relationIds
                );

                const adminLogin = await login(admin.username, admin.password);
                const customerLogin = await login(
                    deletableCustomer.username,
                    deletableCustomer.password
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

                expect(adminToken, 'admin token is missing');
                expect(customerToken, 'customer token is missing');
            }
        );

        await scenario('non-admin users cannot delete accounts', async () => {
            const { response } = await deleteUser(
                customerToken,
                orderCustomer.id
            );

            expect(
                response.status === 403,
                `non-admin deletion expected 403, got ${response.status}`
            );
        });

        await scenario('administrator cannot delete their own account', async () => {
            const { response, data } = await deleteUser(adminToken, admin.id);

            expect(
                response.status === 403,
                `self deletion expected 403, got ${response.status}`
            );
            expect(
                data?.message === 'Administrators cannot manage their own account',
                'unexpected self-deletion response'
            );
        });

        await scenario('administrator accounts cannot be deleted', async () => {
            const { response, data } = await deleteUser(
                adminToken,
                otherAdmin.id
            );

            expect(
                response.status === 403,
                `admin deletion expected 403, got ${response.status}`
            );
            expect(
                data?.message === 'Administrator accounts cannot be deleted',
                'unexpected administrator deletion response'
            );
        });

        await scenario('users with orders cannot be deleted', async () => {
            const { response, data } = await deleteUser(
                adminToken,
                orderCustomer.id
            );

            expect(
                response.status === 409,
                `order-linked deletion expected 409, got ${response.status}`
            );
            expect(
                data?.message === 'Users with orders cannot be deleted',
                'unexpected order protection response'
            );
        });

        await scenario('users who own restaurants cannot be deleted', async () => {
            const { response, data } = await deleteUser(
                adminToken,
                restaurantOwner.id
            );

            expect(
                response.status === 409,
                `owner deletion expected 409, got ${response.status}`
            );
            expect(
                data?.message ===
                    'Users who own restaurants cannot be deleted',
                'unexpected restaurant ownership protection response'
            );
        });

        await scenario('admin deletes an unlinked customer and creates audit record', async () => {
            const { response } = await deleteUser(
                adminToken,
                deletableCustomer.id
            );

            expect(
                response.status === 204,
                `deletion expected 204, got ${response.status}`
            );

            const lookup = await request(
                `/api/users/${deletableCustomer.id}`
            );

            expect(
                lookup.response.status === 404,
                `deleted user lookup expected 404, got ${lookup.response.status}`
            );

            const auditLogs = readDeleteAudit(
                admin.id,
                deletableCustomer.id
            );

            expect(
                auditLogs.some(
                    (entry) =>
                        entry.action === 'user.deleted' &&
                        entry.details?.username ===
                            deletableCustomer.username &&
                        entry.details?.role === 'customer'
                ),
                'user deletion audit record was not created'
            );
        });
    } finally {
        try {
            cleanup(usernames, userIds, relationIds);
            console.log('CLEANUP - temporary user-deletion data removed');
        } catch (error) {
            results.push(false);
            console.log(`CLEANUP FAILED - ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-504 USER DELETE API SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main();
