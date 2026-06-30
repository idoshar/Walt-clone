const app = require('./app');
const { connectDatabase } = require('./config/database');
const { backfillRecommendationIds } = require('./services/recommendationIdMigration');
const { seedRestaurants } = require('./seed/seedRestaurants');
const { seedInitialAdmin } = require('./seed/seedInitialAdmin');
const { seedProducts } = require('./seed/seedProducts');
const {
    seedMenuCategories
} = require('./seed/seedMenuCategories');

const {
    backfillRestaurantSponsorship
} = require('./services/restaurantSponsorshipMigration');

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDatabase();
    await backfillRecommendationIds();
    const createdCatalogRestaurantIds = await seedRestaurants();
    await backfillRestaurantSponsorship();
    await seedMenuCategories(createdCatalogRestaurantIds);
    await seedInitialAdmin();
    await seedProducts(createdCatalogRestaurantIds);

    app.listen(PORT, () => {
        console.log(`Food Delivery API server is running on http://localhost:${PORT}`);
    });
}

startServer();