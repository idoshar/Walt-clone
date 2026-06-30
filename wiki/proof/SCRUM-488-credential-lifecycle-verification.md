# SCRUM-488 — Secure Password Lifecycle Verification

## Scope

Implemented a secure credential lifecycle for the food-delivery application:

- Hash new passwords with bcrypt before storage.
- Upgrade successfully authenticated legacy plain-text passwords to bcrypt hashes.
- Require selected users to change their password before accessing protected features.
- Invalidate existing tokens after a password change.
- Support the mandatory password-change flow in both the Web and React Native clients.

## Backend implementation

### Password security

- Added `bcryptjs` for password hashing and verification.
- New passwords must contain at least 8 characters, including at least one letter and one digit.
- Password values are never trimmed before hashing or comparison.
- The `password` field is excluded from normal user model responses.
- Initial-admin bootstrap passwords are stored as bcrypt hashes.
- Existing legacy plain-text passwords are upgraded only after a successful login.

### Token and session invalidation

- Added `tokenVersion` to users and JWT payloads.
- Authentication middleware validates both the signed JWT and the current user record in MongoDB.
- A token is rejected when its `tokenVersion` does not match the persisted user version.
- Password replacement increments `tokenVersion`, immediately invalidating previously issued tokens.

### Mandatory password replacement

- Added `mustChangePassword` to user records and API responses.
- Users marked with `mustChangePassword: true` are blocked from protected actions.
- The only permitted protected action in this state is:

  `PATCH /api/users/me/password`

- Password-change requests require the current password and a valid, different new password.
- A successful password update clears `mustChangePassword`, increments `tokenVersion`, and returns a fresh authenticated session.

## Client implementation

### Web client

- Added a dedicated `ChangePasswordPage`.
- Login explicitly redirects users with `mustChangePassword: true` to `/change-password`.
- Routing prevents access to normal application pages until password replacement succeeds.
- The password-change response updates the stored JWT and current user data.
- Users can sign out instead of changing the password.

### React Native client

- Added `ChangePasswordScreen`.
- Added `changeCurrentPassword` API support.
- Added `changePassword` to the native authentication context.
- A restricted native navigator is displayed while `mustChangePassword` is true.
- After a successful update, AsyncStorage is replaced with the new token and user session.
- Users can sign out from the required password-change screen.

## Automated verification

| Verification | Result |
| --- | --- |
| `node tests/scrum-323-create-order.test.js` | 10 passed, 0 failed |
| `node tests/scrum-324-previous-orders.test.js` | 7 passed, 0 failed |
| `node tests/scrum-325-management.test.js` | 18 passed, 0 failed |
| `node tests/scrum-404-backend.test.js` | 12 passed, 0 failed |
| `node tests/scrum-437-delivery-details.test.js` | 7 passed, 0 failed |
| `node tests/scrum-440-order-history-details.test.js` | 4 passed, 0 failed |
| `node tests/scrum-488-credential-lifecycle.test.js` | 6 passed, 0 failed |
| `npm --prefix client run build` | Passed |
| `docker compose build web-server` | Passed |
| `npx expo export --platform ios` | Passed |
| `git diff --check` | Passed |

## Manual verification

### Web

1. Created a user and set `mustChangePassword: true`.
2. Logged in with the current valid password.
3. Confirmed immediate redirect to the password-change screen without normal application navigation.
4. Replaced the password successfully.
5. Confirmed access to the home page after replacement.
6. Confirmed the old password no longer worked and the new password authenticated successfully.

### React Native

1. Created a user and set `mustChangePassword: true`.
2. Logged in through Expo with the current valid password.
3. Confirmed only the required password-change screen was available.
4. Replaced the password successfully.
5. Confirmed normal navigation became available after replacement.
6. Confirmed the old password no longer worked and the new password authenticated successfully.

## Test cleanup

Temporary Web and React Native verification users were removed from MongoDB after testing.
