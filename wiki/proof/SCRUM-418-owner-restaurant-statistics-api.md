# SCRUM-418 Owner-Authorized Restaurant Sales Statistics API

## Goal

Add a protected restaurant-sales statistics endpoint for restaurant owners.

The endpoint returns analytics based on saved order snapshots so historical
sales remain available even if a product is later changed or deleted.

## Endpoint

GET /api/restaurants/{restaurantId}/statistics

The endpoint requires authentication and is accessible only to the owner of the
requested restaurant.

## Response Data

- totalOrders
- totalRevenue
- averageOrderValue
- topProduct
- productSales

Each product-sales row includes:

- productId
- productName
- ordersContainingProduct
- quantitySold
- revenue

## Implementation

- Added MongoDB aggregation in the order repository.
- Excluded orders with status `cancelled`.
- Added owner authorization based on `restaurant.ownerId`.
- Added an empty-statistics response for restaurants with no qualifying orders:
  - totalOrders: 0
  - totalRevenue: 0
  - averageOrderValue: 0
  - topProduct: null
  - productSales: []
- Product statistics use order-item snapshots rather than current Product
  documents, preserving historical data after a product is deleted.

## Verification

- Ran syntax checks for:
  - orderRepository.js
  - restaurantStatisticsController.js
  - restaurantRoutes.js
- Ran `git diff --check`.
- Built and started the application with:
  `docker compose up -d --build web-server`.
- Created a restaurant owned by a temporary test user.
- Created two products and placed:
  - two active orders;
  - one cancelled order.
- Confirmed active-order statistics:
  - totalOrders: 2
  - totalRevenue: 145
  - averageOrderValue: 72.5
  - top product quantity sold: 3
- Confirmed cancelled orders were excluded.
- Confirmed a non-owner received HTTP 403.
- Confirmed an empty restaurant returned zero statistics.
- Deleted a sold product and confirmed its historical sales data remained
  available through order snapshots.
