const path = require('path');
const express = require('express');

const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = new Set([
    'http://localhost:8081',
    'http://127.0.0.1:8081'
]);

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET,POST,PUT,DELETE,OPTIONS'
        );
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization'
        );
    }

    if (req.method === 'OPTIONS' && origin && allowedOrigins.has(origin)) {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());

const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');

app.use(express.static(clientDistPath));

app.use('/api', apiRoutes);

app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;