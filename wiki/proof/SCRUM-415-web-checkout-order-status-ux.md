# SCRUM-415 Web Checkout and Order Status UX

## Goal

Improve the web checkout and order-status experience by preventing duplicate
order submissions, giving clear feedback while an order is being sent, and
providing useful recovery actions after a successful or failed order.

## Implementation

- Added an `isSubmitting` state to the checkout flow.
- Added a synchronous `submittingRef` guard so repeated fast clicks cannot
  submit duplicate orders before React finishes updating the button state.
- The Confirm button changes to `Placing order...` and becomes disabled while
  the request is pending.
- The Cancel button is also disabled while an order is being submitted.
- The restaurant cart is cleared only after a successful order.
- A failed order keeps the cart contents and provides a Return to Checkout
  action for the same restaurant.
- Improved success and failure order-status pages with clear navigation actions.
- Replaced CheckoutPage and OrderStatusPage inline style objects with reusable
  CSS classes.
- Added responsive styling compatible with light and dark themes.

## Verification

- `git diff --check` passed without whitespace errors.
- Ran `npm ci` successfully.
- Ran `npm run build` successfully.
- Built and ran the application using:
  `docker compose up -d --build web-server`
- Confirmed MongoDB was healthy and the web server connected successfully.
- Confirmed the Food Delivery API started on port 3000.
- Manually tested the website:
  - successful order flow;
  - success page with Order ID and navigation actions;
  - My Orders showing the created order;
  - failed order flow;
  - returning to checkout while preserving cart contents;
  - prevention of duplicate order submission;
  - checkout and order-status UI in the Docker-based application.
