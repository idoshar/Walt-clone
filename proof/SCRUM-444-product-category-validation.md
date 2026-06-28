# SCRUM-444 Product Category Validation

## Goal

Make each newly created or re-categorized product reference a real menu category
that belongs to the same restaurant.

## Implementation

- Added `categoryId` to the Product model and product response objects.
- Added a product index for `restaurantId + categoryId`.
- Added repository support for reading products with `categoryId`.
- Added `findById(restaurantId, categoryId)` to the menu-category repository.
- Product creation now requires `categoryId`.
- Product creation verifies that the referenced category exists in the selected
  restaurant.
- The server derives the product `category` display name from the trusted
  MenuCategory record instead of accepting a client-supplied category name.
- Product updates can change category only through `categoryId`.
- Free-text updates containing only `category` are rejected.
- Product updates verify that the replacement category belongs to the same
  restaurant.
- Existing products without `categoryId` remain readable for backwards
  compatibility.
- Updated the SCRUM-325 management regression test to create a real menu
  category before creating a product.

## Verification

### Regression

Ran:

`node .\tests\scrum-325-management.test.js`

Result:

- 18 passed.
- 0 failed.

### Product category validation

Using fresh test users and two owner-managed restaurants, verified:

- A product created with a valid same-restaurant `categoryId` stored the
  trusted category ID and category name.
- A client-supplied fake `category` value was ignored.
- Creating a product without `categoryId` returned HTTP 400.
- Creating a product using a category from another restaurant returned HTTP 400.
- Updating only the free-text `category` field returned HTTP 400.
- Updating `categoryId` to another category in the same restaurant returned
  HTTP 204 and updated the saved category name.
- Updating `categoryId` to a category from another restaurant returned HTTP 400.

## Result

Products now use restaurant-owned menu categories as their authoritative
category source.
