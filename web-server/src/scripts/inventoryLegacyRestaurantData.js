const mongoose = require('mongoose');

const { connectDatabase } = require('../config/database');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const MenuCategory = require('../models/MenuCategory');
const Order = require('../models/Order');
const User = require('../models/User');
const {
    catalogRestaurants,
    catalogMenuCategories,
    catalogProducts
} = require('../seed/restaurantCatalog');

function normalize(value) {
    return String(value ?? '').trim();
}

function compositeKey(restaurantId, id) {
    return `${normalize(restaurantId)}::${normalize(id)}`;
}

function countByRestaurant(records) {
    const counts = new Map();

    records.forEach((record) => {
        const restaurantId = normalize(record.restaurantId);

        counts.set(
            restaurantId,
            (counts.get(restaurantId) || 0) + 1
        );
    });

    return counts;
}

function toIsoDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date.toISOString();
}

function printSection(title, records) {
    console.log(`\n=== ${title} (${records.length}) ===`);

    if (records.length === 0) {
        console.log('None');
        return;
    }

    records.forEach((record) => {
        console.log(JSON.stringify(record));
    });
}

function getClassification(restaurant, catalogRestaurantIds) {
    const restaurantId = normalize(restaurant.id);

    if (catalogRestaurantIds.has(restaurantId) && restaurant.isDefault) {
        return 'system-catalog';
    }

    if (catalogRestaurantIds.has(restaurantId)) {
        return 'catalog-id-missing-default-flag';
    }

    if (restaurant.isDefault) {
        return 'unexpected-default-flag';
    }

    if (normalize(restaurant.ownerId)) {
        return 'owner-managed';
    }

    return 'unowned-non-catalog';
}

async function main() {
    await connectDatabase();

    try {
        const [
            restaurants,
            products,
            categories,
            orders,
            users
        ] = await Promise.all([
            Restaurant.find({})
                .sort({ createdAt: 1, _id: 1 })
                .lean(),
            Product.find({})
                .sort({ restaurantId: 1, createdAt: 1, _id: 1 })
                .lean(),
            MenuCategory.find({})
                .sort({ restaurantId: 1, sortOrder: 1, name: 1, _id: 1 })
                .lean(),
            Order.find({})
                .sort({ createdAt: 1, _id: 1 })
                .lean(),
            User.find({})
                .select({ id: 1 })
                .lean()
        ]);

        const catalogRestaurantIds = new Set(
            catalogRestaurants.map((restaurant) => normalize(restaurant.id))
        );

        const catalogProductKeys = new Set(
            catalogProducts.map((product) =>
                compositeKey(product.restaurantId, product.id)
            )
        );

        const catalogCategoryKeys = new Set(
            catalogMenuCategories.map((category) =>
                compositeKey(category.restaurantId, category.id)
            )
        );

        const databaseRestaurantIds = new Set(
            restaurants.map((restaurant) => normalize(restaurant.id))
        );

        const databaseCategoryKeys = new Set(
            categories.map((category) =>
                compositeKey(category.restaurantId, category.id)
            )
        );

        const userIds = new Set(
            users.map((user) => normalize(user.id))
        );

        const productCounts = countByRestaurant(products);
        const categoryCounts = countByRestaurant(categories);
        const orderCounts = countByRestaurant(orders);

        const restaurantRows = restaurants.map((restaurant) => {
            const id = normalize(restaurant.id);
            const ownerId = normalize(restaurant.ownerId);
            const editorIds = Array.isArray(restaurant.editorIds)
                ? restaurant.editorIds.map(normalize).filter(Boolean)
                : [];

            const missingEditorIds = editorIds.filter(
                (editorId) => !userIds.has(editorId)
            );

            const productCount = productCounts.get(id) || 0;
            const categoryCount = categoryCounts.get(id) || 0;
            const orderCount = orderCounts.get(id) || 0;
            const classification = getClassification(
                restaurant,
                catalogRestaurantIds
            );

            const reviewFlags = [];

            if (!catalogRestaurantIds.has(id)) {
                reviewFlags.push('not-in-curated-catalog');
            }

            if (restaurant.isDefault && !catalogRestaurantIds.has(id)) {
                reviewFlags.push('default-flag-without-catalog-entry');
            }

            if (
                catalogRestaurantIds.has(id) &&
                restaurant.isDefault !== true
            ) {
                reviewFlags.push('catalog-id-missing-default-flag');
            }

            if (!ownerId) {
                reviewFlags.push('no-owner');
            } else if (!userIds.has(ownerId)) {
                reviewFlags.push('owner-user-missing');
            }

            if (missingEditorIds.length > 0) {
                reviewFlags.push(
                    `${missingEditorIds.length}-editor-user-reference(s)-missing`
                );
            }

            if (productCount === 0) {
                reviewFlags.push('no-products');
            }

            if (categoryCount === 0) {
                reviewFlags.push('no-menu-categories');
            }

            if (orderCount > 0) {
                reviewFlags.push('has-order-history');
            }

            const strictManualReviewCandidate =
                classification === 'unowned-non-catalog' &&
                productCount === 0 &&
                categoryCount === 0 &&
                orderCount === 0 &&
                editorIds.length === 0;

            return {
                id,
                name: String(restaurant.name || '').trim(),
                classification,
                isDefault: restaurant.isDefault === true,
                ownerId: ownerId || null,
                editorCount: editorIds.length,
                productCount,
                categoryCount,
                orderCount,
                createdAt: toIsoDate(restaurant.createdAt),
                reviewFlags,
                strictManualReviewCandidate
            };
        });

        const missingCatalogRestaurants = catalogRestaurants
            .filter(
                (restaurant) =>
                    !databaseRestaurantIds.has(normalize(restaurant.id))
            )
            .map((restaurant) => ({
                id: normalize(restaurant.id),
                name: String(restaurant.name || '').trim()
            }));

        const missingCatalogProducts = catalogProducts
            .filter(
                (product) =>
                    !products.some(
                        (savedProduct) =>
                            compositeKey(
                                savedProduct.restaurantId,
                                savedProduct.id
                            ) ===
                            compositeKey(product.restaurantId, product.id)
                    )
            )
            .map((product) => ({
                id: normalize(product.id),
                restaurantId: normalize(product.restaurantId),
                name: String(product.name || '').trim()
            }));

        const missingCatalogCategories = catalogMenuCategories
            .filter(
                (category) =>
                    !databaseCategoryKeys.has(
                        compositeKey(category.restaurantId, category.id)
                    )
            )
            .map((category) => ({
                id: normalize(category.id),
                restaurantId: normalize(category.restaurantId),
                name: String(category.name || '').trim()
            }));

        const orphanProducts = products
            .filter(
                (product) =>
                    !databaseRestaurantIds.has(
                        normalize(product.restaurantId)
                    )
            )
            .map((product) => ({
                id: normalize(product.id),
                restaurantId: normalize(product.restaurantId),
                name: String(product.name || '').trim(),
                recommendationId: product.recommendationId
            }));

        const orphanCategories = categories
            .filter(
                (category) =>
                    !databaseRestaurantIds.has(
                        normalize(category.restaurantId)
                    )
            )
            .map((category) => ({
                id: normalize(category.id),
                restaurantId: normalize(category.restaurantId),
                name: String(category.name || '').trim()
            }));

        const productsWithMissingCategories = products
            .filter((product) => {
                const categoryId = normalize(product.categoryId);

                return (
                    categoryId &&
                    !databaseCategoryKeys.has(
                        compositeKey(product.restaurantId, categoryId)
                    )
                );
            })
            .map((product) => ({
                id: normalize(product.id),
                restaurantId: normalize(product.restaurantId),
                categoryId: normalize(product.categoryId),
                name: String(product.name || '').trim()
            }));

        const ordersWithoutCurrentRestaurant = orders
            .filter(
                (order) =>
                    !databaseRestaurantIds.has(
                        normalize(order.restaurantId)
                    )
            )
            .map((order) => ({
                id: normalize(order.id),
                restaurantId: normalize(order.restaurantId),
                restaurantName: String(order.restaurantName || '').trim(),
                status: String(order.status || '').trim(),
                createdAt: toIsoDate(order.createdAt)
            }));

        const unexpectedProductsOnCatalogRestaurants = products
            .filter((product) => {
                const restaurantId = normalize(product.restaurantId);

                return (
                    catalogRestaurantIds.has(restaurantId) &&
                    !catalogProductKeys.has(
                        compositeKey(product.restaurantId, product.id)
                    )
                );
            })
            .map((product) => ({
                id: normalize(product.id),
                restaurantId: normalize(product.restaurantId),
                name: String(product.name || '').trim(),
                recommendationId: product.recommendationId
            }));

        const unexpectedCategoriesOnCatalogRestaurants = categories
            .filter((category) => {
                const restaurantId = normalize(category.restaurantId);

                return (
                    catalogRestaurantIds.has(restaurantId) &&
                    !catalogCategoryKeys.has(
                        compositeKey(category.restaurantId, category.id)
                    )
                );
            })
            .map((category) => ({
                id: normalize(category.id),
                restaurantId: normalize(category.restaurantId),
                name: String(category.name || '').trim()
            }));

        const strictManualReviewCandidates = restaurantRows.filter(
            (restaurant) => restaurant.strictManualReviewCandidate
        );

        console.log('\n=== LEGACY RESTAURANT DATA INVENTORY ===');
        console.log('Mode: read-only');
        console.log('Database changes: none');

        console.log('\n=== Summary ===');
        console.log(
            `Catalog: ${catalogRestaurants.length} restaurants, ` +
                `${catalogMenuCategories.length} categories, ` +
                `${catalogProducts.length} products`
        );
        console.log(
            `Database: ${restaurants.length} restaurants, ` +
                `${categories.length} categories, ` +
                `${products.length} products, ` +
                `${orders.length} orders, ${users.length} users`
        );

        printSection('Restaurant inventory', restaurantRows);
        printSection(
            'Strict manual-review candidates',
            strictManualReviewCandidates
        );
        printSection(
            'Missing curated catalog restaurants',
            missingCatalogRestaurants
        );
        printSection(
            'Missing curated catalog categories',
            missingCatalogCategories
        );
        printSection(
            'Missing curated catalog products',
            missingCatalogProducts
        );
        printSection(
            'Unexpected categories on catalog restaurants',
            unexpectedCategoriesOnCatalogRestaurants
        );
        printSection(
            'Unexpected products on catalog restaurants',
            unexpectedProductsOnCatalogRestaurants
        );
        printSection(
            'Orphan products without a current restaurant',
            orphanProducts
        );
        printSection(
            'Orphan categories without a current restaurant',
            orphanCategories
        );
        printSection(
            'Products with a missing category',
            productsWithMissingCategories
        );
        printSection(
            'Historical orders without a current restaurant',
            ordersWithoutCurrentRestaurant
        );

        console.log(
            '\nInventory complete. No records were created, changed, or deleted.'
        );
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error('\nInventory failed:', error.message);
    process.exitCode = 1;
});