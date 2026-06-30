# SCRUM-504 / SCRUM-575 — Admin user management verification

## Implemented scope

### Account lifecycle management
- Administrators can list and search user accounts.
- Administrators can deactivate and reactivate eligible accounts.
- Deactivated users lose active access and cannot sign in.
- Administrators can reset another user's password to a temporary password.
- Temporary-password users must change their password before accessing protected features.
- Eligible customer accounts can be deleted permanently.
- Deletion is blocked for administrator accounts, accounts with orders, accounts that own restaurants, and the acting administrator's own account.

### Role management
- Administrators can promote customers to administrators.
- Administrators can demote eligible administrators to customers.
- Owner roles cannot be changed through the administrator role-management flow.
- Role changes invalidate active sessions.
- Administrators cannot manage their own role.
- Final active administrator protection is enforced server-side.

### Audit and safety
- Account deactivation, reactivation, role changes, password resets, and successful deletions create audit-log entries.
- Password hashes, token versions, and temporary passwords are never returned by account-management APIs.

### Web client
- Admin workspace includes User account management.
- Search, account status actions, role actions, temporary-password reset modal, deletion, loading/error states, and inline action errors are available.
- Protected actions are disabled for the current administrator and protected accounts.

### Native client
- Admin workspace includes User account management.
- The native screen supports search, status changes, role changes, password-reset modal, deletion confirmation, inline errors, refresh, and protected-action states.

## Automated verification

- `scrum-488-credential-lifecycle.test.js`: 6 passed, 0 failed
- `scrum-504-575-admin-user-management.test.js`: 6 passed, 0 failed
- `scrum-504-575-admin-status-api.test.js`: 5 passed, 0 failed
- `scrum-504-575-admin-role-api.test.js`: 7 passed, 0 failed
- `scrum-504-admin-password-reset-api.test.js`: 8 passed, 0 failed
- `scrum-504-admin-user-delete-api.test.js`: 7 passed, 0 failed

Total backend regression coverage: 39 passed, 0 failed.

## Manual verification

### Web
- Opened `/admin` as an administrator.
- Confirmed User account management appears in the admin workspace.
- Confirmed user list and search render correctly.
- Confirmed protected controls are disabled for the current administrator.
- Confirmed password reset opens in a modal dialog.
- Confirmed blocked deletion displays the server reason inline on the affected user card.

### Native
- Opened Admin area in Expo Go.
- Confirmed User account management route opens successfully.
- Confirmed the management screen loads and navigation works.
- Confirmed the password-reset modal and account-management controls render successfully.
