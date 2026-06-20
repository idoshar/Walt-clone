const path = require('path');
const express = require('express');

const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

const clientDistPath = path.join(__dirname, '../../client/dist');

app.use(express.static(clientDistPath));

app.use('/api', apiRoutes);

app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;