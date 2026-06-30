const orderRepository = require('../repositories/orderRepository');
const userRepository = require('../repositories/userRepository');
const restaurantRepository =
    require('../repositories/restaurantRepository');
const productRepository =
    require('../repositories/productRepository');

function isPlainObject(value) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
}

function hasOwnProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
}

function normalizeQuantity(quantity) {
    const value = Number(quantity);

    if (!Number.isSafeInteger(value) || value <= 0) {
        return null;
    }

    return value;
}

function normalizeDinerCount(value) {
    const normalizedValue = Number(value);

    if (
        !Number.isSafeInteger(normalizedValue) ||
        normalizedValue < 1 ||
        normalizedValue > 99
    ) {
        return null;
    }

    return normalizedValue;
}

function normalizeRequiredText(value, maximumLength) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim().replace(/\s+/g, ' ');

    if (
        !normalizedValue ||
        normalizedValue.length > maximumLength
    ) {
        return null;
    }

    return normalizedValue;
}

function normalizeNotes(value) {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim();

    if (normalizedValue.length > 500) {
        return null;
    }

    return normalizedValue;
}

function isValidCoordinatePair(latitude, longitude) {
    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

function resolveDeliveryField(
    details,
    field,
    defaultValue,
    maximumLength,
    fieldLabel
) {
    const rawValue = hasOwnProperty(details, field)
        ? details[field]
        : defaultValue;

    const normalizedValue = normalizeRequiredText(
        rawValue,
        maximumLength
    );

    if (!normalizedValue) {
        return {
            error:
                'deliveryDetails.' +
                fieldLabel +
                ' must be a non-empty string up to ' +
                maximumLength +
                ' characters'
        };
    }

    return {
        value: normalizedValue
    };
}

function resolveDeliveryLocation(details, user) {
    if (!hasOwnProperty(details, 'location')) {
        const profileLatitude = user.latitude;
        const profileLongitude = user.longitude;

        if (
            isValidCoordinatePair(
                profileLatitude,
                profileLongitude
            )
        ) {
            return {
                value: {
                    latitude: profileLatitude,
                    longitude: profileLongitude,
                    source: 'profile'
                }
            };
        }

        return {
            value: null
        };
    }

    if (details.location === null) {
        return {
            value: null
        };
    }

    if (!isPlainObject(details.location)) {
        return {
            error:
                'deliveryDetails.location must be an object or null'
        };
    }

    const latitude = details.location.latitude;
    const longitude = details.location.longitude;

    if (!isValidCoordinatePair(latitude, longitude)) {
        return {
            error:
                'deliveryDetails.location must include valid latitude and longitude coordinates'
        };
    }

    return {
        value: {
            latitude,
            longitude,
            source: 'shared'
        }
    };
}

function createDeliveryDetailsSnapshot(user, deliveryDetailsInput) {
    if (
        deliveryDetailsInput !== undefined &&
        deliveryDetailsInput !== null &&
        !isPlainObject(deliveryDetailsInput)
    ) {
        return {
            error: 'deliveryDetails must be a JSON object'
        };
    }

    const details = deliveryDetailsInput || {};

    const recipientName = resolveDeliveryField(
        details,
        'recipientName',
        user.fullName,
        100,
        'recipientName'
    );

    if (recipientName.error) {
        return recipientName;
    }

    const phone = resolveDeliveryField(
        details,
        'phone',
        user.phone,
        40,
        'phone'
    );

    if (phone.error) {
        return phone;
    }

    const rawAddress = hasOwnProperty(details, 'address')
        ? details.address
        : user.address;

    const address = normalizeRequiredText(rawAddress, 240);

    const dinerCount = hasOwnProperty(details, 'dinerCount')
        ? normalizeDinerCount(details.dinerCount)
        : 1;

    if (!dinerCount) {
        return {
            error:
                'deliveryDetails.dinerCount must be a whole number between 1 and 99'
        };
    }

    const notes = normalizeNotes(details.notes);

    if (notes === null) {
        return {
            error:
                'deliveryDetails.notes must be a string up to 500 characters'
        };
    }

    const location = resolveDeliveryLocation(details, user);

    if (location.error) {
        return location;
    }

    if (!address && !location.value) {
        return {
            error:
                'deliveryDetails.address must be a non-empty string up to 240 characters when no deliveryDetails.location is provided'
        };
    }

    return {
        value: {
            recipientName: recipientName.value,
            phone: phone.value,
            address: address || '',
            dinerCount,
            notes,
            location: location.value
        }
    };
}

async function resolveUser(userId) {
    return userRepository.findById(userId);
}

function isValidItem(item) {
    if (!item || !item.productId) {
        return false;
    }

    return normalizeQuantity(item.quantity) !== null;
}

function requireUserId(req, res) {
    const userId = req.user && req.user.sub;

    if (!userId) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authenticated user'
        });

        return null;
    }

    return userId;
}

async function createItemSnapshots(restaurantId, items) {
    const snapshots = [];

    for (const item of items) {
        const product = await productRepository.findById(
            restaurantId,
            item.productId
        );

        const quantity = normalizeQuantity(item.quantity);
        const price = product ? Number(product.price) : NaN;

        if (
            !product ||
            quantity === null ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            snapshots.push(null);
            continue;
        }

        snapshots.push({
            productId: String(product.id),
            productName: product.name || 'Menu item',
            quantity,
            price
        });
    }

    return snapshots;
}

async function createOrder(req, res) {
    const userId = requireUserId(req, res);

    if (!userId) {
        return;
    }

    if (!isPlainObject(req.body)) {
        return res.status(400).json({
            error: 'Request body must be a JSON object'
        });
    }

    const user = await resolveUser(userId);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    const {
        restaurantId,
        items,
        deliveryDetails
    } = req.body;

    if (!restaurantId) {
        return res.status(400).json({
            error: 'restaurantId is required'
        });
    }

    const restaurant = await restaurantRepository.findById(
        restaurantId
    );

    if (!restaurant) {
        return res.status(404).json({
            error: 'Restaurant not found'
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: 'items must be a non-empty array'
        });
    }

    const invalidItem = items.find((item) => !isValidItem(item));

    if (invalidItem) {
        return res.status(400).json({
            error:
                'Each item must include productId and a positive whole-number quantity'
        });
    }

    const deliverySnapshot = createDeliveryDetailsSnapshot(
        user,
        deliveryDetails
    );

    if (deliverySnapshot.error) {
        return res.status(400).json({
            error: deliverySnapshot.error
        });
    }

    const itemSnapshots = await createItemSnapshots(
        restaurantId,
        items
    );

    if (itemSnapshots.some((item) => item === null)) {
        return res.status(400).json({
            error:
                'Each item must reference an existing product in the selected restaurant'
        });
    }

    const order = await orderRepository.create({
        userId,
        restaurantId,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image || '',
        items: itemSnapshots,
        deliveryDetails: deliverySnapshot.value
    });

    return res
        .status(201)
        .location(`/api/orders/${order.id}`)
        .json(order.toResponseObject());
}

async function getUserOrders(req, res) {
    const userId = requireUserId(req, res);

    if (!userId) {
        return;
    }

    const orders = await orderRepository.findByUserId(userId);

    return res
        .status(200)
        .json(orders.map((order) => order.toResponseObject()));
}

async function getOrderById(req, res) {
    const userId = requireUserId(req, res);

    if (!userId) {
        return;
    }

    const order = await orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({
            error: 'Order not found'
        });
    }

    return res.status(200).json(order.toResponseObject());
}

async function updateOrder(req, res) {
    const userId = requireUserId(req, res);

    if (!userId) {
        return;
    }

    const order = await orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({
            error: 'Order not found'
        });
    }

    const {
        status,
        items,
        deliveryDetails
    } = req.body || {};

    if (deliveryDetails !== undefined) {
        return res.status(400).json({
            error:
                'deliveryDetails are captured when an order is created and cannot be changed later'
        });
    }

    if (status === undefined && items === undefined) {
        return res.status(400).json({
            error: 'Nothing to update. Provide status and/or items'
        });
    }

    const updates = {};

    if (status !== undefined) {
        const allowedStatuses = [
            'created',
            'confirmed',
            'preparing',
            'delivered',
            'cancelled'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error:
                    'Invalid status. Allowed values: ' +
                    allowedStatuses.join(', ')
            });
        }

        updates.status = status;
    }

    if (items !== undefined) {
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'items must be a non-empty array'
            });
        }

        const invalidItem = items.find((item) => !isValidItem(item));

        if (invalidItem) {
            return res.status(400).json({
                error:
                    'Each item must include productId and a positive whole-number quantity'
            });
        }

        const itemSnapshots = await createItemSnapshots(
            order.restaurantId,
            items
        );

        if (itemSnapshots.some((item) => item === null)) {
            return res.status(400).json({
                error:
                    'Each item must reference an existing product in the selected restaurant'
            });
        }

        updates.items = itemSnapshots;
        updates.totalPrice = itemSnapshots.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    await orderRepository.update(order.id, updates);

    return res.status(204).send();
}

async function deleteOrder(req, res) {
    const userId = requireUserId(req, res);

    if (!userId) {
        return;
    }

    const order = await orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({
            error: 'Order not found'
        });
    }

    await orderRepository.delete(order.id);

    return res.status(204).send();
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrder,
    deleteOrder
};
