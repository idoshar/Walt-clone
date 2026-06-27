# SCRUM-388 Mobile Restaurant Details and Dynamic Menu

## Goal

Allow mobile users to open a restaurant, view its details, and browse its dynamic menu.

## Implementation

- Added `GET /restaurants/:id` support in the mobile restaurant API module.
- Added `GET /restaurants/:id/products` support in the mobile restaurant API module.
- Added a RestaurantDetails screen and registered its navigation route.
- Made restaurant cards on Home open the selected restaurant details screen.
- Displayed restaurant name, cuisine, description, address, phone number, and image or fallback initial.
- Displayed dynamic products with names, descriptions, categories, and prices.
- Added dynamic product-category filters.
- Added Refresh, pull-to-refresh, loading, empty-list, error, and retry states.

## Verification completed

- Confirmed selecting Pizza Roma, Burger House, and Sushi Bar opens their restaurant details screens.
- Confirmed restaurant details and menu products load from the backend API.
- Confirmed menu category filters show the matching products.
- Confirmed Refresh and pull-to-refresh reload restaurant data.
- Confirmed Back returns to the Home screen.
