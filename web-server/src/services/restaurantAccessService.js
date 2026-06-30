function toUserId(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

function getRequestUserId(req) {
    return toUserId(req?.user?.sub || req?.user?.id);
}

function isAdministrator(userRole) {
    return userRole === 'admin';
}

function getEditorIds(restaurant) {
    const editorIds = Array.isArray(restaurant?.editorIds)
        ? restaurant.editorIds
        : [];

    return [
        ...new Set(editorIds.map(toUserId).filter(Boolean))
    ];
}

function normalizeEditorIds(editorIds, ownerId) {
    const normalizedOwnerId = toUserId(ownerId);
    const values = Array.isArray(editorIds) ? editorIds : [];

    return [
        ...new Set(
            values
                .map(toUserId)
                .filter(
                    (editorId) =>
                        editorId && editorId !== normalizedOwnerId
                )
        )
    ];
}

function isRestaurantOwner(restaurant, userId) {
    const normalizedUserId = toUserId(userId);

    return Boolean(
        normalizedUserId &&
        toUserId(restaurant?.ownerId) === normalizedUserId
    );
}

function isRestaurantEditor(restaurant, userId) {
    const normalizedUserId = toUserId(userId);

    return Boolean(
        normalizedUserId &&
        getEditorIds(restaurant).includes(normalizedUserId)
    );
}

function canManageRestaurant(restaurant, userId, userRole) {
    return (
        isAdministrator(userRole) ||
        isRestaurantOwner(restaurant, userId) ||
        isRestaurantEditor(restaurant, userId)
    );
}

function canManageRestaurantAccess(restaurant, userId, userRole) {
    return (
        isAdministrator(userRole) ||
        isRestaurantOwner(restaurant, userId)
    );
}

function canDeleteRestaurant(restaurant, userId, userRole) {
    return Boolean(
        !restaurant?.isDefault &&
        (isAdministrator(userRole) || isRestaurantOwner(restaurant, userId))
    );
}

function getRestaurantAccessRole(restaurant, userId, userRole) {
    if (isAdministrator(userRole)) {
        return 'admin';
    }

    if (isRestaurantOwner(restaurant, userId)) {
        return 'owner';
    }

    if (isRestaurantEditor(restaurant, userId)) {
        return 'editor';
    }

    return null;
}

module.exports = {
    toUserId,
    getRequestUserId,
    isAdministrator,
    getEditorIds,
    normalizeEditorIds,
    isRestaurantOwner,
    isRestaurantEditor,
    canManageRestaurant,
    canManageRestaurantAccess,
    canDeleteRestaurant,
    getRestaurantAccessRole
};
