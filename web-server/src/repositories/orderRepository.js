const Order = require('../models/Order');
const { generateId } = require('../utilities/idGenerator');

class OrderRepository {
    async create({
        userId,
        restaurantId,
        restaurantName,
        restaurantImage,
        items,
        deliveryDetails
    }) {
        const totalPrice = items.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        return Order.create({
            id: generateId(),
            userId: String(userId),
            restaurantId: String(restaurantId),
            restaurantName,
            restaurantImage,
            items,
            deliveryDetails,
            totalPrice,
            status: 'created'
        });
    }

    async findById(id) {
        return Order.findOne({ id: String(id) });
    }

    async findByUserId(userId) {
        return Order.find({ userId: String(userId) }).sort({
            createdAt: -1
        });
    }

    async findAll() {
        return Order.find({}).sort({ createdAt: -1 });
    }

    async getRestaurantSalesStatistics(restaurantId) {
        const [result] = await Order.aggregate([
            {
                $match: {
                    restaurantId: String(restaurantId),
                    status: {
                        $ne: 'cancelled'
                    }
                }
            },
            {
                $facet: {
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: {
                                    $sum: 1
                                },
                                totalRevenue: {
                                    $sum: '$totalPrice'
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalOrders: 1,
                                totalRevenue: 1,
                                averageOrderValue: {
                                    $divide: [
                                        '$totalRevenue',
                                        '$totalOrders'
                                    ]
                                }
                            }
                        }
                    ],
                    productSales: [
                        {
                            $unwind: '$items'
                        },
                        {
                            $group: {
                                _id: {
                                    productId: '$items.productId',
                                    productName: '$items.productName'
                                },
                                orderIds: {
                                    $addToSet: '$id'
                                },
                                quantitySold: {
                                    $sum: '$items.quantity'
                                },
                                revenue: {
                                    $sum: {
                                        $multiply: [
                                            '$items.price',
                                            '$items.quantity'
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                productId: '$_id.productId',
                                productName: '$_id.productName',
                                ordersContainingProduct: {
                                    $size: '$orderIds'
                                },
                                quantitySold: 1,
                                revenue: 1
                            }
                        },
                        {
                            $sort: {
                                quantitySold: -1,
                                revenue: -1,
                                productName: 1
                            }
                        }
                    ]
                }
            }
        ]);

        const summary = result?.summary?.[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0
        };

        const productSales = result?.productSales || [];

        return {
            ...summary,
            topProduct: productSales[0]
                ? {
                    productId: productSales[0].productId,
                    productName: productSales[0].productName,
                    ordersContainingProduct:
                        productSales[0].ordersContainingProduct,
                    quantitySold: productSales[0].quantitySold,
                    revenue: productSales[0].revenue
                }
                : null,
            productSales
        };
    }

    async update(id, updates) {
        const {
            id: _id,
            userId: _uid,
            restaurantId: _rid,
            restaurantName: _restaurantName,
            restaurantImage: _restaurantImage,
            deliveryDetails: _deliveryDetails,
            createdAt: _ca,
            ...safeUpdates
        } = updates;

        return Order.findOneAndUpdate(
            { id: String(id) },
            safeUpdates,
            { new: true, runValidators: true }
        );
    }

    async delete(id) {
        const result = await Order.deleteOne({ id: String(id) });

        return result.deletedCount > 0;
    }
}

module.exports = new OrderRepository();
