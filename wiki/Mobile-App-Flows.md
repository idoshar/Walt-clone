# Mobile App Flows

This page documents all major user flows in the **React Native (Expo) mobile app**.

The mobile app mirrors the web client's features with a native-appropriate UX: pull-to-refresh, native alert dialogs, camera/gallery image picker, stack navigation, and theme support.

---

## 1. Registration

1. From the login screen, tap **Create a new account**.
2. Fill in: full name, phone (10-digit Israeli format), address, password, confirm password.
3. Tap the **profile image area** to choose a photo from the gallery or camera.
   - Camera and photo library permissions are requested natively.
   - Selected image shows as a preview.
4. Validation:
   - All fields are required.
   - Password: minimum 8 characters, must include letters and numbers.
   - Confirm password must match.
5. Tap **Create account** → registered and logged in.
6. Duplicate username → error: "username already exists".

`[Screenshot: Mobile registration form]`
`[Screenshot: Image picker with camera/gallery options]`

---

## 2. Login and Session

1. Enter username and password.
2. Wrong credentials → error message displayed.
3. Correct credentials → navigated to the home screen.
4. Session token stored in AsyncStorage — closing and reopening the app restores the session automatically.
5. Tap **Sign out** on the home screen → returned to login.

`[Screenshot: Mobile login screen]`

---

## 3. Home Screen and Restaurant Browsing

1. The home screen displays:
   - Welcome message with user's name.
   - **Navigation buttons**: My Orders, My Restaurants, Admin (if admin), Sign out.
   - **Search bar** — tap to open the dedicated search screen.
   - **"Use location"** card — requests GPS permission, sorts restaurants by distance.
   - **Category filter chips**.
   - **Restaurant cards** with image, name, cuisine badge, description, address, and distance (if location enabled).
2. Pull down to refresh the restaurant list.
3. Tap a restaurant → opens the restaurant detail screen.

`[Screenshot: Mobile home screen with restaurants]`

---

## 4. Restaurant Details and Menu

1. Restaurant hero card with image, name, cuisine badge, description, address, phone.
2. **Menu section** with category filter chips.
3. Product cards with image (or initial placeholder), name, description, price, and **Add to cart** button.
4. Cart button in the menu header shows current item count.
5. Empty state when a restaurant has no products.
6. Pull down to refresh.

`[Screenshot: Mobile restaurant details with menu]`

---

## 5. Search

1. Tap the search bar on the home screen → opens SearchScreen with auto-focused input.
2. Type a query → results load (restaurants fetched with their products).
3. Results split into **Restaurants** and **Dishes** sections.
4. Tap a restaurant result → opens its detail screen.
5. Tap **+ Add** on a dish → adds it to the cart directly from search.
6. States: empty prompt ("What are you craving?"), no results, error with retry.

`[Screenshot: Mobile search with results]`

---

## 6. Cart

1. From the restaurant screen or search, tap **Add to cart**.
2. Navigate to the cart via the **Cart** button.
3. Items grouped by restaurant, each with:
   - Image/placeholder, name, unit price.
   - Quantity controls (+/-) and total.
   - **Remove** button.
4. **"Add to your order"** recommendations section:
   - Shows products from the C++ recommendation engine.
   - Falls back to same-category suggestions when the engine has no data.
   - Tap **+ Add** to add a recommended product directly.
5. Per-restaurant subtotal and **Checkout** button.
6. **Clear cart** button with confirmation alert.

`[Screenshot: Mobile cart with recommendations]`

---

## 7. Checkout and Orders

### Checkout
1. Tap **Checkout** from the cart (per restaurant).
2. Fill in delivery address, phone, number of diners (defaults to main dish count), and optional notes.
3. Order summary with item breakdown and total.
4. Submit → order placed, navigated back.

### Order History
1. Tap **My Orders** on the home screen.
2. Orders listed newest first with restaurant name, date, status badge (color-coded), item count, total.
3. Tap an order → **Order Details**:
   - Full item breakdown.
   - Status badge with color coding (blue=created, amber=preparing, green=delivered, red=cancelled).
   - **Order Actions** section:
     - **Cancel order** — only for "created" status, with confirmation alert.
     - **Delete order** — only for "created" or "cancelled", with confirmation alert.
   - Unauthorized actions show a clear message.
   - **Refresh order status** button.

`[Screenshot: Mobile order details with actions]`

---

## 8. Restaurant Management

### My Restaurants
1. Tap **My Restaurants** on the home screen.
2. See restaurants you own, each with image, name, cuisine, address, item count, and "You own this" badge.
3. **+ Add** button to create a new restaurant.
4. Each card has **Edit** and **Manage products** buttons.

### Create / Edit / Delete Restaurant
1. Tap **+ Add** or **Edit** → restaurant form.
2. Fields: name (required), cuisine, address, phone, description, image URL, latitude/longitude.
3. Validation: name required, phone format checked, lat/lng must come in pairs.
4. In edit mode: a red **Delete restaurant** button at the bottom with confirmation.
5. After create/edit/delete → list auto-refreshes.

### Manage Products
1. Tap **Manage products** on a restaurant card.
2. Product list with image, name, category, description, price, Published/Draft badge.
3. **+ Add** to create a product, **Edit** to modify, **Delete** with native confirmation.
4. After any CRUD action → list auto-refreshes.
5. Ownership enforcement: trying to manage another owner's restaurant shows "Not authorized".

### Menu Categories
1. From restaurant management → **Categories**.
2. Create, edit, delete, and reorder categories.
3. Assign products to categories.

### Restaurant Access / Team
1. From restaurant management → **Team**.
2. Add editors, transfer ownership, view team roles.

### Sales Statistics
1. From restaurant management → **Sales**.
2. View total orders, revenue, average order value, and most ordered product.

`[Screenshot: My Restaurants list]`
`[Screenshot: Restaurant form]`
`[Screenshot: Product management with Published badge]`

---

## 9. Admin (Admin Users Only)

1. Log in as admin → **Admin** button appears on the home screen.
2. Admin workspace includes:
   - **Platform insights** — statistics dashboard with 6 metric cards and order status breakdown.
   - **User management** — view, disable, delete users; assign roles; reset passwords.
   - **Restaurant moderation** — manage all restaurants (edit, products, categories, team, stats).
   - **Sponsored promotions** — manage which restaurants appear in the promoted rail.
   - **Password reset requests** — review and issue temporary passwords.
3. Non-admin users see "Access restricted" if they somehow reach the admin screen.

`[Screenshot: Mobile admin dashboard]`

---

## 10. Profile

1. Tap the user avatar/name on the home screen → **Profile** screen.
2. Edit full name, phone, and address → Save.
3. Upload or remove profile image (gallery or camera).
4. Navigate to **Change password**.

`[Screenshot: Mobile profile screen]`

---

## 11. Theme

1. Tap the **sun/moon toggle** on the home screen (or any screen with the toggle).
2. The entire app switches between Light Mode and Dark Mode.
3. All screens, cards, inputs, and badges update consistently.
4. Preference persists via AsyncStorage.

`[Screenshot: Mobile dark mode]`
`[Screenshot: Mobile light mode]`

---

## 12. Forgot Password

1. From the login screen, tap **Forgot password?**
2. Enter your username → a reset request is created.
3. An admin reviews the request and sets a temporary password.
4. Log in with the temporary password, then change it from the Profile screen.

`[Screenshot: Forgot password screen]`