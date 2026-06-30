# SCRUM-607–611 Admin Workspace and Test Hygiene Verification

## Scope

This verification covers:

- SCRUM-607 — Restore admin analytics on the Web dashboard
- SCRUM-608 — Add password-reset request access to the Web admin users screen
- SCRUM-609 — Show one Admin workspace tool panel at a time
- SCRUM-610 — Open admin restaurant editing in a modal on Web and Native
- SCRUM-611 — Clean up temporary restaurants created by automated tests

## SCRUM-607 — Web platform insights

Verified as an administrator:

- Platform insights opens from the Admin workspace.
- The panel loads platform metrics for users, restaurants, menu items, orders,
  total revenue, and average order value.
- Order-status information loads correctly.
- Refresh reloads the current statistics.
- The Web dashboard uses the existing administrator statistics API.

## SCRUM-608 — Password reset requests access

Verified as an administrator:

- User accounts opens from the Admin workspace.
- Password reset requests can be opened from the user-management area.
- The password-reset request screen loads correctly.
- Back to user accounts returns to the user-management panel.

## SCRUM-609 — Single active Admin workspace tool

Verified on the Web Admin page:

- No management panel is open by default.
- Selecting a tool opens its matching panel.
- Selecting another tool closes the previously open panel.
- Selecting the active tool again closes it.
- Sponsored promotions displays a clear Coming soon state.
- Platform insights, restaurant moderation, and user accounts remain reachable
  through their corresponding workspace controls.

## SCRUM-610 — Restaurant moderation modal

Verified as an administrator on Web and Native:

- No restaurant editor is visible before a manageable restaurant is selected.
- Selecting Edit opens the restaurant editor in a modal.
- Only one restaurant editor can be open at a time.
- Cancel closes the modal without saving.
- Web modal closing works through the close control, backdrop click, and Escape.
- Native modal closing works through Close, Cancel, backdrop interaction, and
  Android back behavior where available.
- Protected catalog restaurants remain visible but cannot be edited or deleted.
- Existing save and delete behavior remains available inside the modal.

## SCRUM-611 — Temporary restaurant cleanup

The following test suites create temporary restaurants:

- `tests/scrum-325-management.test.js`
- `tests/scrum-404-backend.test.js`
- `tests/scrum-480-402-admin.test.js`
- `tests/scrum-598-restaurant-access.test.js`

Cleanup improvements:

- Temporary restaurant names use clear, unique test prefixes.
- Cleanup runs through `finally` blocks where required.
- Cleanup targets the exact restaurant ID created by the test.
- Administrator test users created by SCRUM-480/402 are removed after testing.
- Restaurant-access cleanup can delete the temporary restaurant before or after
  ownership transfer.

Verification results:

| Test suite | Result |
|---|---|
| SCRUM-325 management | 18 passed, 0 failed |
| SCRUM-404 backend | 13 passed, 0 failed |
| SCRUM-480/402 admin | 15 passed, 0 failed |
| SCRUM-598 restaurant access | 10 passed, 0 failed |

A MongoDB audit confirmed that no temporary restaurants matching the relevant
legacy or current test prefixes remained after the test run.

## Build verification

- `npm --prefix client run build` completed successfully.
- `npx expo export --platform web` completed successfully.
- `git diff --check` completed without whitespace errors.

## Result

The Web Admin workspace now provides focused single-panel navigation,
administrator statistics, and password-reset request access. Restaurant editing
uses a modal interaction on both Web and Native. Automated test data cleanup
removes the exact temporary restaurants created during testing.