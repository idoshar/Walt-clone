const Product = require('../models/Product');
const productRepository =
    require('../repositories/productRepository');
const { catalogProducts } = require('./restaurantCatalog');

async function seedProducts(createdCatalogRestaurantIds = []) {
    const restaurantIdsToSeed = new Set(
        createdCatalogRestaurantIds.map((restaurantId) => String(restaurantId))
    );

    for (const product of catalogProducts) {
        if (!restaurantIdsToSeed.has(String(product.restaurantId))) {
            continue;
        }

        const existingProduct = await Product.findOne({
            restaurantId: product.restaurantId,
            id: product.id
        }).lean();

        if (existingProduct) {
            continue;
        }

        await productRepository.save(
            product.restaurantId,
            product
        );
    }
}

module.exports = {
    seedProducts
};
