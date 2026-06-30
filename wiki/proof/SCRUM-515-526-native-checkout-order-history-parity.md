# SCRUM-515 / SCRUM-526 Native Checkout and Order-History Parity

## Goal

Bring the Native checkout and previous-order experience to parity with the Web
application for delivery details, current-location delivery, saved delivery
snapshots, and safe reorder behavior.

## Implementation

- Added and maintained the Web–Mobile parity matrix in
  `docs/web-mobile-parity-matrix.md`.
- Extended the Native order API so checkout can submit `deliveryDetails`.
- Updated the order contract so delivery uses exactly one of these methods:
  - a non-empty manual address; or
  - valid shared device coordinates with an empty address snapshot.
- Preserved profile defaults for older clients that do not send
  `deliveryDetails`.
- Kept an explicit `location: null` path for manual-address checkout so a
  profile location is not attached unintentionally.
- Updated both Web and Native checkout screens:
  - manual address is the initial mode;
  - `Use my current location` requests location only after user action;
  - successful location retrieval hides the address field;
  - `Enter address manually` restores the address field and removes shared
    coordinates;
  - location permission denial or retrieval failure leaves manual checkout
    usable.
- Added a Native Delivery details card to order details:
  - recipient;
  - phone;
  - manual address or a privacy-safe Current device location summary;
  - diner count;
  - optional notes.
- Added Native reorder support:
  - reloads current restaurant products;
  - matches previous order items by `productId`;
  - uses current product prices;
  - replaces only that restaurant's cart contents;
  - preserves items from other restaurants;
  - stops safely with an alert when an historical product is unavailable.

## Automated verification

The following checks passed:

- `node .\tests\scrum-323-create-order.test.js`
  - 10 passed, 0 failed.
- `node .\tests\scrum-324-previous-orders.test.js`
  - 7 passed, 0 failed.
- `node .\tests\scrum-437-delivery-details.test.js`
  - 9 passed, 0 failed.
  - Covers current-location delivery with `address: ''`.
  - Covers rejection of a blank address without a valid location.
- `node .\tests\scrum-440-order-history-details.test.js`
  - 4 passed, 0 failed.
- `node .\tests\scrum-325-management.test.js`
  - 18 passed, 0 failed.
- `node .\tests\scrum-404-backend.test.js`
  - 12 passed, 0 failed.
- `npm --prefix .\client run build`
- `npx expo export --platform web`
- `node --check .\web-server\src\controllers\orderController.js`
- `node --check .\web-server\src\models\Order.js`
- `git diff --check`

## Manual verification completed

### Web checkout

- Verified manual-address checkout.
- Verified validation when neither address nor current location is available.
- Verified successful current-location checkout hides the manual address field.
- Verified switching back to manual address restores the address field and
  removes the shared location.

### Native checkout and order history

- Verified the same manual-address and current-location modes in the Native
  application.
- Verified orders created with a manual address display the Manual address
  delivery snapshot.
- Verified orders created with current location display Current location
  without exposing saved coordinates.
- Verified older orders without delivery details remain safe to view.

### Native reorder

- Verified an existing order with available products rebuilds the matching
  restaurant cart and uses current prices before checkout.
- Verified a temporary product was ordered, deleted, and then used to test
  reorder failure.
- Verified reorder reports that the deleted product is unavailable.
- Verified unavailable-product reorder does not navigate to Cart and does not
  change the existing cart.

## Result

Web and Native delivery checkout, saved delivery snapshots, and reorder behavior
are aligned on this branch. The delivery workflow supports either manual address
or explicit current-location delivery while preserving validation, privacy, and
current-price safeguards.
