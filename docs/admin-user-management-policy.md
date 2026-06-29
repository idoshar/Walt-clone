# Admin User Management Policy

## Authorization
- Only administrators may manage user accounts.
- Administrators cannot manage their own account.

## Account lifecycle
- Deactivated users cannot log in or use existing sessions.
- Deactivation, role changes, and password resets invalidate active tokens.
- Permanent deletion is allowed only for non-admin users with no orders and no owned restaurants.

## Role safety
- This feature supports only `customer` to `admin` promotion and `admin` to `customer` demotion.
- The `owner` role is not changed by administrator role-management actions.
- The final active administrator cannot be deactivated, deleted, or demoted.

## Password recovery
- An administrator supplies a temporary password.
- The server stores only its password hash.
- The target user must change the password at next login.
- The temporary password is never returned by the API.

## Audit
- Successful account lifecycle and role changes create an audit record containing actor, target, action, and timestamp.
