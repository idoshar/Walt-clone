const MenuCategory = require('../models/MenuCategory');
const {
    catalogMenuCategories
} = require('./restaurantCatalog');

async function seedMenuCategories() {
    for (const category of catalogMenuCategories) {
        const existingCategory = await MenuCategory.findOne({
            id: category.id
        }).lean();

        if (!existingCategory) {
            await MenuCategory.create(category);
            continue;
        }

        if (
            String(existingCategory.restaurantId) !==
            String(category.restaurantId)
        ) {
            console.warn(
                `Skipping catalog category ${category.id}: ` +
                    'the id already belongs to another restaurant.'
            );
            continue;
        }

        await MenuCategory.updateOne(
            { _id: existingCategory._id },
            { $set: category }
        );
    }
}

module.exports = {
    seedMenuCategories
};
