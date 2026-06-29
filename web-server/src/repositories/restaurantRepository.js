const Restaurant = require('../models/Restaurant');

function toResponseDocument(restaurant) {
    return restaurant;
}

class RestaurantRepository {
    async findAll() {
        return Restaurant.find({}).sort({ createdAt: 1, _id: 1 });
    }

    async getAll() {
        return this.findAll();
    }

    async create(restaurantData) {
        if (restaurantData && typeof restaurantData.save === 'function') {
            return restaurantData.save();
        }

        return Restaurant.create(restaurantData);
    }

    async findById(id) {
        return Restaurant.findOne({ id: String(id) });
    }

    async update(id, updatedFields) {
        const {
            id: _id,
            ownerId: _ownerId,
            isDefault: _isDefault,
            ...safeUpdates
        } = updatedFields;

        return Restaurant.findOneAndUpdate(
            { id: String(id) },
            safeUpdates,
            { new: true, runValidators: true }
        );
    }

    async updateSponsorship(id, sponsorship) {
        return Restaurant.findOneAndUpdate(
            { id: String(id) },
            {
                $set: {
                    isSponsored: sponsorship.isSponsored,
                    sponsoredRank: sponsorship.sponsoredRank
                }
            },
            { new: true, runValidators: true }
        );
    }

    async search(query) {
        const normalizedQuery = String(query || '').trim();

        if (!normalizedQuery) {
            return [];
        }

        return Restaurant.find({
            $or: [
                { name: { $regex: normalizedQuery, $options: 'i' } },
                { description: { $regex: normalizedQuery, $options: 'i' } },
                { cuisine: { $regex: normalizedQuery, $options: 'i' } }
            ]
        }).sort({ createdAt: 1, _id: 1 });
    }

    async deleteById(id) {
        const result = await Restaurant.deleteOne({ id: String(id) });
        return result.deletedCount > 0;
    }
}

module.exports = new RestaurantRepository();