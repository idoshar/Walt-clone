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
        {
            encoding: 'utf8'
        }
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

function readResetRequestsForUser(userId) {
    const output = mongoEval(`
        const requests = db.passwordresetrequests.find(
            { userId: ${JSON.stringify(userId)} },
            {
                id: 1,
                userId: 1,
                status: 1,
                reviewedByUserId: 1,
                reviewedAt: 1,
                createdAt: 1
            }
        ).sort({ createdAt: 1, _id: 1 }).toArray();

        print(JSON.stringify(requests));
    `);

    return JSON.parse(output);
}

function readUserCredentials(username) {
    const output = mongoEval(`
        const user = db.users.findOne(
            { username: ${JSON.stringify(username)} },
            {
                password: 1,
                mustChangePassword: 1,
                tokenVersion: 1
            }
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

function readAuditLogs(actorUserId, targetUserId) {
    const output = mongoEval(`
        const logs = db.admin_audit_logs.find(
            {
                actorUserId: ${JSON.stringify(actorUserId)},
                targetUserId: ${JSON.stringify(targetUserId)}
            },
            {
                action: 1,
                details: 1
            }
        ).sort({ createdAt: 1, _id: 1 }).toArray();

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
            db.passwordresetrequests.deleteMany({
                userId: { $in: userIds }
            });

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
        Math.random() * 100000
    )}`;

    const { response, data } = await request('/api/users', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password,
            fullName: `SCRUM 563 ${prefix}`,
            phone: '0500000000',
            address: 'Jerusalem'
        })
    });

    expect(
        response.status === 201,
        `registration expected 201, got ${response.status}`
    );
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

async function submitPasswordResetRequest(username) {
    return request('/api/password-reset-requests', {
        method: 'POST',
        body: JSON.stringify({
            username
        })
    });
}

function adminHeaders(token) {
    return {
        Authorization: `Bearer ${token}`
    };
}

async function main() {
    const usernames = [];
    const originalPassword = 'OriginalPass563';
    const temporaryPassword = 'TemporaryPass563';
    const replacementPassword = 'ReplacementPass563';

    let admin;
    let customer;
    let rejectedCustomer;

    let adminToken;
    let customerToken;

    let customerRequestId;
    let rejectedCustomerRequestId;

    try {
        await waitForServer();

        await scenario(
            'creates isolated administrator and customer accounts',
            async () => {
                admin = await createUser('reset_admin', 'AdminPass563');
                customer = await createUser(
                    'reset_customer',
                    originalPassword
                );
                rejectedCustomer = await createUser(
                    'rejected_customer',
                    'RejectedPass563'
                );

                usernames.push(
                    admin.username,
                    customer.username,
                    rejectedCustomer.username
                );

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
            'public requests return the same generic response for existing and unknown usernames',
            async () => {
                const known = await submitPasswordResetRequest(
                    customer.username
                );
                const unknown = await submitPasswordResetRequest(
                    `unknown_${Date.now()}`
                );

                expect(
                    known.response.status === 202,
                    `known username expected 202, got ${known.response.status}`
                );
                expect(
                    unknown.response.status === 202,
                    `unknown username expected 202, got ${unknown.response.status}`
                );
                expect(
                    known.data?.message === unknown.data?.message,
                    'known and unknown usernames returned different messages'
                );
                expect(
                    typeof known.data?.message === 'string' &&
                        known.data.message.length > 0,
                    'generic response message is missing'
                );

                const customerRequests =
                    readResetRequestsForUser(customer.id);

                expect(
                    customerRequests.length === 1,
                    'known user did not receive exactly one request'
                );
                expect(
                    customerRequests[0].status === 'pending',
                    'new password-reset request is not pending'
                );

                customerRequestId = customerRequests[0].id;
            }
        );

        await scenario(
            'duplicate public submissions do not create duplicate open requests',
            async () => {
                const duplicate = await submitPasswordResetRequest(
                    customer.username
                );

                expect(
                    duplicate.response.status === 202,
                    `duplicate submission expected 202, got ${duplicate.response.status}`
                );

                const customerRequests =
                    readResetRequestsForUser(customer.id);

                expect(
                    customerRequests.length === 1,
                    `expected one request after duplicate submission, got ${customerRequests.length}`
                );
                expect(
                    customerRequests[0].id === customerRequestId,
                    'duplicate submission replaced the original pending request'
                );
            }
        );

        await scenario(
            'admin request endpoints reject anonymous and non-admin callers',
            async () => {
                const anonymous = await request(
                    '/api/admin/password-reset-requests'
                );

                expect(
                    anonymous.response.status === 401,
                    `anonymous list expected 401, got ${anonymous.response.status}`
                );

                const customerList = await request(
                    '/api/admin/password-reset-requests',
                    {
                        headers: adminHeaders(customerToken)
                    }
                );

                expect(
                    customerList.response.status === 403,
                    `customer list expected 403, got ${customerList.response.status}`
                );

                const customerApproval = await request(
                    `/api/admin/password-reset-requests/${customerRequestId}/approve`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(customerToken),
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    customerApproval.response.status === 403,
                    `customer approval expected 403, got ${customerApproval.response.status}`
                );
            }
        );

        await scenario(
            'administrator can list pending requests without password data',
            async () => {
                const { response, data } = await request(
                    '/api/admin/password-reset-requests?status=pending',
                    {
                        headers: adminHeaders(adminToken)
                    }
                );

                expect(
                    response.status === 200,
                    `pending list expected 200, got ${response.status}`
                );
                expect(Array.isArray(data), 'pending list must be an array');

                const customerRequest = data.find(
                    (entry) => entry.id === customerRequestId
                );

                expect(
                    customerRequest,
                    'customer password-reset request is missing from admin list'
                );
                expect(
                    customerRequest.status === 'pending',
                    'admin list returned wrong request status'
                );
                expect(
                    customerRequest.user?.id === customer.id,
                    'admin list returned the wrong request user'
                );
                expect(
                    !Object.hasOwn(customerRequest.user || {}, 'password'),
                    'admin list exposed a password'
                );
                expect(
                    !Object.hasOwn(customerRequest.user || {}, 'tokenVersion'),
                    'admin list exposed tokenVersion'
                );
            }
        );

        await scenario(
            'approval validates the temporary-password policy before changing request state',
            async () => {
                const { response } = await request(
                    `/api/admin/password-reset-requests/${customerRequestId}/approve`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken),
                        body: JSON.stringify({
                            temporaryPassword: 'short'
                        })
                    }
                );

                expect(
                    response.status === 400,
                    `invalid temporary password expected 400, got ${response.status}`
                );

                const customerRequests =
                    readResetRequestsForUser(customer.id);

                expect(
                    customerRequests[0]?.status === 'pending',
                    'invalid password changed the request status'
                );
            }
        );

        await scenario(
            'administrator cannot approve a password-reset request for their own account',
            async () => {
                const submission = await submitPasswordResetRequest(
                    admin.username
                );

                expect(
                    submission.response.status === 202,
                    `admin request expected 202, got ${submission.response.status}`
                );

                const adminRequests = readResetRequestsForUser(admin.id);
                const adminRequest = adminRequests.find(
                    (entry) => entry.status === 'pending'
                );

                expect(
                    adminRequest?.id,
                    'admin password-reset request was not created'
                );

                const { response, data } = await request(
                    `/api/admin/password-reset-requests/${adminRequest.id}/approve`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken),
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    response.status === 403,
                    `self approval expected 403, got ${response.status}`
                );
                expect(
                    data?.message ===
                        'Administrators cannot manage their own account',
                    'unexpected self-approval response'
                );

                const selfRejection = await request(
                    `/api/admin/password-reset-requests/${adminRequest.id}/reject`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken)
                    }
                );

                expect(
                    selfRejection.response.status === 403,
                    `self rejection expected 403, got ${selfRejection.response.status}`
                );
                expect(
                    selfRejection.data?.message ===
                        'Administrators cannot manage their own account',
                    'unexpected self-rejection response'
                );

                const updatedAdminRequests =
                    readResetRequestsForUser(admin.id);

                expect(
                    updatedAdminRequests.find(
                        (entry) => entry.id === adminRequest.id
                    )?.status === 'pending',
                    'self-management did not leave the request pending'
                );
            }
        );

        await scenario(
            'administrator approval resets the password and marks the request approved',
            async () => {
                const { response, data } = await request(
                    `/api/admin/password-reset-requests/${customerRequestId}/approve`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken),
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    response.status === 200,
                    `approval expected 200, got ${response.status}`
                );
                expect(
                    data?.id === customerRequestId,
                    'approval returned the wrong request'
                );
                expect(
                    data?.status === 'approved',
                    'approved request has the wrong status'
                );
                expect(
                    data?.user?.mustChangePassword === true,
                    'approved user is not required to change password'
                );
                expect(
                    !JSON.stringify(data).includes(temporaryPassword),
                    'approval response exposed the temporary password'
                );

                const credentials = readUserCredentials(customer.username);

                expect(
                    BCRYPT_PATTERN.test(credentials?.password || ''),
                    'temporary password was not stored as a bcrypt hash'
                );
                expect(
                    credentials.password !== temporaryPassword,
                    'temporary password was stored as plaintext'
                );
                expect(
                    credentials.mustChangePassword === true,
                    'stored user does not require a password change'
                );
            }
        );

        await scenario(
            'approval invalidates old credentials and temporary credentials require replacement',
            async () => {
                const oldTokenRequest =
                    await callProtectedRoute(customerToken);

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
                    'temporary login did not require a password change'
                );

                const temporaryToken = temporaryLogin.data?.token;

                expect(
                    temporaryToken,
                    'temporary login token is missing'
                );

                const restrictedRequest = await callProtectedRoute(
                    temporaryToken
                );

                expect(
                    restrictedRequest.response.status === 403,
                    `restricted token expected 403, got ${restrictedRequest.response.status}`
                );
                expect(
                    restrictedRequest.data?.error ===
                        'PasswordChangeRequired',
                    'temporary token did not receive password-change restriction'
                );

                const replacement = await request(
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
                    replacement.response.status === 200,
                    `password replacement expected 200, got ${replacement.response.status}`
                );
                expect(
                    replacement.data?.user?.mustChangePassword === false,
                    'password replacement did not clear mustChangePassword'
                );

                const replacementToken = replacement.data?.token;

                expect(
                    replacementToken,
                    'password replacement token is missing'
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
            'administrator cannot reject their own password-reset request',
            async () => {
                const adminRequests = readResetRequestsForUser(admin.id);

                const adminRequest = adminRequests.find(
                    (entry) => entry.status === 'pending'
                );

                expect(
                    adminRequest?.id,
                    'expected the self-request from the previous scenario'
                );

                const { response, data } = await request(
                    `/api/admin/password-reset-requests/${adminRequest.id}/reject`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken)
                    }
                );

                expect(
                    response.status === 403,
                    `self rejection expected 403, got ${response.status}`
                );
                expect(
                    data?.message ===
                        'Administrators cannot manage their own account',
                    'unexpected self-rejection response'
                );

                const updatedRequests =
                    readResetRequestsForUser(admin.id);

                expect(
                    updatedRequests.find(
                        (entry) => entry.id === adminRequest.id
                    )?.status === 'pending',
                    'self-rejection changed the request state'
                );
            }
        );
        await scenario(
            'administrator can reject a different user request and rejected requests cannot be approved',
            async () => {
                const submission = await submitPasswordResetRequest(
                    rejectedCustomer.username
                );

                expect(
                    submission.response.status === 202,
                    `rejection test submission expected 202, got ${submission.response.status}`
                );

                const rejectedRequests = readResetRequestsForUser(
                    rejectedCustomer.id
                );

                rejectedCustomerRequestId = rejectedRequests[0]?.id;

                expect(
                    rejectedCustomerRequestId,
                    'rejection test request was not created'
                );

                const rejection = await request(
                    `/api/admin/password-reset-requests/${rejectedCustomerRequestId}/reject`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken)
                    }
                );

                expect(
                    rejection.response.status === 200,
                    `rejection expected 200, got ${rejection.response.status}`
                );
                expect(
                    rejection.data?.status === 'rejected',
                    'request was not marked rejected'
                );

                const repeatApproval = await request(
                    `/api/admin/password-reset-requests/${rejectedCustomerRequestId}/approve`,
                    {
                        method: 'PATCH',
                        headers: adminHeaders(adminToken),
                        body: JSON.stringify({
                            temporaryPassword
                        })
                    }
                );

                expect(
                    repeatApproval.response.status === 409,
                    `approval after rejection expected 409, got ${repeatApproval.response.status}`
                );
            }
        );

        await scenario(
            'approval and rejection create safe audit records',
            async () => {
                const customerAudit = readAuditLogs(
                    admin.id,
                    customer.id
                );

                expect(
                    customerAudit.some(
                        (entry) =>
                            entry.action === 'user.passwordReset' &&
                            entry.details?.source ===
                                'approvedPasswordResetRequest' &&
                            entry.details?.passwordResetRequestId ===
                                customerRequestId
                    ),
                    'temporary-password audit record is missing'
                );

                expect(
                    customerAudit.some(
                        (entry) =>
                            entry.action ===
                                'passwordResetRequest.approved' &&
                            entry.details?.passwordResetRequestId ===
                                customerRequestId
                    ),
                    'approval audit record is missing'
                );

                const rejectedAudit = readAuditLogs(
                    admin.id,
                    rejectedCustomer.id
                );

                expect(
                    rejectedAudit.some(
                        (entry) =>
                            entry.action ===
                                'passwordResetRequest.rejected' &&
                            entry.details?.passwordResetRequestId ===
                                rejectedCustomerRequestId
                    ),
                    'rejection audit record is missing'
                );

                const allAuditText = JSON.stringify([
                    ...customerAudit,
                    ...rejectedAudit
                ]);

                expect(
                    !allAuditText.includes(temporaryPassword),
                    'audit data exposed the temporary password'
                );
            }
        );

        await scenario(
            'administrator request list validates status filters',
            async () => {
                const { response } = await request(
                    '/api/admin/password-reset-requests?status=invalid',
                    {
                        headers: adminHeaders(adminToken)
                    }
                );

                expect(
                    response.status === 400,
                    `invalid status expected 400, got ${response.status}`
                );
            }
        );
    } finally {
        try {
            cleanupUsers(usernames);
            console.log(
                'CLEANUP - temporary password-reset request users removed'
            );
        } catch (error) {
            results.push(false);
            console.log(`CLEANUP FAILED - ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;

    console.log(
        `\nSCRUM-563 PASSWORD-RESET REQUEST API SUMMARY: ${passed} passed, ${
            results.length - passed
        } failed`
    );

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main();