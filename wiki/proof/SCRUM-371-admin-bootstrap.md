# SCRUM-371 Idempotent MongoDB Seeds and Initial Admin Bootstrap

## Goal

Provide safe, repeatable startup seed behavior and optional initial admin bootstrap configuration.

## Implementation

- Kept the existing default restaurant seed idempotent through `$setOnInsert`.
- Added optional `INITIAL_ADMIN_*` environment variables to `.env.example` and Docker Compose.
- Added `seedInitialAdmin.js`, which:
  - skips bootstrap when no admin variables are configured;
  - fails startup clearly when only part of the required configuration is present;
  - creates an admin only when all required values are configured;
  - uses `$setOnInsert`, so an existing user is never modified.
- Added admin bootstrap execution after the MongoDB connection and restaurant seed.
- Prevented public registration from accepting a caller-provided role; all new API users are created as `customer`.

## Verification

### Admin bootstrap enabled
- Started the web server with all `INITIAL_ADMIN_*` variables configured.
- Verified one admin user was created with role `admin`.

### Idempotency
- Restarted the web server with the same environment variables.
- Verified the log reported that the admin already existed and was not modified.
- Verified only one matching admin user existed in MongoDB.

### Safe default behavior
- Removed all temporary `INITIAL_ADMIN_*` environment variables.
- Force-recreated the web-server container.
- Verified startup logged that admin bootstrap was skipped.
- Verified no bootstrap admin user existed in MongoDB.

### Registration hardening
- Sent a `POST /api/users` request containing `role: "admin"`.
- Verified the created user had role `customer`.
