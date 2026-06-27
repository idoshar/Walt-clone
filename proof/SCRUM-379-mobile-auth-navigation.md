# SCRUM-379 Mobile Navigation, Authentication and Protected Routes

## Goal

Add mobile navigation and an authenticated application flow.

## Implementation

- Added React Navigation with separate authentication and application stacks.
- Added `AuthContext` for:
  - sign in;
  - sign up;
  - sign out;
  - restoring a persisted session on application startup.
- Added AsyncStorage session persistence for the token and authenticated user.
- Added Login and Register screens.
- Added protected navigation:
  - unauthenticated users only see Login and Register;
  - authenticated users only see Home.
- Moved the existing backend connection and nearby-restaurants location flow into the protected Home screen.
- Added mobile authentication API helpers for:
  - `POST /api/users`;
  - `POST /api/tokens`.
- Added narrowly scoped CORS support for Expo Web origins:
  - `http://localhost:8081`
  - `http://127.0.0.1:8081`

## Validation

- `npx expo-doctor` completed successfully with 18/18 checks passed.
- `npx expo export --platform web` completed successfully.
- Verified CORS preflight from Expo Web origin:
  - returned `204 No Content`;
  - returned the expected `Access-Control-Allow-*` headers.
- Registered a new user through the mobile Register screen.
- Verified registration automatically signed the user in and opened Home.
- Verified the protected Home screen reached the backend successfully.
- Verified Sign out returned to the Login screen.
- Verified Login with the same user returned to Home.
- Refreshed the browser while authenticated and verified the session was restored and Home remained visible.
