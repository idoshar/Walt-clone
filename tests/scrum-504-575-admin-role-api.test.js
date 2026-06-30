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

function readAuditActions(actorUserId, targetUserId) {
    const output = mongoEval(`
        const logs = db.admin_audit_logs.find(
            {
                actorUserId: ${JSON.stringify(actorUserId)},
                targetUserId: ${JSON.stringify(targetUserId)},
                action: 'user.roleChanged'
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

function cleanupUsers(usernames) {
    if (usernames.length === 0) {
        return;
    }

    mongoEval(`
        const users = db.users.find(
            { username: { $in: ${JSON.stringify(usernames)} } },
            { id: 1 }
        ).toArray();

        const userIds = users.map((user) => user.id);

        if (userIds.length > 0) {
            db.admin_audit_logs.deleteMany({
                $or: [
                    { actorUserId: { $in: userIds } },
                    { targetUserId: { $in: userIds } }
                ]
            });
        }

        db.users.deleteMany({
            username: { $in: ${JSON.stringify(usernames)} }
        });
    `);
}

async function createUser(prefix) {
    const username = `${prefix}_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;
    const password = 'AdminRolePass575';

    const { response, data } = await request('/api/users', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password,
            fullName: `SCRUM 575 ${prefix}`,
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

async function callProtectedRoute(token) {
    return request('/api/users/me/location', {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            latitude: 31.7683,
            longitude: 35.2137
        })
    });
}

async function main() {
    const usernames = [];
    let admin;
    let customer;
    let owner;
    let adminToken;
    let customerToken;
    let promotedCustomerToken;

    try {
        await waitForServer();

        await scenario('creates administrator, customer, and owner test accounts', async () => {
            admin = await createUser('role_admin');
            customer = await createUser('role_customer');
            owner = await createUser('role_owner');

            usernames.push(
                admin.username,
                customer.username,
                owner.username
            );

            setUserRole(admin.username, 'admin');
            setUserRole(owner.username, 'owner');

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

            expect(adminToken, 'admin token is missing');
            expect(customerToken, 'customer token is missing');
        });

        await scenario('admin promotes a customer and creates an audit record', async () => {
            const { response, data } = await request(
                `/api/admin/users/${customer.id}/role`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        role: 'admin'
                    })
                }
            );

            expect(
                response.status === 200,
                `promotion expected 200, got ${response.status}`
            );
            expect(data?.id === customer.id, 'wrong user was promoted');
            expect(data?.role === 'admin', 'customer was not promoted');

            const auditActions = readAuditActions(admin.id, customer.id);

            expect(
                auditActions.some(
                    (entry) =>
                        entry.action === 'user.roleChanged' &&
                        entry.details?.previousRole === 'customer' &&
                        entry.details?.role === 'admin'
                ),
                'promotion audit record was not created'
            );
        });

        await scenario('promotion invalidates the previous customer token', async () => {
            const protectedRequest = await callProtectedRoute(customerToken);

            expect(
                protectedRequest.response.status === 401,
                `old customer token expected 401, got ${protectedRequest.response.status}`
            );

            const promotedLogin = await login(
                customer.username,
                customer.password
            );

            expect(
                promotedLogin.response.status === 200,
                `promoted user login expected 200, got ${promotedLogin.response.status}`
            );
            expect(
                promotedLogin.data?.user?.role === 'admin',
                'login did not return the promoted role'
            );

            promotedCustomerToken = promotedLogin.data?.token;
            expect(promotedCustomerToken, 'promoted user token is missing');
        });

        await scenario('admin demotes the promoted administrator and records the change', async () => {
            const { response, data } = await request(
                `/api/admin/users/${customer.id}/role`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        role: 'customer'
                    })
                }
            );

            expect(
                response.status === 200,
                `demotion expected 200, got ${response.status}`
            );
            expect(data?.role === 'customer', 'user was not demoted');

            const auditActions = readAuditActions(admin.id, customer.id);

            expect(
                auditActions.some(
                    (entry) =>
                        entry.action === 'user.roleChanged' &&
                        entry.details?.previousRole === 'admin' &&
                        entry.details?.role === 'customer'
                ),
                'demotion audit record was not created'
            );
        });

        await scenario('demotion invalidates the previous administrator token', async () => {
            const protectedRequest = await callProtectedRoute(
                promotedCustomerToken
            );

            expect(
                protectedRequest.response.status === 401,
                `old admin token expected 401, got ${protectedRequest.response.status}`
            );

            const customerLogin = await login(
                customer.username,
                customer.password
            );

            expect(
                customerLogin.response.status === 200,
                `demoted user login expected 200, got ${customerLogin.response.status}`
            );
            expect(
                customerLogin.data?.user?.role === 'customer',
                'login did not return the demoted role'
            );
        });

        await scenario('administrator cannot change an owner role', async () => {
            const { response, data } = await request(
                `/api/admin/users/${owner.id}/role`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        role: 'customer'
                    })
                }
            );

            expect(
                response.status === 403,
                `owner role change expected 403, got ${response.status}`
            );
            expect(
                data?.message ===
                    'Owner role cannot be changed through administrator role management',
                'unexpected owner protection response'
            );
        });

        await scenario('administrator cannot change their own role', async () => {
            const { response, data } = await request(
                `/api/admin/users/${admin.id}/role`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        role: 'customer'
                    })
                }
            );

            expect(
                response.status === 403,
                `self role change expected 403, got ${response.status}`
            );
            expect(
                data?.message === 'Administrators cannot manage their own account',
                'unexpected self-management response'
            );
        });
    } finally {
        try {
            cleanupUsers(usernames);
            console.log('CLEANUP - temporary admin role users removed');
        } catch (error) {
            results.push(false);
            console.log(`CLEANUP FAILED - ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-504/575 ROLE API SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main();
