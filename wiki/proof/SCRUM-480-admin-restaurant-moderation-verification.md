# SCRUM-480 — Administrator restaurant moderation verification

## Scope

Administrator moderation was added across the backend, web application and
React Native application.

## Moderation policy

- Restaurants with `isDefault: true` are protected system catalog entries.
- Protected catalog restaurants remain visible to administrators.
- Protected catalog restaurants cannot be edited or deleted through moderation.
- Non-system restaurants can be reviewed, edited and deleted by administrators.
- Deleting a non-system restaurant also removes its products and menu
  categories.
- Existing orders remain intact because order records contain item snapshots.

## Backend verification

The moderation API was verified against the running Docker environment.

- `GET /api/admin/restaurants` without a token returned `401 Unauthorized`.
- `GET /api/admin/restaurants` with a valid non-admin token returned
  `403 Forbidden`.
- `GET /api/admin/restaurants` with a valid admin token returned the complete
  moderation list.
- Updating protected system restaurant `Pizza Roma` through
  `PATCH /api/admin/restaurants/1` returned `403 Forbidden`.
- A temporary non-system restaurant was created successfully.
- The temporary restaurant was updated successfully through the admin endpoint.
- The temporary restaurant was deleted successfully through the admin endpoint
  with `204 No Content`.
- A final moderation-list request confirmed that the deleted temporary
  restaurant no longer appeared.

## Web verification

Using an administrator account:

- The Admin workspace exposes Restaurant moderation as an available workflow.
- The moderation panel loads manageable and protected restaurant counts.
- The editor is closed by default.
- Selecting Edit opens the editor only for the selected manageable restaurant.
- Save closes the editor and refreshes the moderation list.
- Cancel closes the editor without saving.
- Delete asks for confirmation, deletes the selected manageable restaurant and
  refreshes the list.
- Protected system catalog entries are hidden by default behind an expandable
  catalog section.
- Protected catalog entries have no edit or delete controls.
- The moderation UI remains readable in light and dark themes.

## Native verification

Using an administrator account:

- The Admin workspace exposes Restaurant moderation as an available workflow.
- The moderation card opens the protected native moderation screen.
- The screen loads manageable and protected restaurant counts.
- The protected catalog is collapsed by default and can be expanded.
- A manageable restaurant can be selected, edited, saved, cancelled and
  deleted.
- Delete requires native confirmation.
- Refresh and pull-to-refresh reload moderation data.
- The screen remains readable in light and dark themes.

## Build verification

- `docker compose build web-server` completed successfully.
- `npx expo export --platform ios` completed successfully.
- `git diff --check` completed successfully.
