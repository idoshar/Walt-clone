# SCRUM-446 Public Menu Category Filtering

## Goal

Allow customers to browse a restaurant menu by its real restaurant-owned menu
categories.

## Implementation

- Added menu-category loading to the public restaurant page.
- Added an `All` filter as the default public-menu view.
- Added one filter button for every category that belongs to the restaurant.
- Product filtering uses `categoryId`, not the category display name.
- Changing a category filter clears the currently selected product and its
  recommendation state.
- Added an empty state for a selected category that does not currently contain
  any products.
- Kept the checkout action available even when the active category filter has
  no matching products.
- Existing restaurants without categories continue to display their products
  normally without category-filter controls.

## Verification

### Build verification

Ran:

`npm --prefix .\client run build`

Result:

- Vite production build completed successfully.

### Browser verification

Verified the public restaurant-menu flow in the running Docker application:

- The public restaurant page displays an `All` category filter by default.
- Restaurant categories appear as filter buttons.
- Selecting a category displays only products with the matching `categoryId`.
- Selecting `All` restores all available products.
- The selected category is visually highlighted.
- Category filters remain readable in the restaurant menu layout.
- Product selection and recommendation loading remain available after
  category filtering.

## Result

Customers can now browse restaurant menus by the categories created and
maintained by each restaurant owner.