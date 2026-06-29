const AdminAuditLog = require('../models/AdminAuditLog');
const { generateId } = require('../utilities/idGenerator');

class AdminAuditLogRepository {
    async create(entry) {
        return AdminAuditLog.create({
            ...entry,
            id: generateId()
        });
    }
}

module.exports = new AdminAuditLogRepository();
