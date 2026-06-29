function toUserId(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

function getRequestUserId(req) {
    return toUserId(req?.user?.sub || req?.user?.id);
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

function canManageRestaurant(restaurant, userId) {
    return (
        isRestaurantOwner(restaurant, userId) ||
        isRestaurantEditor(restaurant, userId)
    );
}

function getRestaurantAccessRole(restaurant, userId) {
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
    getEditorIds,
    normalizeEditorIds,
    isRestaurantOwner,
    isRestaurantEditor,
    canManageRestaurant,
    getRestaurantAccessRole
};