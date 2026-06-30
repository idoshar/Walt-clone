# System Architecture

This page describes the system components, how they communicate, and the folder structure.

---

## High-Level Diagram

```
┌───────────────────┐           ┌───────────────────┐
│    Web Client     │           │   Mobile Client   │
│  (React + Vite)   │           │ (React Native /   │
│                   │           │  Expo)             │
└────────┬──────────┘           └────────┬──────────┘
         │  HTTP / JSON                  │  HTTP / JSON
         │                               │
         └──────────────┬────────────────┘
                        │
               ┌────────▼──────────┐
               │    API Server     │
               │ (Node.js/Express) │
               │   MVC + REST      │
               └───┬───────────┬───┘
                   │           │
         Mongoose  │           │  TCP (text protocol)
                   │           │
          ┌────────▼────┐  ┌───▼────────────────┐
          │   MongoDB   │  │  Recommendation    │
          │  (persist)  │  │  Server (C++ TCP)  │
          └─────────────┘  └────────────────────┘
```

All backend services run inside Docker containers and are orchestrated by `docker-compose.yml`. The mobile app runs outside Docker on a physical phone via Expo Go, connecting to the API over the local WiFi network.

---

## Component Details

### Web Client (React + Vite)

The browser-facing single-page application. It provides the full feature set: registration, login, restaurant browsing with carousels and sponsored promotions, search, cart with recommendations, checkout with delivery details, order history with reorder, restaurant and menu management, category management, profile editing, password change, forgot-password flow, currency switching, and dark/light mode. Served as static files by the web-server container.

Key pages: `HomePage`, `RestaurantPage`, `SearchPage`, `CheckoutPage`, `OrdersPage`, `OrderStatusPage`, `RestaurantManagementPage`, `AdminPage`, `ProfilePage`, `ChangePasswordPage`, `ForgotPasswordPage`.

### Mobile Client (React Native / Expo)

The phone-facing application with native navigation, gesture support, and platform-appropriate UX. It mirrors the web client's features adapted for mobile: pull-to-refresh, native alerts for confirmations, camera/gallery for profile images, bottom sheets, and swipe actions. Connects to the same API using the computer's LAN IP address.

Key screens (27 total): `HomeScreen`, `SearchScreen`, `RestaurantDetailsScreen`, `CartScreen`, `CheckoutScreen`, `OrdersScreen`, `OrderDetailsScreen`, `MyRestaurantsScreen`, `RestaurantFormScreen`, `RestaurantProductsScreen`, `ProductFormScreen`, `MenuCategoryManagementScreen`, `RestaurantAccessScreen`, `RestaurantSalesStatisticsScreen`, `AdminScreen`, `AdminStatisticsScreen`, `AdminUserManagementScreen`, `AdminRestaurantManagementScreen`, `AdminSponsoredPromotionsScreen`, `AdminPasswordResetRequestsScreen`, `ProfileScreen`, `ChangePasswordScreen`, `ForgotPasswordScreen`, `LoginScreen`, `RegisterScreen`, and more.

### API Server (Node.js + Express)

The central backend implementing a REST API with an MVC-style architecture:

- **Routes** map URLs to controllers (`restaurantRoutes`, `productRoutes`, `orderRoutes`, `adminRoutes`, `menuCategoryRoutes`).
- **Controllers** validate requests and build responses.
- **Services** hold business logic (authentication, sequence generation, recommendation bridging, currency conversion).
- **Repositories** abstract MongoDB access through Mongoose models.
- **Middleware** handles JWT authentication, admin authorization, async error wrapping, and centralized error responses (including Mongoose validation, duplicate-key, and cast errors).

The server also bridges to the C++ recommendation server via TCP and seeds default data (restaurants, products, admin user, images) on startup.

### Recommendation Server (C++ TCP)

A standalone collaborative-filtering engine from Exercise 2. The API communicates with it over a line-delimited text protocol:

| Command | Example | Effect |
|---|---|---|
| `POST userId productId...` | `POST 1 101 102` | Record a new user's product views |
| `PATCH userId productId...` | `PATCH 1 103` | Record an additional view for an existing user |
| `GET userId productId` | `GET 1 101` | Get recommended product IDs based on collaborative filtering |
| `DELETE userId productId...` | `DELETE 1 101` | Remove product views |

When a user views or adds a product, the API reports the view. When recommendations are requested, the API queries this server and maps returned IDs back to real products from MongoDB. If the engine has no data yet, the app falls back to category-based recommendations.

### Database (MongoDB 7.0)

Stores all application data: users, restaurants, products, orders, menu categories, sequence counters, sponsored promotions, and password reset requests. Accessed through Mongoose models. Data persists across container restarts via a Docker volume (`mongo-data`).

---

## Folder Structure

```
targil-5/
├── src/                        # C++ recommendation server source
├── tests/                      # C++ Google Test unit tests
├── web-server/                 # Node.js API server
│   └── src/
│       ├── config/             # Database connection
│       ├── controllers/        # Request handlers
│       ├── middleware/         # Auth, admin, error handling
│       ├── models/            # Mongoose schemas
│       ├── repositories/      # Data access layer
│       ├── routes/            # URL → controller mapping
│       ├── seed/              # Default data + image seeding
│       ├── services/          # Business logic (auth, TCP client, currency)
│       └── utilities/         # Helpers
├── client/                     # React web client (Vite)
│   └── src/
│       ├── components/        # Reusable UI (29 components)
│       ├── pages/             # Route pages (14 pages)
│       ├── api/               # API client functions
│       ├── auth/              # Auth context + hooks
│       ├── cart/              # Cart context
│       ├── currency/          # Currency context
│       └── css/               # Stylesheets
├── mobile/                     # React Native (Expo) app
│   └── src/
│       ├── api/               # API client functions
│       ├── auth/              # Auth context
│       ├── cart/              # Cart context
│       ├── components/        # Reusable components
│       ├── currency/          # Currency context
│       ├── location/          # Geolocation helpers
│       ├── navigation/        # React Navigation setup
│       ├── screens/           # App screens (27 screens)
│       ├── theme/             # Theming (dark/light)
│       └── utils/             # Helpers
├── proof/                      # Verification documents for completed SCRUMs
├── wiki/                       # This documentation
├── docker-compose.yml          # Orchestrates all backend services
├── Dockerfile                  # C++ server build
└── Dockerfile.webserver        # Node.js + React client build
```