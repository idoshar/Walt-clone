# SCRUM-419 Web Restaurant Sales Dashboard

## Goal

Provide restaurant owners with a web dashboard that presents their sales
statistics using the protected restaurant statistics API.

## Implementation

- Added `getRestaurantStatistics` to the restaurant API client.
- Added a View Sales Statistics action in Restaurant Management.
- Added a modal dashboard for the selected restaurant.
- Added summary cards for:
  - total non-cancelled orders;
  - total revenue;
  - average order value;
  - most ordered dish.
- Added a sales-by-dish section showing:
  - number of orders containing each dish;
  - quantity sold;
  - revenue;
  - relative sales bar;
  - top-seller badge.
- Added loading, error, and no-sales states.
- Added responsive layout and theme-compatible dashboard styling.

## Verification

- Ran `npm --prefix .\client run build`.
- Ran `docker compose up -d --build web-server`.
- Logged in as the owner of the SCRUM-418 test restaurant.
- Opened Restaurant Management and selected the test restaurant.
- Opened View Sales Statistics.
- Confirmed the dashboard displayed:
  - total orders: 2;
  - total revenue: 145;
  - average order value: 72.5;
  - top product: Analytics Signature Dish.
- Confirmed the deleted Analytics Side Dish remained visible in historical sales
  data because statistics are based on order snapshots.
- Confirmed the dashboard displayed correctly in the browser.
