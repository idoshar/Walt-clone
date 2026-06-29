const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function getAdminStatistics(req, res, next) {
    try {
        const [
            usersCount,
            restaurantsCount,
            menuItemsCount,
            ordersCount,
            revenueResult,
            orderStatuses
        ] = await Promise.all([
            User.countDocuments(),
            Restaurant.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),

            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalPrice' },
                        averageOrderValue: { $avg: '$totalPrice' }
                    }
                }
            ]),

            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ])
        ]);

        const revenueStats = revenueResult[0] || {
            totalRevenue: 0,
            averageOrderValue: 0
        };

        return res.status(200).json({
            users: usersCount,
            restaurants: restaurantsCount,
            menuItems: menuItemsCount,
            orders: ordersCount,
            totalRevenue: revenueStats.totalRevenue || 0,
            averageOrderValue: revenueStats.averageOrderValue || 0,
            orderStatuses: orderStatuses.reduce((result, item) => {
                result[item._id || 'unknown'] = item.count;
                return result;
            }, {})
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAdminStatistics
};