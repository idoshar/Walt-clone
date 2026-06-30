# Administrator workspace — verification

## Scope
- Protected administrator workspace on web and mobile.
- Role-gated access for administrator accounts only.

## Web verification
- Admin navigation link appears only for users with role `admin`.
- `/admin` is protected by an admin guard.
- Unauthenticated users are redirected to login.
- Non-admin users are redirected to the home page.
- Admin workspace was checked in light and dark modes.
- Header layout was checked with the Admin link, search, navigation, and user controls.

## Mobile verification
- The Admin screen is registered only for users with role `admin`.
- The Admin button appears only for administrators on the Home screen.
- The mobile Admin workspace renders correctly in light and dark modes.
- Non-admin users do not see or receive the Admin route.

## Technical verification
- `docker compose build web-server` completed successfully.
- `GET /api/health` returned `status: ok`.
- `git diff --check` passed.
- Web and mobile admin/non-admin flows were tested manually.
