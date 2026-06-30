# SCRUM-443 Restaurant Menu Category Data Model and API

## Goal

Add persistent restaurant-specific menu categories with a controlled menu type
and owner-authorized creation.

## Implementation

- Added the MongoDB `MenuCategory` model with:
  - id;
  - restaurantId;
  - name;
  - normalizedName;
  - menuType.
- Added supported menu types:
  - main;
  - side;
  - dessert;
  - drink;
  - other.
- Added a unique index for `restaurantId + normalizedName`.
- Added category repository operations for:
  - listing categories by restaurant;
  - finding a category by normalized name;
  - saving a category;
  - removing all categories for a deleted restaurant.
- Added public endpoint:
  - `GET /api/restaurants/:id/menu-categories`
- Added owner-protected endpoint:
  - `POST /api/restaurants/:id/menu-categories`
- Added input normalization:
  - trims category names;
  - collapses repeated whitespace;
  - lowercases and trims menuType values.
- Added duplicate category-name protection per restaurant.
- Added menu-category cleanup when a restaurant is deleted.

## Verification

Ran the application through Docker Compose and performed an end-to-end API test
with fresh users and a fresh restaurant.

Verified:

- A new restaurant starts with zero categories.
- Public GET returns HTTP 200.
- An owner can create categories.
- `  Main   Dishes  ` is stored as `Main Dishes`.
- ` MAIN ` is stored as `main`.
- Two created categories are returned by GET.
- A duplicate normalized category name returns HTTP 400.
- An invalid menuType returns HTTP 400.
- A non-owner cannot create a category and receives HTTP 403.
- An unauthenticated request cannot create a category and receives HTTP 401.
- A missing restaurant returns HTTP 404.

## Result

The restaurant menu-category persistence and API layer is ready for product
integration and the owner management UI.
