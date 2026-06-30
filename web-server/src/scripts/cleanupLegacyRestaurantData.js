const mongoose = require('mongoose');

const { connectDatabase } = require('../config/database');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const MenuCategory = require('../models/MenuCategory');
const Order = require('../models/Order');
const {
    catalogRestaurants
} = require('../seed/restaurantCatalog');

function normalize(value) {
    return String(value ?? '').trim();
}

function parseArguments(argv) {
    const restaurantIds = [];
    let confirmed = false;

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (argument === '--confirm') {
            confirmed = true;
            continue;
        }

        if (argument === '--restaurant-id') {
            const restaurantId = normalize(argv[index + 1]);

            if (!restaurantId) {
                throw new Error(
                    'Expected an ID after --restaurant-id.'
                );
            }

            restaurantIds.push(restaurantId);
            index += 1;
            continue;
        }

        if (argument.startsWith('--restaurant-id=')) {
            const restaurantId = normalize(
                argument.slice('--restaurant-id='.length)
            );

            if (!restaurantId) {
                throw new Error(
                    'Expected a value in --restaurant-id=<id>.'
                );
            }

            restaurantIds.push(restaurantId);
            continue;
        }

        if (argument === '--help' || argument === '-h') {
            return null;
        }

        throw new Error(`Unknown argument: ${argument}`);
    }

    return {
        confirmed,
        restaurantIds: [...new Set(restaurantIds)]
    };
}

function printUsage() {
    console.log(
        [
            'Usage:',
            '  node src/scripts/cleanupLegacyRestaurantData.js --confirm \\',
            '    --restaurant-id <id> [--restaurant-id <id> ...]',
            '',
            'This command deletes only the explicitly supplied restaurant IDs,',
            'their Products, and their MenuCategories.',
            'It never deletes Users or Orders.'
        ].join('\n')
    );
}

async function assessTarget(restaurantId, catalogRestaurantIds) {
    const restaurant = await Restaurant.findOne({ id: restaurantId }).lean();

    if (!restaurant) {
        return {
            restaurantId,
            status: 'blocked-not-found',
            reason: 'The requested restaurant does not exist.'
        };
    }

    const [
        productCount,
        categoryCount,
        orderCount
    ] = await Promise.all([
        Product.countDocuments({ restaurantId }),
        MenuCategory.countDocuments({ restaurantId }),
        Order.countDocuments({ restaurantId })
    ]);

    const isCatalogRestaurant = catalogRestaurantIds.has(restaurantId);
    const isDefaultRestaurant = restaurant.isDefault === true;

    if (isCatalogRestaurant || isDefaultRestaurant) {
        return {
            restaurantId,
            name: String(restaurant.name || '').trim(),
            isCatalogRestaurant,
            isDefaultRestaurant,
            productCount,
            categoryCount,
            orderCount,
            status: 'blocked-protected-restaurant',
            reason:
                'Catalog and default restaurants are protected from cleanup.'
        };
    }

    if (orderCount > 0) {
        return {
            restaurantId,
            name: String(restaurant.name || '').trim(),
            isCatalogRestaurant,
            isDefaultRestaurant,
            productCount,
            categoryCount,
            orderCount,
            status: 'blocked-order-history',
            reason:
                'Restaurants with historical orders require a separate review.'
        };
    }

    return {
        restaurantId,
        name: String(restaurant.name || '').trim(),
        isCatalogRestaurant,
        isDefaultRestaurant,
        productCount,
        categoryCount,
        orderCount,
        status: 'approved',
        reason:
            'No protected catalog/default status and no historical orders.'
    };
}

function printAssessments(assessments) {
    assessments.forEach((assessment) => {
        console.log(JSON.stringify(assessment));
    });
}

async function main() {
    const parsedArguments = parseArguments(process.argv.slice(2));

    if (parsedArguments === null) {
        printUsage();
        return;
    }

    const { confirmed, restaurantIds } = parsedArguments;

    if (!confirmed) {
        printUsage();
        throw new Error(
            'Cleanup requires the explicit --confirm flag.'
        );
    }

    if (restaurantIds.length === 0) {
        printUsage();
        throw new Error(
            'At least one explicit --restaurant-id is required.'
        );
    }

    const catalogRestaurantIds = new Set(
        catalogRestaurants.map((restaurant) => normalize(restaurant.id))
    );

    await connectDatabase();

    try {
        const assessments = await Promise.all(
            restaurantIds.map((restaurantId) =>
                assessTarget(restaurantId, catalogRestaurantIds)
            )
        );

        console.log('\n=== LEGACY RESTAURANT CLEANUP PRECHECK ===');
        console.log('Mode: destructive cleanup after successful precheck');
        console.log('Requested target count:', restaurantIds.length);

        printAssessments(assessments);

        const blockedTargets = assessments.filter(
            (assessment) => assessment.status !== 'approved'
        );

        if (blockedTargets.length > 0) {
            console.error(
                '\nCleanup blocked. No records were changed because at least one target failed precheck.'
            );
            process.exitCode = 1;
            return;
        }

        console.log(
            '\nAll targets passed precheck. Removing dependent menu data and restaurants.'
        );

        const cleanupResults = [];

        for (const assessment of assessments) {
            const restaurantId = assessment.restaurantId;

            const [
                deletedProducts,
                deletedCategories
            ] = await Promise.all([
                Product.deleteMany({ restaurantId }),
                MenuCategory.deleteMany({ restaurantId })
            ]);

            const deletedRestaurant = await Restaurant.deleteOne({
                id: restaurantId
            });

            if (deletedRestaurant.deletedCount !== 1) {
                throw new Error(
                    `Failed to remove restaurant ${restaurantId}.`
                );
            }

            const [
                remainingRestaurants,
                remainingProducts,
                remainingCategories,
                remainingOrders
            ] = await Promise.all([
                Restaurant.countDocuments({ id: restaurantId }),
                Product.countDocuments({ restaurantId }),
                MenuCategory.countDocuments({ restaurantId }),
                Order.countDocuments({ restaurantId })
            ]);

            if (
                remainingRestaurants !== 0 ||
                remainingProducts !== 0 ||
                remainingCategories !== 0 ||
                remainingOrders !== 0
            ) {
                throw new Error(
                    `Post-cleanup verification failed for ${restaurantId}.`
                );
            }

            cleanupResults.push({
                restaurantId,
                name: assessment.name,
                deletedProducts: deletedProducts.deletedCount,
                deletedCategories: deletedCategories.deletedCount,
                deletedRestaurants: deletedRestaurant.deletedCount,
                preservedOrders: remainingOrders
            });
        }

        console.log('\n=== LEGACY RESTAURANT CLEANUP RESULT ===');

        cleanupResults.forEach((result) => {
            console.log(JSON.stringify(result));
        });

        console.log(
            '\nCleanup complete. No Users or Orders were deleted.'
        );
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error('\nCleanup failed:', error.message);
    process.exitCode = 1;
});