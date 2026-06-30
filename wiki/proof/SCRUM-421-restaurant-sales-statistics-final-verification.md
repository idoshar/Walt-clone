# SCRUM-421 Restaurant Sales Statistics Final Verification

## Goal

Perform an end-to-end verification of the restaurant sales-statistics feature
before opening the SCRUM-416 pull request.

## Verified Scope

The final verification covered:

- Server-side order price snapshots.
- Owner-only access to restaurant statistics.
- Exclusion of cancelled orders.
- Total-order, total-revenue, and average-order-value calculations.
- Top-product and per-product sales calculations.
- Empty restaurant statistics.
- Historical sales data after a sold product is deleted.
- Unauthenticated and unauthorized access handling.
- Docker-based application startup.

## Final Test Setup

A standalone verification script created fresh data for this test run:

- One restaurant owner.
- One customer.
- One unauthorized user.
- One restaurant with two products:
  - Final Signature Dish, price 40.
  - Final Side Dish, price 25.
- Two active orders:
  - 2 × Final Signature Dish and 1 × Final Side Dish.
  - 1 × Final Signature Dish.
- One cancelled order:
  - 4 × Final Side Dish.
- One additional empty restaurant.

The client submitted price values of 0 in the order requests. The server used
the trusted product prices stored in MongoDB.

## Expected and Verified Results

For the populated restaurant:

- totalOrders: 2
- totalRevenue: 145
- averageOrderValue: 72.5
- topProduct: Final Signature Dish
- Final Signature Dish:
  - ordersContainingProduct: 2
  - quantitySold: 3
  - revenue: 120
- Final Side Dish:
  - ordersContainingProduct: 1
  - quantitySold: 1
  - revenue: 25

Authorization results:

- Restaurant owner: HTTP 200.
- Non-owner: HTTP 403.
- Unauthenticated request: HTTP 401.

Empty restaurant result:

- totalOrders: 0
- totalRevenue: 0
- averageOrderValue: 0
- topProduct: null
- productSales: []

Historical data result:

- The sold Final Side Dish was deleted from the current menu.
- Its saved name, quantity, and revenue remained available through order
  snapshots in the statistics response.

## Additional Verification

- Ran client production build successfully with:
  `npm --prefix .\client run build`
- Built and started the Docker application with:
  `docker compose up -d --build web-server`
- Manually verified the web dashboard in light mode, dark mode, and a narrow
  browser layout.

## Result

SCRUM-416 restaurant sales statistics is ready for pull-request review.
