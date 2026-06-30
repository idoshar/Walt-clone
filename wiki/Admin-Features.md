# Admin Features

This page documents the admin workspace available to users with the admin role. The admin features are available in both the web client and the mobile app.

---

## Accessing the Admin Workspace

### Web Client
Log in as admin → a dedicated **Admin** section appears in the navigation. The admin page contains panels for each management area.

### Mobile App
Log in as admin → an **Admin** button appears in the home screen header. The Admin screen provides navigation to each management area.

---

## 1. Platform Statistics Dashboard

Provides a high-level overview of the platform.

**Metrics displayed (6 cards):**
- Total registered users
- Total restaurants
- Total menu items
- Total orders
- Total revenue
- Average order value

**Order status breakdown:**
A table showing the count of orders in each status (created, confirmed, preparing, delivered, cancelled).

**States handled:**
- Loading: spinner while data loads.
- Success: all metrics and breakdown displayed.
- Empty: "No orders yet" when no orders exist.
- Error: "Could not load platform insights" with a "Try again" button.
- Non-admin: "Access restricted" message (no API call made).

> Verification: `proof/SCRUM-402-native-admin-insights-verification.md`, `proof/SCRUM-403-admin-dashboard-states.md`

`[Screenshot: Admin statistics dashboard]`

---

## 2. User Management

Admins can view and manage all registered users.

**Capabilities:**
- View all users with their roles, registration date, and status.
- **Disable/enable** a user account (disabled users cannot log in).
- **Delete** a user account permanently.
- **Change user role** (regular user ↔ admin).
- **Reset password** — set a temporary password for a user who requested a reset.

**Protections:**
- Admins cannot delete or disable their own account.
- Role changes take effect immediately.

> Verification: `proof/SCRUM-504-575-admin-user-management-verification.md`

`[Screenshot: User management panel/screen]`

---

## 3. Restaurant Moderation

Admins can manage **all restaurants** in the system, regardless of ownership.

**Capabilities:**
- View all restaurants with owner information.
- **Edit** any restaurant's details (name, cuisine, address, phone, description, image).
- **Manage products** — add, edit, delete products for any restaurant.
- **Manage categories** — create, edit, delete, reorder categories for any restaurant.
- **View statistics** — see sales data for any restaurant.
- **Manage team** — view and modify the access team for any restaurant.

**Protections:**
- System/catalog restaurants (seeded defaults) **cannot be deleted** by admin — they can only be managed.
- Admin moderation policy is documented in `proof/SCRUM-480-admin-moderation-policy.md`.

> Verification: `proof/SCRUM-480-admin-restaurant-moderation-verification.md`, `proof/SCRUM-612-613-admin-restaurant-management-verification.md`

`[Screenshot: Admin restaurant moderation]`

---

## 4. Sponsored Promotions

Admins control which restaurants appear in the **sponsored rail** on the home page.

**Capabilities:**
- View current sponsored restaurants.
- Add a restaurant to the sponsored list.
- Remove a restaurant from the sponsored list.
- Change the display order of sponsored restaurants.

When no sponsored restaurants are configured, the carousel handles the empty state gracefully.

> Verification: `proof/SCRUM-448-SCRUM-540-sponsored-restaurants-verification.md`

`[Screenshot: Sponsored promotions management]`

---

## 5. Password Reset Requests

When a user uses the "Forgot password" flow, a reset request is created. Admins review and act on these requests.

**Flow:**
1. User clicks "Forgot password?" on the login page and enters their username.
2. A password reset request is created in the system.
3. Admin navigates to the password reset requests panel/screen.
4. Admin reviews the request and sets a **temporary password** for the user.
5. The user logs in with the temporary password.
6. The user changes their password from the Profile/Change Password screen.

> Verification: `proof/SCRUM-541-563-password-recovery-admin-parity-verification.md`

`[Screenshot: Password reset requests panel]`

---

## Cross-Platform Parity

All admin features are available in both the web client and the mobile app. The web uses panels within the Admin page; the mobile uses dedicated screens accessed from the Admin workspace.

> Verification: `proof/SCRUM-542-cross-platform-parity-verification.md`, `proof/SCRUM-607-611-admin-workspace-and-test-hygiene-verification.md`