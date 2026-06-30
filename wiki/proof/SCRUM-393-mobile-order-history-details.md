# SCRUM-393 Mobile Order History and Order Details

## Goal

Allow a signed-in mobile user to view previous orders and inspect the details of each order.

## Implementation

- Added authenticated mobile API support for:
  - `GET /orders`
  - `GET /orders/:id`
- Added a My orders entry point on the Home screen.
- Added an Orders screen with:
  - loading state
  - empty state
  - error state
  - pull-to-refresh support
  - newest orders first
- Added order cards that show:
  - restaurant name
  - order date
  - order status
  - item count
  - total price
  - order id
- Added an Order details screen with:
  - restaurant name
  - status
  - order date
  - order id
  - product names
  - quantities
  - unit prices
  - line totals
  - total order price
- Added refresh support for an individual order status.
- Added MyOrders and OrderDetails routes to the mobile navigator.
- Preserved Light and Dark theme support.

## Manual verification completed

- Confirmed My orders is available from Home.
- Confirmed the orders list loads authenticated user orders.
- Confirmed an account only sees its own order history.
- Confirmed an empty state is displayed when no orders exist.
- Confirmed a newly created Checkout order appears in My orders.
- Confirmed an order card opens its Order details screen.
- Confirmed order details show restaurant, status, date, id, items, quantities, prices, and total.
- Confirmed Refresh order status works.
- Confirmed the flow works in both the Android emulator and a physical phone after signing in with a fresh session.
- Confirmed Light and Dark theme behavior in the order list and order details screens.

## Build verification

- `npx expo-doctor` passed with 18/18 checks.
- `npx expo export --platform web` completed successfully.
