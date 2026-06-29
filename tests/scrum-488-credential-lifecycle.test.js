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

    throw new Error('server did not become ready within 30 seconds');
}

function mongoEval(script) {
    try {
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
    } catch (error) {
        const details =
            error.stderr?.toString().trim() ||
            error.stdout?.toString().trim() ||
            error.message;

        throw new Error(`Mongo test setup failed: ${details}`);
    }
}

function updateUserInMongo(username, updates) {
    const filter = JSON.stringify({ username });
    const update = JSON.stringify({ $set: updates });

    mongoEval(`
        const result = db.users.updateOne(${filter}, ${update});
        print(JSON.stringify({
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        }));
    `);
}

function readUserCredentialsFromMongo(username) {
    const filter = JSON.stringify({ username });

    const output = mongoEval(`
        const user = db.users.findOne(
            ${filter},
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

function deleteUsersFromMongo(usernames) {
    if (usernames.length === 0) {
        return;
    }

    mongoEval(`
        db.users.deleteMany({
            username: {
                $in: ${JSON.stringify(usernames)}
            }
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
            fullName: 'SCRUM 488 Verification User',
            phone: '0500000000',
            address: 'Jerusalem'
        })
    });

    expect(
        response.status === 201,
        `registration expected 201, got ${response.status}`
    );

    return { username, password, user: data };
}

async function login(username, password) {
    const { response, data } = await request('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    return { response, data };
}

async function main() {
    const createdUsernames = [];
    let legacyUser;
    let forcedChangeUser;
    let legacyToken;
    let forcedOldToken;
    let forcedNewToken;

    try {
        await waitForServer();

        await scenario('new registration stores a bcrypt password hash', async () => {
            legacyUser = await createUser('scrum488_legacy', 'SeedPass488');
            createdUsernames.push(legacyUser.username);

            const credentials = readUserCredentialsFromMongo(
                legacyUser.username
            );

            expect(credentials, 'registered user was not found in MongoDB');
            expect(
                BCRYPT_PATTERN.test(credentials.password),
                'newly registered password is not stored as a bcrypt hash'
            );
        });

        await scenario('legacy plain-text password is upgraded after successful login', async () => {
            updateUserInMongo(legacyUser.username, {
                password: 'old',
                mustChangePassword: false,
                tokenVersion: 0
            });

            const beforeLogin = readUserCredentialsFromMongo(
                legacyUser.username
            );

            expect(
                beforeLogin.password === 'old',
                'legacy test password was not prepared correctly'
            );

            const { response, data } = await login(legacyUser.username, 'old');

            expect(
                response.status === 200,
                `legacy login expected 200, got ${response.status}`
            );

            expect(data?.token, 'legacy login did not return a token');
            legacyToken = data.token;

            const afterLogin = readUserCredentialsFromMongo(
                legacyUser.username
            );

            expect(
                BCRYPT_PATTERN.test(afterLogin.password),
                'legacy password was not upgraded to a bcrypt hash'
            );

            expect(
                afterLogin.password !== 'old',
                'legacy plain-text password remained in MongoDB'
            );
        });

        await scenario('mustChangePassword blocks regular protected actions', async () => {
            forcedChangeUser = await createUser(
                'scrum488_forced',
                'ForcePass488'
            );
            createdUsernames.push(forcedChangeUser.username);

            updateUserInMongo(forcedChangeUser.username, {
                mustChangePassword: true,
                tokenVersion: 0
            });

            const { response, data } = await login(
                forcedChangeUser.username,
                forcedChangeUser.password
            );

            expect(
                response.status === 200,
                `forced-change login expected 200, got ${response.status}`
            );

            expect(
                data?.user?.mustChangePassword === true,
                'login response did not expose mustChangePassword state'
            );

            forcedOldToken = data.token;

            const protectedResponse = await request(
                '/api/users/me/location',
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${forcedOldToken}`
                    },
                    body: JSON.stringify({
                        latitude: 31.7683,
                        longitude: 35.2137
                    })
                }
            );

            expect(
                protectedResponse.response.status === 403,
                `forced-change protected action expected 403, got ${protectedResponse.response.status}`
            );

            expect(
                protectedResponse.data?.error === 'PasswordChangeRequired',
                'forced-change protected action returned the wrong error'
            );
        });

        await scenario('mustChangePassword allows password replacement', async () => {
            const passwordChangeResponse = await request(
                '/api/users/me/password',
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${forcedOldToken}`
                    },
                    body: JSON.stringify({
                        currentPassword: 'ForcePass488',
                        newPassword: 'UpdatedPass489'
                    })
                }
            );

            expect(
                passwordChangeResponse.response.status === 200,
                `password replacement expected 200, got ${passwordChangeResponse.response.status}`
            );

            expect(
                passwordChangeResponse.data?.token,
                'password replacement did not return a new token'
            );

            expect(
                passwordChangeResponse.data?.user?.mustChangePassword === false,
                'mustChangePassword was not cleared after password replacement'
            );

            forcedNewToken = passwordChangeResponse.data.token;

            const credentials = readUserCredentialsFromMongo(
                forcedChangeUser.username
            );

            expect(
                credentials.tokenVersion === 1,
                `expected tokenVersion 1 after password replacement, got ${credentials.tokenVersion}`
            );
        });

        await scenario('old token and old password are invalid after replacement', async () => {
            const oldTokenResponse = await request('/api/users/me/location', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${forcedOldToken}`
                },
                body: JSON.stringify({
                    latitude: 31.7683,
                    longitude: 35.2137
                })
            });

            expect(
                oldTokenResponse.response.status === 401,
                `old token expected 401, got ${oldTokenResponse.response.status}`
            );

            const oldLoginResponse = await login(
                forcedChangeUser.username,
                'ForcePass488'
            );

            expect(
                oldLoginResponse.response.status === 401,
                `old password expected 401, got ${oldLoginResponse.response.status}`
            );
        });

        await scenario('new token and new password restore protected access', async () => {
            const newLoginResponse = await login(
                forcedChangeUser.username,
                'UpdatedPass489'
            );

            expect(
                newLoginResponse.response.status === 200,
                `new password login expected 200, got ${newLoginResponse.response.status}`
            );

            expect(
                newLoginResponse.data?.token,
                'new password login did not return a token'
            );

            const protectedResponse = await request(
                '/api/users/me/location',
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${forcedNewToken}`
                    },
                    body: JSON.stringify({
                        latitude: 31.7683,
                        longitude: 35.2137
                    })
                }
            );

            expect(
                protectedResponse.response.status === 200,
                `new token protected action expected 200, got ${protectedResponse.response.status}`
            );
        });

        expect(legacyToken, 'legacy login token was not retained');
    } finally {
        try {
            deleteUsersFromMongo(createdUsernames);
            console.log('CLEANUP - temporary credential-lifecycle users removed');
        } catch (error) {
            console.log(`CLEANUP - could not remove test users: ${error.message}`);
        }
    }

    const passed = results.filter(Boolean).length;
    const failed = results.length - passed;

    console.log(`\nSCRUM-488 SUMMARY: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(`UNEXPECTED TEST ERROR: ${error.message}`);
    process.exitCode = 1;
});
