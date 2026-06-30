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

function parseRestaurantIds(argv) {
    const ids = [];

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (argument === '--restaurant-id') {
            const value = normalize(argv[index + 1]);

            if (!value) {
                throw new Error(
                    'Expected an ID after --restaurant-id.'
                );
            }

            ids.push(value);
            index += 1;
            continue;
        }

        if (argument.startsWith('--restaurant-id=')) {
            const value = normalize(
                argument.slice('--restaurant-id='.length)
            );

            if (!value) {
                throw new Error(
                    'Expected a value in --restaurant-id=<id>.'
                );
            }

            ids.push(value);
            continue;
        }

        if (argument === '--help' || argument === '-h') {
            return null;
        }

        throw new Error(`Unknown argument: ${argument}`);
    }

    return [...new Set(ids)];
}

function printUsage() {
    console.log(
        [
            'Usage:',
            '  node src/scripts/dryRunLegacyRestaurantCleanup.js \\',
            '    --restaurant-id <id> [--restaurant-id <id> ...]',
            '',
            'This command is read-only. It does not delete or update records.'
        ].join('\n')
    );
}

function getTargetStatus({
    restaurant,
    isCatalogRestaurant,
    productCount,
    categoryCount,
    orderCount
}) {
    if (isCatalogRestaurant || restaurant.isDefault === true) {
        return 'blocked-protected-catalog';
    }

    if (orderCount > 0) {
        return 'requires-order-history-review';
    }

    if (productCount === 0 && categoryCount === 0) {
        return 'ready-for-manual-approval-no-dependent-menu-data';
    }

    return 'ready-for-manual-approval-with-dependent-menu-data';
}

async function main() {
    const requestedIds = parseRestaurantIds(process.argv.slice(2));

    if (requestedIds === null) {
        printUsage();
        return;
    }

    if (requestedIds.length === 0) {
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
        const restaurants = await Restaurant.find({
            id: { $in: requestedIds }
        }).lean();

        const restaurantsById = new Map(
            restaurants.map((restaurant) => [
                normalize(restaurant.id),
                restaurant
            ])
        );

        const results = [];

        for (const restaurantId of requestedIds) {
            const restaurant = restaurantsById.get(restaurantId);

            if (!restaurant) {
                results.push({
                    restaurantId,
                    status: 'not-found',
                    action: 'none'
                });
                continue;
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

            const isCatalogRestaurant = catalogRestaurantIds.has(
                restaurantId
            );

            const status = getTargetStatus({
                restaurant,
                isCatalogRestaurant,
                productCount,
                categoryCount,
                orderCount
            });

            results.push({
                restaurantId,
                name: String(restaurant.name || '').trim(),
                isDefault: restaurant.isDefault === true,
                isCatalogRestaurant,
                ownerId: normalize(restaurant.ownerId) || null,
                productCount,
                categoryCount,
                orderCount,
                status,
                action:
                    status.startsWith('ready-for-manual-approval')
                        ? 'review before cleanup'
                        : 'do not delete'
            });
        }

        const summary = results.reduce(
            (counts, result) => {
                counts[result.status] =
                    (counts[result.status] || 0) + 1;

                return counts;
            },
            {}
        );

        console.log('\n=== LEGACY RESTAURANT CLEANUP DRY RUN ===');
        console.log('Mode: read-only');
        console.log('Database changes: none');

        console.log('\n=== Requested targets ===');

        results.forEach((result) => {
            console.log(JSON.stringify(result));
        });

        console.log('\n=== Summary ===');

        Object.entries(summary)
            .sort(([left], [right]) => left.localeCompare(right))
            .forEach(([status, count]) => {
                console.log(`${status}: ${count}`);
            });

        console.log(
            '\nDry run complete. No restaurant, product, category, or order was changed.'
        );
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error('\nDry run failed:', error.message);
    process.exitCode = 1;
});