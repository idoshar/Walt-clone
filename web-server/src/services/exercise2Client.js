/**
 * Protocol (text-based, newline-delimited):
 *   POST   [userId] [productId...]  → "201 Created\n"
 *   PATCH  [userId] [productId...]  → "204 No Content\n"
 *   GET    [userId] [productId]     → "200 Ok\n\n[id id ...]\n"
 *   DELETE [userId] [productId...]  → "204 No Content\n"
 */

const net = require('net');


const HOST = process.env.EX2_HOST || '127.0.0.1';
const PORT = parseInt(process.env.EX2_PORT || '5555', 10);

const TIMEOUT_MS = 3000;

function sendCommand(command) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let response = '';
        let settled = false;

        const finish = (err, value) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            if (err) reject(err);
            else resolve(value);
        };

        socket.setTimeout(TIMEOUT_MS);

        socket.connect(PORT, HOST, () => {
            socket.write(command + '\n');
        });

        socket.on('data', (chunk) => {
            response += chunk.toString();

            // The protocol always ends the relevant part with '\n',
            // and GET responses end with '\n' after the product list.
            // We consider the response complete when it ends with '\n'.
            if (response.endsWith('\n')) {
                finish(null, response);
            }
        });

        socket.on('timeout', () => {
            finish(new Error('Exercise 2 server timeout'));
        });

        socket.on('error', (err) => {
            finish(err);
        });

        socket.on('close', () => {
            if (!settled) {
                finish(new Error('Exercise 2 server closed the connection before sending a response'));
            }
        });
    });
}


function parseStatus(raw) {
    const match = raw.match(/^(\d{3})\s/);
    return match ? parseInt(match[1], 10) : 0;
}


async function reportProductView(userId, productId) {
    const uid = parseInt(userId, 10);
    const pid = parseInt(productId, 10);

    if (!uid || !pid || uid <= 0 || pid <= 0) {
        // Non-integer or non-positive id — Ex2 server would reject it anyway
        console.warn(
            `[ex2] Skipping reportProductView: invalid ids (userId=${userId}, productId=${productId})`
        );
        return;
    }

    try {
        // Try PATCH first (user already exists)
        const patchResponse = await sendCommand(`PATCH ${uid} ${pid}`);
        const status = parseStatus(patchResponse);

        if (status === 204) {
            // Success — user existed and the product was recorded
            return;
        }

        if (status === 404) {
            // User does not exist yet on the Ex2 server → create them
            const postResponse = await sendCommand(`POST ${uid} ${pid}`);
            const postStatus = parseStatus(postResponse);

            if (postStatus !== 201) {
                console.warn(
                    `[ex2] Unexpected POST response for user ${uid}: ${postResponse.trim()}`
                );
            }
            return;
        }

        // Any other status is unexpected but non-fatal
        console.warn(
            `[ex2] Unexpected PATCH response for user ${uid}: ${patchResponse.trim()}`
        );
    } catch (err) {
        // Connection refused, timeout, etc. — log and continue
        console.error(`[ex2] Could not reach Exercise 2 server: ${err.message}`);
    }
}


async function getRecommendations(userId, productId) {
    const uid = parseInt(userId, 10);
    const pid = parseInt(productId, 10);

    if (!uid || !pid || uid <= 0 || pid <= 0) {
        return [];
    }

    try {
        const raw = await sendCommand(`GET ${uid} ${pid}`);
        // Response format: "200 Ok\n\n1 2 3\n"
        const status = parseStatus(raw);

        if (status !== 200) {
            return [];
        }

        // Split on newlines, skip the status line and the blank separator,
        // then parse the space-separated product ids on the last line.
        const lines = raw.split('\n').filter(Boolean);
        if (lines.length < 2) {
            return [];
        }

        const productLine = lines[lines.length - 1];
        return productLine
            .split(' ')
            .map((s) => parseInt(s, 10))
            .filter((n) => !isNaN(n) && n > 0);
    } catch (err) {
        console.error(`[ex2] Could not reach Exercise 2 server: ${err.message}`);
        return [];
    }
}

module.exports = {
    reportProductView,
    getRecommendations,
};


