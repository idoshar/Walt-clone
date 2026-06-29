const Product = require('../models/Product');
const productRepository =
    require('../repositories/productRepository');
const { catalogProducts } = require('./restaurantCatalog');

async function seedProducts() {
    for (const product of catalogProducts) {
        const existingProduct = await Product.findOne({
            restaurantId: product.restaurantId,
            id: product.id
        }).lean();

        if (!existingProduct) {
            await productRepository.save(
                product.restaurantId,
                product
            );
            continue;
        }

        await Product.updateOne(
            { _id: existingProduct._id },
            {
                $set: {
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    categoryId: product.categoryId,
                    category: product.category,
                    image: product.image
                }
            }
        );
    }
}

module.exports = {
    seedProducts
};
