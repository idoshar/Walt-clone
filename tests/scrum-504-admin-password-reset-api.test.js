const { execFileSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const DATABASE_NAME = process.env.MONGODB_DB_NAME || 'food_delivery';
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
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

function readUserCredentials(username) {
    const output = mongoEval(`
        const user = db.users.findOne(
            { username: ${JSON.stringify(username)} },
            { password: 1, mustChangePassword: 1, tokenVersion: 1 }
        );

        print(JSON.stringify(
            user
                ? {
                    password: user.password,
                    mustChangePassword: Boolean(user.mustChangePassword),
                    tokenVersion: Number(user.tokenVersion || 0)
                }
                : null
        ));
    `);

    return JSON.parse(output);
}

function readPasswordResetAudit(actorUserId, targetUserId) {
    const output = mongoEval(`
        const logs = db.admin_audit_logs.find(
            {
                actorUserId: ${JSON.stringify(actorUserId)},
                targetUserId: ${JSON.stringify(targetUserId)},
                action: 'user.passwordReset'
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

async function createUser(prefix, password) {
    const username = `${prefix}_${Date.now()}_${Math.floor(
        Math.random() * 1000
    )}`;

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
    const originalPassword = 'OriginalPass504';
    const temporaryPassword = 'TempPass575';
    const replacementPassword = 'RenewedPass576';

    let admin;
    let customer;
    let adminToken;
    let customerToken;
    let temporaryToken;
    let replacementToken;

    try {
        await waitForServer();

        await scenario(
            'creates administrator and customer test accounts',
            async () => {
                admin = await createUser('password_admin', 'AdminPass504');
                customer = await createUser(
                    'password_customer',
                    originalPassword
                );

                usernames.push(admin.username, customer.username);

                setUserRole(admin.username, 'admin');

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
            }
        );

        await scenario(
            'non-admin users cannot reset another user password',
            async () => {
                const { response } = await request(
                    `/api/admin/users/${admin.id}/password`,
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${customerToken}`
                        },
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    response.status === 403,
                    `non-admin reset expected 403, got ${response.status}`
                );
            }
        );

        await scenario(
            'admin reset rejects a password that violates policy',
            async () => {
                const { response, data } = await request(
                    `/api/admin/users/${customer.id}/password`,
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({
                            temporaryPassword: 'short'
                        })
                    }
                );

                expect(
                    response.status === 400,
                    `invalid password expected 400, got ${response.status}`
                );
                expect(
                    data?.error ===
                        'temporaryPassword must be at least 8 characters long',
                    'unexpected password-policy response'
                );
            }
        );

        await scenario(
            'admin resets a customer password without exposing it',
            async () => {
                const { response, data } = await request(
                    `/api/admin/users/${customer.id}/password`,
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    response.status === 200,
                    `password reset expected 200, got ${response.status}`
                );
                expect(data?.id === customer.id, 'wrong user was reset');
                expect(
                    data?.mustChangePassword === true,
                    'reset response did not require password change'
                );
                expect(
                    !Object.hasOwn(data, 'password'),
                    'password reset response exposed a password'
                );

                const credentials = readUserCredentials(customer.username);

                expect(
                    BCRYPT_PATTERN.test(credentials?.password || ''),
                    'temporary password was not stored as bcrypt hash'
                );
                expect(
                    credentials.password !== temporaryPassword,
                    'temporary password was stored as plaintext'
                );
                expect(
                    credentials.mustChangePassword === true,
                    'stored user did not require password change'
                );

                const auditLogs = readPasswordResetAudit(
                    admin.id,
                    customer.id
                );

                expect(
                    auditLogs.some(
                        (entry) =>
                            entry.action === 'user.passwordReset' &&
                            entry.details?.mustChangePassword === true
                    ),
                    'password reset audit record was not created'
                );
                expect(
                    !JSON.stringify(auditLogs).includes(temporaryPassword),
                    'audit record exposed the temporary password'
                );
            }
        );

        await scenario(
            'password reset invalidates old token and old password',
            async () => {
                const oldTokenRequest = await callProtectedRoute(customerToken);

                expect(
                    oldTokenRequest.response.status === 401,
                    `old token expected 401, got ${oldTokenRequest.response.status}`
                );

                const oldPasswordLogin = await login(
                    customer.username,
                    originalPassword
                );

                expect(
                    oldPasswordLogin.response.status === 401,
                    `old password expected 401, got ${oldPasswordLogin.response.status}`
                );
            }
        );

        await scenario(
            'temporary password allows login but requires replacement',
            async () => {
                const temporaryLogin = await login(
                    customer.username,
                    temporaryPassword
                );

                expect(
                    temporaryLogin.response.status === 200,
                    `temporary login expected 200, got ${temporaryLogin.response.status}`
                );
                expect(
                    temporaryLogin.data?.user?.mustChangePassword === true,
                    'temporary login did not report required password change'
                );

                temporaryToken = temporaryLogin.data?.token;
                expect(temporaryToken, 'temporary login token is missing');

                const protectedRequest = await callProtectedRoute(
                    temporaryToken
                );

                expect(
                    protectedRequest.response.status === 403,
                    `restricted token expected 403, got ${protectedRequest.response.status}`
                );
                expect(
                    protectedRequest.data?.error === 'PasswordChangeRequired',
                    'temporary token did not receive password-change restriction'
                );
            }
        );

        await scenario(
            'customer changes the temporary password and restores access',
            async () => {
                const { response, data } = await request(
                    '/api/users/me/password',
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${temporaryToken}`
                        },
                        body: JSON.stringify({
                            currentPassword: temporaryPassword,
                            newPassword: replacementPassword
                        })
                    }
                );

                expect(
                    response.status === 200,
                    `password replacement expected 200, got ${response.status}`
                );
                expect(
                    data?.user?.mustChangePassword === false,
                    'password replacement did not clear required-change state'
                );

                replacementToken = data?.token;
                expect(replacementToken, 'replacement token is missing');

                const oldTemporaryTokenRequest = await callProtectedRoute(
                    temporaryToken
                );

                expect(
                    oldTemporaryTokenRequest.response.status === 401,
                    `old temporary token expected 401, got ${oldTemporaryTokenRequest.response.status}`
                );

                const restoredAccess = await callProtectedRoute(
                    replacementToken
                );

                expect(
                    restoredAccess.response.status === 200,
                    `replacement token expected 200, got ${restoredAccess.response.status}`
                );
            }
        );

        await scenario(
            'administrator cannot reset their own password through admin API',
            async () => {
                const { response, data } = await request(
                    `/api/admin/users/${admin.id}/password`,
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    response.status === 403,
                    `self reset expected 403, got ${response.status}`
                );
                expect(
                    data?.message ===
                        'Administrators cannot manage their own account',
                    'unexpected self-reset response'
                );
            }
        );
    } finally {
        try {
            cleanupUsers(usernames);
            console.log('CLEANUP - temporary password-reset users removed');
        } catch (error) {
            results.push(false);
            console.log(`CLEANUP FAILED - ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-504 PASSWORD RESET API SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main();
