const Restaurant = require('../models/Restaurant');

const INITIAL_SPONSORED_RESTAURANTS = [
    { id: '1', sponsoredRank: 1 },
    { id: '2', sponsoredRank: 2 },
    { id: '3', sponsoredRank: 3 }
];

async function backfillRestaurantSponsorship() {
    const initialResults = await Promise.all(
        INITIAL_SPONSORED_RESTAURANTS.map(({ id, sponsoredRank }) =>
            Restaurant.updateOne(
                {
                    id,
                    isSponsored: { $exists: false }
                },
                {
                    $set: {
                        isSponsored: true,
                        sponsoredRank
                    }
                }
            )
        )
    );

    const disabledLegacyRestaurants = await Restaurant.updateMany(
        {
            isSponsored: { $exists: false }
        },
        {
            $set: {
                isSponsored: false,
                sponsoredRank: null
            }
        }
    );

    const missingRankRestaurants = await Restaurant.updateMany(
        {
            sponsoredRank: { $exists: false }
        },
        {
            $set: {
                sponsoredRank: null
            }
        }
    );

    const changedInitialRestaurants = initialResults.reduce(
        (count, result) => count + result.modifiedCount,
        0
    );

    const changedCount =
        changedInitialRestaurants +
        disabledLegacyRestaurants.modifiedCount +
        missingRankRestaurants.modifiedCount;

    if (changedCount > 0) {
        console.log(
            `Restaurant sponsorship migration updated ${changedCount} restaurant record(s)`
        );
    }
}

module.exports = {
    backfillRestaurantSponsorship
};
