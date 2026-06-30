# SCRUM-447 Custom Menu Category Ordering API

## Goal

Allow restaurant owners to control the display order of their menu categories.

## Implementation

- Added `sortOrder` to the MenuCategory model.
- Added a default category order by menu type:
  - main: 100;
  - side: 200;
  - dessert: 300;
  - drink: 400;
  - other: 500.
- Existing categories without a stored `sortOrder` remain readable and receive
  a fallback order based on their menu type.
- Public category GET responses are sorted by:
  - sortOrder;
  - category name;
  - category ID.
- Added owner-protected endpoint:

  `PATCH /api/restaurants/:id/menu-categories/order`

- The reorder endpoint requires the complete category list exactly once.
- The server rejects:
  - partial category lists;
  - duplicate category IDs;
  - empty IDs;
  - unknown or foreign category IDs;
  - non-owner requests.
- A successful reorder saves sequential sort orders:
  - 10;
  - 20;
  - 30;
  - and so on.

## Verification

Ran the Docker-backed API verification.

Verified:

- Categories created in non-display order were returned in default menu-type
  order: `Burgers -> Sides -> Drinks`.
- Default sort orders were returned as `100 -> 200 -> 400`.
- A custom order of `Drinks -> Burgers -> Sides` was saved successfully.
- The reordered categories returned sort orders `10 -> 20 -> 30`.
- A subsequent public GET preserved the custom order.
- A non-owner reorder request returned HTTP 403.
- A partial order request returned HTTP 400.
- A duplicate-ID order request returned HTTP 400.
- A foreign-category order request returned HTTP 400.

## Result

The backend now persists restaurant-specific category ordering and exposes it
safely for the restaurant-management interface and the public menu.