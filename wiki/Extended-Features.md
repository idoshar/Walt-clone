# Extended Features

This page documents all features implemented beyond the base requirements, covering both the web client and the mobile app.

---

## 1. Multi-Currency Support

The system supports four currencies: **ILS (₪)**, **USD ($)**, **EUR (€)**, and **GBP (£)**. All prices throughout the application convert in real time based on exchange rates.

- **Web:** Currency selector in the header. Selection persists via localStorage.
- **Mobile:** Currency context applied throughout all screens.
- Prices on menus, cart, checkout, orders, and statistics all reflect the selected currency.

> Verification: `proof/SCRUM-431-multi-currency-verification.md`

---

## 2. Sponsored Restaurant Promotions

The home page features a **sponsored restaurant rail** — a highlighted section at the top showing admin-promoted restaurants.

- Admins manage which restaurants appear and in what order via the Admin workspace.
- When no sponsored restaurants exist, the rail is hidden gracefully.
- Works on both web and mobile.

> Verification: `proof/SCRUM-448-SCRUM-540-sponsored-restaurants-verification.md`

---

## 3. Auto-Rotating Restaurant Carousels

The home page displays auto-rotating carousels of recommended and general restaurants.

- Carousels cycle through restaurant cards automatically.
- Handles the empty state when no restaurants are available.
- Curated catalog flow for managing featured restaurants.

> Verification: `proof/SCRUM-456-SCRUM-457-curated-catalog-verification.md`, `proof/SCRUM-459-curated-catalog-flow-verification.md`

---

## 4. Menu Category Management

Restaurant menus can be organized into categories with full CRUD and ordering capabilities.

- **Create** custom categories (e.g. Starters, Main Courses, Desserts, Drinks).
- **Edit** category names.
- **Delete** categories.
- **Reorder** categories and products within categories.
- Products must belong to a valid category.
- Public menu filters by category tabs.
- Available on both web and mobile.

> Verification: `proof/SCRUM-443-menu-category-data-model-api.md`, `proof/SCRUM-444-product-category-validation.md`, `proof/SCRUM-445-menu-category-selector-ui.md`, `proof/SCRUM-446-public-menu-category-filtering.md`, `proof/SCRUM-447-category-management-verification.md`, `proof/SCRUM-533-native-menu-category-management-and-analytics-verification.md`

---

## 5. Enhanced Checkout

The checkout process includes detailed delivery information beyond a simple "place order" button.

- **Delivery address** — pre-filled from the user's profile.
- **Phone number** — pre-filled from profile.
- **Number of diners** — defaults to the count of main dishes in the cart.
- **Order notes** — optional free-text field.
- Full order summary with item breakdown and total before placing.

> Verification: `proof/SCRUM-441-checkout-delivery-details-verification.md`, `proof/SCRUM-415-web-checkout-order-status-ux.md`

---

## 6. Order Details and Reorder

Users can view detailed order information and reorder previous orders.

- Order details show full item breakdown, delivery info, status, and date.
- **Reorder** functionality: adds all items from a previous order back to the cart and pre-fills delivery details.
- Order cancellation and deletion with authorization checks.
- Color-coded status badges (blue=created, amber=preparing, green=delivered, red=cancelled).

> Verification: `proof/SCRUM-515-526-native-checkout-order-history-parity.md`, `proof/SCRUM-393-mobile-order-history-details.md`

---

## 7. Admin Workspace

A comprehensive admin area with five management panels/screens:

1. **Platform insights** — statistics dashboard.
2. **User management** — view, disable, delete, role changes, password resets.
3. **Restaurant moderation** — manage all restaurants.
4. **Sponsored promotions** — manage the promoted restaurant rail.
5. **Password reset requests** — review and issue temporary passwords.

See the [Admin Features](Admin-Features.md) page for full details.

> Verification: `proof/SCRUM-494-admin-workspace-verification.md`, `proof/SCRUM-607-611-admin-workspace-and-test-hygiene-verification.md`

---

## 8. Restaurant Access Roles

A permission system for restaurant management with three roles:

| Role | Capabilities |
|---|---|
| **Owner** | Full control: edit, products, categories, team, stats, delete, transfer ownership |
| **Editor** | Edit restaurant details, manage products and categories |
| **Admin** | Same as owner for all restaurants (via admin moderation) |

- Restaurant owners can add users as editors to their team.
- Ownership can be transferred to another user.
- A restaurant must always have at least one user with management access (protection against orphaned restaurants).

> Verification: `proof/SCRUM-598-restaurant-access-verification.md`

---

## 9. Admin Restaurant Management

Admins can manage any restaurant in the system, regardless of ownership:

- Edit restaurant details.
- Manage products and categories.
- View sales statistics.
- Manage the restaurant's team/access.

> Verification: `proof/SCRUM-612-613-admin-restaurant-management-verification.md`

---

## 10. System Restaurant Protection

Default/seeded restaurants (the curated catalog) are protected:

- Admins can edit and manage them.
- Admins **cannot delete** system restaurants.
- This prevents accidental removal of the base catalog.

> Verification: `proof/SCRUM-458-legacy-restaurant-cleanup-verification.md`

---

## 11. Post-Registration Profile Editing

Users can edit their account details after registration:

- **Full name**, **phone**, and **address** can be updated.
- **Profile image** can be uploaded (from gallery or camera on mobile) or removed.
- Changes persist immediately via the API and are reflected in the header/navigation.

> Verification: `proof/SCRUM-587-592-account-presentation-profile-image-verification.md`, `proof/SCRUM-488-credential-lifecycle-verification.md`

---

## 12. Forgot Password Flow

A complete password recovery process:

1. User clicks "Forgot password?" on the login page.
2. Enters their username → creates a password reset request.
3. An admin reviews the request in the Password Reset Requests panel.
4. Admin sets a **temporary password** for the user.
5. User logs in with the temporary password.
6. User changes their password from the Profile → Change Password screen.

> Verification: `proof/SCRUM-541-563-password-recovery-admin-parity-verification.md`

---

## 13. Restaurant Owner Sales Statistics

Restaurant owners and editors can view sales analytics for their restaurants:

- **Total orders** placed.
- **Total revenue** generated.
- **Average order value**.
- **Most ordered product** (the top-selling menu item).
- Available in both web (Sales panel) and mobile (RestaurantSalesStatisticsScreen).

> Verification: `proof/SCRUM-418-owner-restaurant-statistics-api.md`, `proof/SCRUM-419-web-sales-dashboard.md`, `proof/SCRUM-421-restaurant-sales-statistics-final-verification.md`

---

## 14. Light Mode and Dark Mode

Both clients support theme switching:

- **Web:** Toggle in the header. Preference stored in localStorage.
- **Mobile:** Toggle on the home screen and other screens. Preference stored in AsyncStorage.
- All UI elements — cards, inputs, badges, navigation, charts — adapt consistently.
- The theme system uses CSS variables (web) and a centralized color object (mobile).

> Verification: `proof/SCRUM-395-mobile-design-system-theme.md`

---

## 15. Broken Image Fallback

When a product or restaurant image fails to load or is missing:

- A **fallback placeholder** is displayed showing the first letter of the name in a colored circle/rectangle.
- Prevents broken image icons and empty gaps in the UI.
- Applied consistently across restaurant cards, product cards, cart items, and recommendations.

---

## 16. Responsive Design

The web client adapts to different screen sizes:

- **Narrow screens**: navigation collapses, cards stack vertically, management panels adjust.
- **Zoom-safe**: the layout handles browser zoom up to 200% without breaking.
- **Long text**: names, descriptions, and addresses truncate with ellipsis where needed.
- **Avatar and header**: clickable and responsive on narrow screens.
- The mobile app naturally adapts via React Native's flex layout.

> Verification: `proof/SCRUM-614-620-621-622-623-624-625-web-polish-verification.md`, `proof/SCRUM-615-617-618-619-native-polish-verification.md`

---

## 17. Full MongoDB Persistence with Docker Compose

All application data is persisted in MongoDB:

- Users, restaurants, products, orders, categories, promotions, password reset requests.
- Data survives container restarts (Docker volume `mongo-data`).
- On first startup, the server seeds default restaurants, products, images, and optionally an admin user.
- Sequence counters ensure unique, persistent recommendation IDs for the C++ engine.
- `docker compose down` preserves data; `docker compose down -v` wipes it for a fresh start.

> Verification: `proof/SCRUM-371-admin-bootstrap.md`, `proof/SCRUM-376-persistent-recommendation-ids.md`, `proof/SCRUM-377-recommendation-restart-verification.md`

---

## 18. React Native App (Full Feature Parity)

The React Native mobile app (27 screens) implements the complete client and management feature set:

**Client features:** registration with profile image (camera/gallery), login with session persistence, restaurant browsing with location sorting, search, cart with recommendations, checkout with delivery details, order history with cancel/delete/reorder, profile editing, password change, forgot password, theme toggle, currency support.

**Management features:** restaurant CRUD, product CRUD with validation, menu category management, restaurant access/team management, sales statistics.

**Admin features:** platform statistics dashboard, user management, restaurant moderation, sponsored promotions, password reset requests.

> Verification: `proof/SCRUM-520-native-home-discovery-verification.md`, `proof/SCRUM-515-526-native-checkout-order-history-parity.md`, `proof/SCRUM-542-cross-platform-parity-verification.md`