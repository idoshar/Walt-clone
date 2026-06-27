# SCRUM-392 Mobile Checkout Flow

## Goal

Allow a signed-in mobile user to review and submit a restaurant order from the cart.

## Implementation

- Added a persistent Cart indicator in Home that displays the current item count and opens the Cart screen.
- Grouped cart products by restaurant because the orders API accepts one restaurant per order.
- Added a dedicated Checkout button and Checkout flow for each restaurant group.
- Added `POST /orders` mobile API support with authenticated requests.
- Added a Checkout screen with restaurant-specific order summary, quantities, item prices, subtotal, total price, loading state, and error state.
- Added a success state after a completed order.
- Added navigation options from the success screen back to Cart or directly to Home.
- Reset navigation after a successful order so returning from Cart does not reopen the success screen.
- Added `clearRestaurantItems` so only the ordered restaurant's products are removed after a successful checkout.
- Preserved products from other restaurants in the cart.
- Replaced the broken location symbol in Home with a location pin.
- Preserved Light and Dark theme support across Home, Cart, and Checkout.

## Manual verification completed

- Confirmed the Home screen displays a Cart indicator with the current item count.
- Confirmed the Cart indicator updates after adding products.
- Confirmed the Cart indicator opens the Cart screen.
- Confirmed the Cart groups products by restaurant and displays a separate Checkout button for each restaurant.
- Confirmed Checkout displays only the selected restaurant's items and totals.
- Confirmed a successful order shows a success state with the restaurant name.
- Confirmed ordered items are removed while items from another restaurant remain in the cart.
- Confirmed Back to Cart does not leave the success screen in the navigation history.
- Confirmed Back to Home returns directly to Home.
- Confirmed the location area displays a location pin without corrupted text.
- Confirmed the flow works in the mobile application.

## Build verification

- `npx expo-doctor`
- `npx expo export --platform web`
