# SCRUM-386 Mobile Home Restaurants

## Goal

Replace the mobile Home screen sample data with dynamic restaurant data from the backend.

## Implementation

- Added a dedicated mobile restaurant API module for `GET /api/restaurants`.
- Replaced hard-coded sample restaurants with backend restaurant data.
- Added dynamic cuisine categories and category filtering.
- Added manual Refresh and native pull-to-refresh.
- Added loading, empty-list and API-error states.
- Preserved location permission handling and uses it to sort the visible restaurant list by distance.
- Displays restaurant name, cuisine, description, address, optional image and optional distance.
- Replaced the category horizontal scroll layout with a wrapping row to prevent stretched category buttons and excessive vertical spacing.

## Verification completed

- Confirmed `GET /api/restaurants` returns Pizza Roma, Burger House, and Sushi Bar.
- Confirmed the mobile Home screen renders the same backend restaurants.
- Confirmed All, American, Italian, and Japanese category filters update the visible list correctly.
- Confirmed the Refresh button and pull-to-refresh reload restaurant data.
- Confirmed location sorting works or displays clear permission feedback.
- Confirmed stopping the web server displays the error state and restoring it allows Retry to reload restaurants.
- Confirmed the mobile web export completes successfully.
