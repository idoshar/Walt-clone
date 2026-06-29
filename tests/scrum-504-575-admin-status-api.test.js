const { execFileSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const DATABASE_NAME = process.env.MONGODB_DB_NAME || 'food_delivery';
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

    try {
        return { response, data: text ? JSON.parse(text) : null };
    } catch {
        return { response, data: text };
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

function setAdmin(username) {
    mongoEval(`
        db.users.updateOne(
            { username: ${JSON.stringify(username)} },
            { $set: { role: 'admin' } }
        );
    `);
}

function readAuditActions(actorUserId, targetUserId) {
    const output = mongoEval(`
        const logs = db.admin_audit_logs.find(
            {
                actorUserId: ${JSON.stringify(actorUserId)},
                targetUserId: ${JSON.stringify(targetUserId)}
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
    if (usernames.length === 0) return;

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
    const password = 'AdminStatusPass504';

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

    return { id: data.id, username, password };
}

async function login(username, password) {
    return request('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
}

async function main() {
    const usernames = [];
    let admin;
    let customer;
    let adminToken;
    let customerToken;

    try {
        await waitForServer();

        await scenario('creates an admin and a customer test account', async () => {
            admin = await createUser('status_admin');
            customer = await createUser('status_customer');
            usernames.push(admin.username, customer.username);

            setAdmin(admin.username);

            const adminLogin = await login(admin.username, admin.password);
            const customerLogin = await login(
                customer.username,
                customer.password
            );

            expect(adminLogin.response.status === 200, 'admin login failed');
            expect(customerLogin.response.status === 200, 'customer login failed');

            adminToken = adminLogin.data?.token;
            customerToken = customerLogin.data?.token;

            expect(adminToken, 'admin token missing');
            expect(customerToken, 'customer token missing');
        });

        await scenario('admin deactivates a customer through the status API', async () => {
            const { response, data } = await request(
                `/api/admin/users/${customer.id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ isActive: false })
                }
            );

            expect(response.status === 200, `expected 200, got ${response.status}`);
            expect(data?.id === customer.id, 'wrong user was updated');
            expect(data?.isActive === false, 'user remained active');

            const auditActions = readAuditActions(admin.id, customer.id);

            expect(
                auditActions.some(
                    (entry) =>
                        entry.action === 'user.deactivated' &&
                        entry.details?.isActive === false
                ),
                'deactivation audit record was not created'
            );
        });

        await scenario('deactivation invalidates the old token and blocks login', async () => {
            const protectedRequest = await request('/api/users/me/location', {
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
                protectedRequest.response.status === 401,
                `old token expected 401, got ${protectedRequest.response.status}`
            );

            const loginAttempt = await login(customer.username, customer.password);

            expect(
                loginAttempt.response.status === 401,
                `disabled login expected 401, got ${loginAttempt.response.status}`
            );
        });

        await scenario('admin reactivates the customer through the status API', async () => {
            const { response, data } = await request(
                `/api/admin/users/${customer.id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ isActive: true })
                }
            );

            expect(response.status === 200, `expected 200, got ${response.status}`);
            expect(data?.isActive === true, 'user remained inactive');

            const auditActions = readAuditActions(admin.id, customer.id);

            expect(
                auditActions.some(
                    (entry) => entry.action === 'user.reactivated'
                ),
                'reactivation audit record was not created'
            );

            const loginAttempt = await login(customer.username, customer.password);

            expect(
                loginAttempt.response.status === 200,
                `reactivated login expected 200, got ${loginAttempt.response.status}`
            );
        });

        await scenario('an administrator cannot manage their own account', async () => {
            const { response, data } = await request(
                `/api/admin/users/${admin.id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ isActive: false })
                }
            );

            expect(response.status === 403, `expected 403, got ${response.status}`);
            expect(
                data?.message === 'Administrators cannot manage their own account',
                'unexpected self-management response'
            );
        });
    } finally {
        try {
            cleanupUsers(usernames);
            console.log('CLEANUP - temporary admin status users removed');
        } catch (error) {
            results.push(false);
            console.log(`CLEANUP FAILED - ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-504/575 STATUS API SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main();
