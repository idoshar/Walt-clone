# SCRUM-541 / SCRUM-563 — Password Recovery and Administrator Workspace Parity

## Scope

Implemented a secure administrator-approved password-recovery workflow across the API, Web client, and React Native client.

### Public password-recovery flow

- Added `POST /api/password-reset-requests`.
- Accepts a username and always returns the same generic `202 Accepted` response for matching and non-matching usernames.
- Prevents account enumeration through the public response.
- Creates at most one open request per active user while the request is pending or processing.

### Administrator recovery workflow

- Added `GET /api/admin/password-reset-requests?status=pending`.
- Added `PATCH /api/admin/password-reset-requests/:id/approve`.
- Added `PATCH /api/admin/password-reset-requests/:id/reject`.
- Approval sets a temporary password, invalidates previous tokens, and requires a password change at the next sign-in.
- Approval and rejection create administrator audit-log records.
- Temporary passwords are never returned in API responses or audit-log details.
- Administrators cannot approve or reject requests for their own accounts.

### Web parity

- Added a public Forgot Password page and Login-page link.
- Added an administrator panel for pending password-recovery requests.
- Administrators can approve a request with a temporary password or reject it.
- The administrator UI hides recovery actions for the currently signed-in administrator's own request.

### React Native parity

- Added a Forgot Password screen and Login-screen link.
- Added a Password recovery requests tool in the Admin workspace.
- Added a native request-review screen with approve, reject, refresh, and temporary-password entry flows.
- The native UI hides recovery actions for the currently signed-in administrator's own request.

## Automated verification

Executed successfully against Docker Compose services:

- `tests/scrum-504-575-admin-user-management.test.js` — 6 passed, 0 failed.
- `tests/scrum-504-575-admin-role-api.test.js` — 7 passed, 0 failed.
- `tests/scrum-504-575-admin-status-api.test.js` — 5 passed, 0 failed.
- `tests/scrum-504-admin-password-reset-api.test.js` — 8 passed, 0 failed.
- `tests/scrum-504-admin-user-delete-api.test.js` — 7 passed, 0 failed.
- `tests/scrum-563-password-reset-request-api.test.js` — 13 passed, 0 failed.
- `tests/scrum-598-restaurant-access.test.js` — 10 passed, 0 failed.

Total: 56 passed, 0 failed.

The SCRUM-563 integration test verifies:

- Generic public response for existing and unknown usernames.
- Prevention of duplicate open requests.
- Anonymous and non-admin authorization failures.
- Admin request-list safety, without password or token-version exposure.
- Password-policy validation before approval.
- Self-approval and self-rejection protection.
- Temporary-password hashing, token invalidation, and forced password replacement.
- Request rejection and prevention of approval after rejection.
- Safe administrator audit logs.
- Status-filter validation.

## Build and runtime verification

- `docker compose up -d --build web-server` completed successfully.
- `GET /api/health` returned `{ "status": "ok" }`.
- `npm --prefix client run build` completed successfully.
- `npx expo export --platform web` completed successfully.
- `git diff --check` completed without whitespace errors.

## Manual verification

Completed manually in both Web and React Native:

- Submitted a public password-reset request from the login flow.
- Verified that the public UI displays only a generic review message.
- Verified that the request appears in the administrator recovery queue.
- Approved a request using a temporary password.
- Signed in with the temporary password and verified that password replacement is required before normal application access.
- Verified that the new final password works afterward.