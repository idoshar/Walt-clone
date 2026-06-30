# Web–Mobile Feature Parity Matrix

## Delivery rule

A Web–Mobile feature is considered complete only when all of the following are true:

1. The behavior is available in both Web and Native clients, unless the feature is platform-specific by design.
2. Both clients use the same server contract and preserve the same authorization and validation rules.
3. Loading, empty, validation-error, API-error, and success states are handled.
4. The flow is verified manually in both clients.
5. Relevant API regressions and client builds pass.
6. The final implementation is documented in a proof file and reviewed through a pull request.

## Status legend

- **Merged** — available on `main`.
- **In review** — implemented in a pull request awaiting review.
- **Branch verified** — implemented and verified on the current branch; not merged yet.
- **In progress** — being implemented on the current branch.
- **Gap** — supported on one client but not yet on the other.
- **Not applicable** — intentionally platform-specific.

## Current parity baseline

| Feature area | Web | Native baseline | Current status | Jira |
|---|---|---|---|---|
| Basic cart and checkout | Available | Available | Merged | Existing |
| Delivery recipient, phone, address, diner count, notes | Available | Available | Branch verified | SCRUM-526 / SCRUM-527 / SCRUM-528 |
| Manual address or current-location delivery | Available | Available | Branch verified | SCRUM-529 |
| Delivery details in order history | Available | Available | Branch verified | SCRUM-530 |
| Reorder using current products and prices | Available | Available | Branch verified | SCRUM-531 |
| Checkout and order-history verification | Available | Available | Branch verified | SCRUM-532 |
| Menu category management | Available | Implemented; awaiting review | In review | SCRUM-533 |
| Restaurant analytics | Available | Implemented; awaiting review | In review | SCRUM-533 |
| Admin password recovery | Available | Implemented; awaiting review | In review | SCRUM-541 / SCRUM-563 |

## SCRUM-526 verification checklist

- [x] Native order API sends `deliveryDetails`.
- [x] Checkout validates recipient, phone, manual address, diner count, and notes.
- [x] Checkout supports either a manual address or a successfully retrieved current location.
- [x] A failed or denied location request keeps manual-address delivery available.
- [x] Created orders preserve an immutable delivery-details snapshot.
- [x] Native order details display the saved delivery snapshot without exposing coordinates.
- [x] Native reorder resolves current products and current prices.
- [x] Unavailable products are reported safely during reorder without changing the cart.
- [x] Checkout, order history, and reorder behavior are verified manually.
- [x] API regressions, Web build, Native export, syntax checks, and whitespace checks pass.