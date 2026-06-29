# SCRUM-431 Multi-Currency Verification

## Scope

Implemented display-only multi-currency support across the web client and React Native application.

Base product and order values remain in ILS. Currency conversion is used only for customer-facing price display.

## Supported display currencies

- ILS
- USD
- EUR
- GBP

## Backend verification

- Added `GET /api/currency/rates`.
- Confirmed the endpoint returns `ILS` as the base currency.
- Confirmed live exchange-rate records are returned for USD, EUR, and GBP.
- Confirmed repeated requests return the in-memory cached response.
- Confirmed the API health endpoint returns `status: ok`.
- Confirmed the currency service, controller, routes, and route registration pass `node --check`.

## Web verification

- Production build completed with `npm --prefix .\client run build`.
- Currency selector appears in the header.
- Selector labels use country flags and currency symbols.
- Currency selection persists after page refresh.
- Product cards, cart dropdown, checkout, order history, restaurant management product prices, and restaurant statistics use the selected display currency.
- Order creation continues to use original ILS values.

## Mobile verification

- Android Expo export completed successfully.
- Currency selector appears on the home screen and restaurant-details screen.
- Currency selection persists through AsyncStorage.
- Restaurant menus, search results, cart, checkout, order details, order history, and restaurant product lists use the selected display currency.
- Search correctly uses the global selected currency without requiring a duplicate selector on the search screen.
- Product price inputs remain ILS-based because they are persisted to the server.

## Regression checks

- Web Docker image rebuilt successfully.
- Home, restaurant browsing, cart, checkout, search, orders, management, and mobile customer flows were manually checked.
- Legacy hard-coded customer price-formatting patterns were removed from the web and mobile source trees.
