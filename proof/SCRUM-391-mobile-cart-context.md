# SCRUM-391 Mobile Cart Context and Cart Screen

## Goal

Provide a persistent mobile cart with quantity management, item removal, total-price calculation, and a dedicated cart screen.

## Implementation

- Added a shared `CartContext` and `CartProvider`.
- Stored cart items locally with AsyncStorage under `@wolt_delivery_cart`.
- Used a combined restaurant and product key so the same product is updated instead of duplicated.
- Added products to the cart directly from the Restaurant Details screen.
- Added a live `Cart (N)` button that shows the current item quantity.
- Added a Cart screen with quantity increase, quantity decrease, item removal, full-cart clearing, item totals, and overall total-price calculation.
- Added empty-cart and checkout-placeholder states.
- Registered the Cart route in the mobile navigator.
- Kept ThemeProvider, AuthProvider, and CartProvider active together.
- Updated Restaurant Details and Cart to support the shared Light/Dark theme and include Theme Toggle controls.

## Verification completed

- Confirmed adding the same product increases its quantity.
- Confirmed products from multiple restaurants can be kept in the cart.
- Confirmed item totals and the overall total update correctly.
- Confirmed +, −, Remove, and Clear work correctly.
- Confirmed Restaurant Details and Cart work in both Light and Dark modes.
- Confirmed theme changes are reflected across Home, Restaurant Details, and Cart.
- Confirmed `npx expo-doctor` passed 18/18 checks.
- Confirmed `npx expo export --platform web` completed successfully.
