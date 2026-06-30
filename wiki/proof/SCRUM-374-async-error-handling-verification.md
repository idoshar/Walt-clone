# SCRUM-374 Async Error Handling Verification

## Goal

Provide a single reusable wrapper for asynchronous Express route handlers so rejected promises are consistently forwarded to the existing central error middleware.

## Implementation

Added:

- `web-server/src/middleware/asyncHandler.js`

The wrapper executes a route handler and forwards asynchronous promise rejections through `next(error)`.

Applied `asyncHandler` to all asynchronous route-controller bindings in:

- `userRoutes.js`
- `tokenRoutes.js`
- `restaurantRoutes.js`
- `productRoutes.js`
- `orderRoutes.js`
- `searchRoutes.js`

The existing `errorHandler.js` remains responsible for converting forwarded errors into JSON HTTP responses.

## Verification

### Direct middleware verification

A deliberately failing asynchronous handler was wrapped with `asyncHandler`.

Expected result:

- `asyncHandler` calls `next(error)` with the original rejected error.

Result:

- Passed: rejected async handler was forwarded to `next(error)`.

### API smoke test

- Rebuilt and started the `web-server` Docker service.
- Confirmed `GET /api/health` returned `status: ok`.
- Confirmed `GET /api/restaurants` responded successfully.

### Error-handler integration test

Sent invalid login credentials to `POST /api/tokens`.

Expected result:

- The asynchronous login error is handled by the central error flow and returns HTTP 401.

Result:

- Passed: HTTP 401 returned.

## Validation

- JavaScript syntax validation passed for modified routes and middleware.
- `git diff --check` passed.
- `docker compose config` passed.
