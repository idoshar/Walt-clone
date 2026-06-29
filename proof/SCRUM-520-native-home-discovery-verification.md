# Native home discovery parity — verification

## Scope
- Native Featured restaurants discovery section.
- Native Nearby restaurants discovery section based on user location.
- Horizontal restaurant carousels using live backend restaurant data.

## Implementation verification
- Featured restaurants are selected dynamically from available restaurants.
- Featured selection follows the same deterministic ordering logic used by the web application.
- Featured cards show restaurant image fallback, name, and cuisine.
- Tapping a Featured or Nearby card opens the matching restaurant details screen.
- Nearby restaurants are shown only after location is available.
- Nearby restaurants are sorted by distance and display distance labels.
- Cuisine filtering continues to affect the main restaurant list and Nearby results.
- Existing restaurant list, Refresh action, pull-to-refresh, loading, empty, and error states remain available.

## Manual verification
- Featured carousel rendered successfully with live restaurant data.
- Horizontal carousel interaction and restaurant navigation were tested.
- Location permission flow was tested.
- Nearby carousel appeared after location became available.
- Nearby distance labels and cuisine filtering were checked.
- Home screen layout was reviewed in the app.

## Technical verification
- `npx expo export --platform ios` completed successfully.
- `git diff --check` passed.
