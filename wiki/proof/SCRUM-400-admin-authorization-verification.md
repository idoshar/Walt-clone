# SCRUM-400 Admin Authorization and Mobile Navigation Verification

## Goal

Add server-side admin authorization and ensure that admin navigation is visible only to authenticated admin users.

## Server-side authorization

Added:

- `adminMiddleware.js`
- `GET /api/admin/me`
- authentication and admin-role enforcement for the admin endpoint

The endpoint requires a valid JWT and an `admin` role claim.

## API validation

A dedicated test user was created and tested in three authorization states:

| Scenario | Expected status | Result |
|---|---:|---:|
| Request without a token | 401 | Passed |
| Authenticated customer request | 403 | Passed |
| Authenticated admin request | 200 | Passed |

The admin endpoint returned the authenticated admin user's id, username, full name, and role.

## Mobile validation

Verified in the Expo web application:

1. An admin user sees an `Admin` button next to `Sign out` on the Home screen.
2. Selecting `Admin` opens the `Admin area` screen.
3. A regular customer user does not see an `Admin` button.
4. The Admin screen itself is only registered in the authenticated navigator when `user.role === 'admin'`.

## Files changed

- `web-server/src/middleware/adminMiddleware.js`
- `web-server/src/routes/adminRoutes.js`
- `web-server/src/routes/index.js`
- `mobile/src/navigation/RootNavigator.js`
- `mobile/src/screens/HomeScreen.js`
- `mobile/src/screens/AdminScreen.js`
