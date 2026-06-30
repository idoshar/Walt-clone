# Web Client Flows

This page documents all major user flows in the **React web client** at `http://localhost:3000`.

---

## 1. Registration

1. From the login page, click **Create a new account**.
2. Fill in: username, full name, phone, address, password, confirm password.
3. Optionally select a **profile image** (displayed as a preview before submitting).
4. Validation rules:
   - All fields are required.
   - Password must be at least 8 characters with letters and numbers.
   - Confirm password must match.
   - Phone must be a valid format.
5. Submit → account created, redirected to the home page.
6. If the username already exists → a clear error: "username already exists".

`[Screenshot: Registration page with validation errors]`
`[Screenshot: Successful registration]`

---

## 2. Login

1. Enter username and password on the login page.
2. Wrong credentials → clear error message.
3. Correct credentials → redirected to the home page.
4. Press Enter to submit (no need to click the button).
5. Session persists via localStorage — closing and reopening the tab restores the session.
6. Click the user avatar/name in the header → opens the Profile page.

`[Screenshot: Login page]`
`[Screenshot: Home page after login]`

---

## 3. Restaurant Browsing

1. The home page displays:
   - **Sponsored restaurant rail** — admin-managed promoted restaurants.
   - **Auto-rotating carousels** — recommended and general restaurants.
   - **Category filter chips** (All, Italian, American, Japanese, etc.).
   - **"Use my location"** button — sorts restaurants by distance.
2. Click a restaurant card → opens the restaurant detail page.
3. The restaurant page shows:
   - Restaurant info (name, cuisine, address, phone, image).
   - **Menu organized by categories** with category tabs.
   - Products with name, description, price, image, and "Add to cart" button.
4. Empty state shown when a restaurant has no products.

`[Screenshot: Home page with carousels and sponsored rail]`
`[Screenshot: Restaurant page with menu categories]`

---

## 4. Search

1. Click the search bar in the header or navigate to the Search page.
2. Type a query — results appear with debounced input.
3. Results are separated into **Restaurants** and **Products** sections.
4. Click a restaurant result → opens its detail page.
5. Products show price and restaurant name.
6. If no results → "No results" empty state.

`[Screenshot: Search results showing restaurants and products]`

---

## 5. Cart and Checkout

1. Add products from any restaurant → cart icon in the header updates with count.
2. Click the cart dropdown → see items grouped by restaurant, with quantity controls (+/-).
3. **Recommendations section** — "Add to your order" shows suggested products based on the C++ recommendation engine; falls back to category-based suggestions when the engine has no data.
4. Click **Checkout** for a restaurant group.
5. Checkout page includes:
   - Delivery address (pre-filled from profile).
   - Phone number.
   - Number of diners (defaults to the count of main dishes).
   - Order notes (optional).
   - Order summary with item breakdown and total.
6. Submit → order placed, redirected to Order Status page.

`[Screenshot: Cart dropdown with items and recommendations]`
`[Screenshot: Checkout page with delivery details]`

---

## 6. Orders

1. Navigate to **My Orders** from the header.
2. Orders listed newest first, with restaurant name, date, status badge (color-coded), item count, and total.
3. Click an order → **Order Details** page:
   - Full item breakdown with quantities and prices.
   - Delivery details (address, phone, diners, notes).
   - Status with color-coded badge.
   - **Reorder** button — adds all items back to the cart and pre-fills delivery details.
4. Order statuses: Created, Confirmed, Preparing, Delivered, Cancelled.

`[Screenshot: Orders list page]`
`[Screenshot: Order details with reorder button]`

---

## 7. Restaurant Management (Owner/Editor)

1. Navigate to **Manage** from the header (visible to restaurant owners).
2. See all restaurants you own or have editor access to.
3. **Create restaurant**: click "+ New restaurant", fill in name, cuisine, address, phone, description, image URL, coordinates.
4. **Edit restaurant**: click a restaurant card → edit any field → Save.
5. **Delete restaurant**: on the edit page, click Delete (only for owners; system restaurants are protected).
6. **Manage products**: click "Menu" on a restaurant:
   - Add product with name, price, category, description, image URL.
   - Edit or delete existing products.
   - Products show publication status (Published/Draft).
7. **Manage categories**: click "Categories" on a restaurant:
   - Create, edit, delete, and reorder menu categories.
   - Assign products to categories.
   - Drag to reorder categories and products within categories.
8. **Restaurant access**: click "Team" on a restaurant:
   - Add users as Editor or transfer ownership.
   - View current team members and their roles.
   - Protection: a restaurant must always have at least one owner.
9. **Sales statistics**: click "Sales" on a restaurant:
   - Total orders, total revenue, average order value.
   - Most ordered product.

`[Screenshot: Restaurant management list]`
`[Screenshot: Menu management with categories]`
`[Screenshot: Restaurant access/team panel]`

---

## 8. Profile and Account

1. Click the user avatar/name in the header → **Profile page**.
2. Edit full name, phone, and address → Save.
3. Upload or remove profile image.
4. Click **Change password** → enter current password + new password.
5. **Forgot password**: from the login page, click "Forgot password?":
   - Enter username → a reset request is created.
   - An admin reviews it and sets a temporary password.
   - The user logs in with the temporary password and changes it.

`[Screenshot: Profile page]`
`[Screenshot: Change password page]`

---

## 9. Theme

1. Click the **moon/sun toggle** in the header.
2. The entire UI switches between **Light Mode** and **Dark Mode**.
3. Preference persists across sessions via localStorage.

`[Screenshot: Light mode home page]`
`[Screenshot: Dark mode home page]`

---

## 10. Currency

1. Click the **currency selector** in the header (ILS, USD, EUR, GBP).
2. All prices throughout the app update in real time based on exchange rates.
3. Currency preference persists across sessions.

`[Screenshot: Price displayed in different currencies]`