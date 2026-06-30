# SCRUM-417 Server-Side Order Pricing

## Goal

Ensure that order prices and totals are calculated from trusted product data on
the server rather than from prices submitted by a web or mobile client.

## Implementation

- Order requests now require only `productId` and a positive whole-number
  `quantity` for each item.
- The server ignores any client-provided `price` value.
- For every order item, the server loads the product by both restaurant ID and
  product ID.
- Saved order snapshots use the product name and price stored in MongoDB.
- Order totals are calculated from the server-side snapshots.
- Updating order items also rebuilds the snapshots and recalculates totals
  from the current server-side product prices.
- A product belonging to another restaurant cannot be included in the order.

## Verification

- Ran `node --check web-server/src/controllers/orderController.js`.
- Ran `git diff --check`.
- Built and started the Docker-based application with:
  `docker compose up -d --build web-server`.
- Created a temporary authenticated test user.
- Sent an order request for `pizza-margherita` from restaurant `1` with:
  - quantity: `2`
  - client-provided price: `0`
- Confirmed the server saved:
  - product price: `52`
  - total price: `104`
- Deleted the test order after verification.
