function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);

    if (prefix) {
        return `${prefix}-${timestamp}-${randomPart}`;
    }

    return `${timestamp}-${randomPart}`;
}

module.exports = {
    generateId
};