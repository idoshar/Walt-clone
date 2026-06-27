const User = require('../models/User');
const { generateId } = require('../utilities/idGenerator');

const ADMIN_FIELDS = [
    'INITIAL_ADMIN_USERNAME',
    'INITIAL_ADMIN_PASSWORD',
    'INITIAL_ADMIN_FULL_NAME',
    'INITIAL_ADMIN_PHONE',
    'INITIAL_ADMIN_ADDRESS'
];

function getTrimmedEnvironmentValue(name) {
    const value = process.env[name];

    return typeof value === 'string' ? value.trim() : '';
}

function getInitialAdminConfiguration() {
    const values = Object.fromEntries(
        ADMIN_FIELDS.map((field) => [
            field,
            getTrimmedEnvironmentValue(field)
        ])
    );

    const configuredFields = ADMIN_FIELDS.filter(
        (field) => values[field] !== ''
    );

    if (configuredFields.length === 0) {
        return null;
    }

    if (configuredFields.length !== ADMIN_FIELDS.length) {
        const missingFields = ADMIN_FIELDS.filter(
            (field) => values[field] === ''
        );

        throw new Error(
            `Initial admin bootstrap is incomplete. Missing: ${missingFields.join(', ')}`
        );
    }

    return {
        username: values.INITIAL_ADMIN_USERNAME,
        password: values.INITIAL_ADMIN_PASSWORD,
        fullName: values.INITIAL_ADMIN_FULL_NAME,
        phone: values.INITIAL_ADMIN_PHONE,
        address: values.INITIAL_ADMIN_ADDRESS
    };
}

async function seedInitialAdmin() {
    const admin = getInitialAdminConfiguration();

    if (!admin) {
        console.log(
            'Initial admin bootstrap skipped: no INITIAL_ADMIN_* variables configured'
        );
        return;
    }

    const result = await User.updateOne(
        { username: admin.username },
        {
            $setOnInsert: {
                id: generateId('admin'),
                ...admin,
                image: '',
                role: 'admin',
                latitude: null,
                longitude: null
            }
        },
        {
            upsert: true,
            runValidators: true
        }
    );

    if (result.upsertedCount > 0) {
        console.log(`Initial admin created: ${admin.username}`);
        return;
    }

    console.log(
        `Initial admin already exists and was not modified: ${admin.username}`
    );
}

module.exports = {
    seedInitialAdmin
};