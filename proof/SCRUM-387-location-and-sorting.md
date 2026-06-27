# SCRUM-387 Mobile Location and Nearby Restaurant Sorting

## Implemented functionality

- Added foreground location permission support with `expo-location`.
- Added a reusable location service that:
  - Requests foreground location permission.
  - Retrieves the current device location.
  - Handles denied permission, unavailable location, timeout, and unexpected errors.
  - Falls back to the last known device location when available.
- Added a reusable Haversine distance calculation utility.
- Added restaurant sorting from nearest to farthest based on latitude and longitude.
- Restaurants without valid coordinates are safely placed after restaurants with known distances.

## Physical-device verification

The feature was tested successfully with Expo Go on a physical device.

Verified results:
- The device returned current coordinates successfully.
- The app displayed `Location ready`.
- Nearby restaurants were sorted by calculated distance.
- A restaurant without coordinates was displayed last with `Distance unavailable`.
- The app remained connected to the Docker-hosted backend API during the test.

## Emulator verification

The Android emulator displayed and handled the location permission request correctly. Its location provider did not return a usable position after GPS injection, so the application displayed a controlled `Location unavailable` state instead of remaining stuck or crashing.
