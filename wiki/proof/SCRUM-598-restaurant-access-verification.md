# SCRUM-598 — Delegated Restaurant Editing and Ownership Transfer Verification

## Scope

Restaurant owners can delegate day-to-day management access to editors and can
transfer ownership to another existing user.

Editors can manage restaurant details, products, menu categories and restaurant
statistics. Editors cannot manage team access, transfer ownership or delete a
restaurant.

## Backend implementation

- Added `editorIds` to the Restaurant model.
- Added a shared restaurant access service for owner/editor authorization.
- Added protected access-management endpoints:
  - `GET /api/restaurants/:id/access`
  - `POST /api/restaurants/:id/editors`
  - `DELETE /api/restaurants/:id/editors/:userId`
  - `PUT /api/restaurants/:id/owner`
- Added authenticated username lookup:
  - `GET /api/users/lookup?username=<username>`
- Ordinary restaurant updates cannot modify `ownerId` or `editorIds`.
- Only the owner can manage access, transfer ownership or delete a restaurant.

## Automated verification

- `node tests/scrum-598-restaurant-access.test.js`
  - Result: 10 passed, 0 failed.
  - Verified owner/editor permissions, editor revocation, ownership transfer,
    previous-owner access removal and cleanup of the temporary restaurant.
- `node --check` passed for the new and updated backend modules.
- `docker compose up -d --build web-server` completed successfully.
- The web server connected successfully to MongoDB.
- `npm --prefix client run build` completed successfully.
- `npx expo export --platform web` completed successfully.
- `git diff --check` completed successfully.

## Web verification

- Restaurant Management displays an Owner or Editor access badge.
- Owners can open Manage Team Access.
- Owners can look up an existing user, grant editor access, remove an editor
  and transfer ownership.
- Editors can manage restaurant content but do not see Manage Team Access or
  Delete Restaurant.
- The access-management flow was verified manually in the Web application.

## Native verification

- My Restaurants displays either You own this or Editor access.
- Owners can open Manage team.
- The native Team access screen loads the owner and editors and supports user
  lookup, editor delegation, editor removal and ownership transfer.
- Editors can edit restaurant content and products but cannot access team
  management or delete the restaurant.
- The access-management flow was verified manually in the React Native app.