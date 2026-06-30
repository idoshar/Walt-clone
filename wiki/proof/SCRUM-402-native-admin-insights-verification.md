# SCRUM-402 — Native administrator platform insights verification

## Scope

The React Native Admin workspace now provides a live Platform insights screen
backed by the existing protected administrator statistics endpoint.

## API verification

`GET /api/admin/statistics` was verified with a valid administrator token.

The endpoint returned:

- user count
- restaurant count
- menu item count
- order count
- total revenue
- average order value
- order status breakdown

The initial development dataset contained no orders. The API returned zero
values and an empty status breakdown, which the native UI treats as a normal
empty state.

## Native verification

Using an administrator account:

- Platform insights is marked as Available now in the Admin workspace.
- Tapping Platform insights opens the protected native insights screen.
- The screen displays summary cards for users, restaurants, menu items, orders,
  total revenue and average order value.
- When there are no orders, the screen displays the No orders yet state.
- Refresh reloads the current platform data.
- Pull-to-refresh reloads the current platform data.
- The screen remains readable in light and dark themes.
- Navigation back to the Admin workspace remains functional.

## Authorization expectation

The underlying `/api/admin/statistics` endpoint is protected by authentication
and administrator authorization middleware. Non-admin users cannot access the
administrator statistics endpoint.

## Build verification

- `npx expo export --platform ios` completed successfully.
- `git diff --check` completed successfully.
