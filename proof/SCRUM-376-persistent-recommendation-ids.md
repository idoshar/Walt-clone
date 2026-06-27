# SCRUM-376 Persistent Numeric Recommendation IDs

## Problem addressed

The Exercise 2 recommendation service requires positive numeric user and product IDs.

Previously:
- Product recommendation IDs were assigned only in in-memory Maps.
- The product ID counter restarted from 1 whenever the Node.js server restarted.
- User IDs were generated as strings and were not suitable for direct use by the recommendation service.

## Implementation

- Added a MongoDB-backed `Counter` model for atomic numeric sequences.
- Added a persistent numeric `recommendationId` field for users.
- Made product `recommendationId` required, unique, and persistent in MongoDB.
- Migrated the product repository from in-memory Maps to MongoDB.
- Moved demo products to an idempotent MongoDB seed.
- Added startup backfill for existing users and products missing recommendation IDs.
- Updated the recommendation bridge to resolve the authenticated user and use `user.recommendationId` when communicating with Exercise 2.
- Updated product, restaurant, and search controllers for asynchronous MongoDB product operations.

## Verification

### Product IDs
- Nine demo products were persisted in MongoDB.
- Product recommendation IDs were assigned sequentially from 1 through 9.
- The `productRecommendationId` counter reached 9.

### User IDs
- A user created through `POST /api/users` received a persistent numeric `recommendationId` of 1.
- The `userRecommendationId` counter reached 1.

### Restart persistence
- Restarted only the `web-server` container.
- Verified that the same user still had `recommendationId: 1`.
- Verified that all product recommendation IDs remained 1 through 9.
- Verified that both counters retained their values.

### API regression checks
- `GET /api/restaurants` returned all default restaurants.
- `GET /api/restaurants/1/products` returned the persisted menu with recommendation IDs.
- `GET /api/search/pizza` returned the expected restaurant and product.
- An authenticated recommendation request completed successfully without invalid-ID or connection errors.
