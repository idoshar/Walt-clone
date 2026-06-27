const app = require('./app');
const { connectDatabase } = require('./config/database');
const { seedRestaurants } = require('./seed/seedRestaurants');
const { seedInitialAdmin } = require('./seed/seedInitialAdmin');

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDatabase();
    await seedRestaurants();
    await seedInitialAdmin();

    app.listen(PORT, () => {
        console.log(`Food Delivery API server is running on http://localhost:${PORT}`);
    });
}

startServer();