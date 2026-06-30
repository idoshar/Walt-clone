# SCRUM-441 — Checkout Delivery Details Verification

## Scope

This verification covers the checkout delivery-details flow and the related previous-order experience:

- SCRUM-436: delivery details and diner preferences in checkout.
- SCRUM-437: immutable, validated delivery-detail snapshots in orders.
- SCRUM-438: checkout delivery form and diner-count default based on main dishes.
- SCRUM-439: optional current-location sharing with a safe fallback.
- SCRUM-440: previous-order delivery details, restaurant-image snapshots, and reorder flow.
- SCRUM-441: final verification and evidence.

## Automated verification

The following checks were run successfully:

- `npm --prefix .\client run build`
- `node .\tests\scrum-323-create-order.test.js`
- `node .\tests\scrum-324-previous-orders.test.js`
- `node .\tests\scrum-437-delivery-details.test.js`
- `node .\tests\scrum-440-order-history-details.test.js`
- `git diff --check`

Regression coverage confirms:

- Order creation, update, and deletion still work.
- Previous orders remain private to their owner.
- Delivery details are validated and stored as immutable order snapshots.
- Invalid diner counts and partial locations are rejected.
- Restaurant-image snapshots and delivery details are returned in previous-order responses.

## Manual browser verification

Verified in the web application:

- Checkout displays recipient name, phone number, delivery address, diner count, and optional delivery notes.
- Diner count defaults to the quantity of main dishes in the selected order and remains editable.
- Current location is optional and requested only after clicking `Use my current location`.
- A shared location can be removed before placing the order.
- Denied or unavailable location access displays a clear message and does not block checkout.
- Previous Orders displays the restaurant image or a visual fallback for older orders.
- Previous Orders displays saved recipient, phone, address, diner count, notes when present, and a privacy-safe location summary without coordinates.
- Reorder reloads currently available restaurant products at their current prices and restores the saved delivery details for a new checkout.
- Reorder does not restore a historical location automatically; the customer must explicitly share their current location again.
- Reorder stops with a clear message when one or more historical products are no longer available.

## Result

The checkout delivery-details flow, optional location handling, order-history display, and reorder flow were verified successfully.
