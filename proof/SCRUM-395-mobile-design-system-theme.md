# SCRUM-395 Mobile Design System and Theme Support

## Goal

Create a reusable Wolt-inspired mobile design system and apply it to the currently available mobile screens.

## Implementation

- Added a shared theme system with light and dark color palettes.
- Added persistent theme selection using AsyncStorage.
- Added reusable `AppButton`, `AppCard`, `AppState`, and `ThemeToggle` components.
- Applied theme-aware navigation colors and headers.
- Updated Login, Register, Home, and Admin screens to use the shared visual language.
- Applied the design system to the dynamic restaurant Home screen from SCRUM-386.
- Added theme-aware restaurant cards, cuisine chips, location panel, loading state, empty state, and retry/error state.
- Preserved existing backend API integration, cuisine filters, refresh behavior, location sorting, and admin access behavior.

## Verification completed

- Confirmed Light and Dark themes work in Login, Register, Home, and Admin screens.
- Confirmed theme selection persists after closing and reopening the application.
- Confirmed the Register screen includes its own Theme Toggle and remains readable in both themes.
- Confirmed the Home screen loads Pizza Roma, Burger House, and Sushi Bar from the backend.
- Confirmed All, American, Italian, and Japanese cuisine filters update the visible restaurant list correctly.
- Confirmed Refresh and pull-to-refresh reload restaurants.
- Confirmed device location sorting works and displays restaurant distances.
- Confirmed the admin-only Home button opens the Admin screen for a user with role `admin`.
- Confirmed Sign out returns to the Login screen.
- Confirmed `npx expo-doctor` passed 18/18 checks.
- Confirmed `npx expo export --platform web` completed successfully.
