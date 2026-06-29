# SCRUM-587 / SCRUM-592 Verification

## Implemented
- Protected `PATCH /api/users/me/image`.
- Web Profile page and clickable Header account area.
- Native Profile screen and clickable Home account card.
- Image update/removal persists in Web local storage and Native AsyncStorage.

## Automated checks
- `node tests/scrum-488-credential-lifecycle.test.js`
  - Result: 6 passed, 0 failed.
- `node tests/scrum-587-592-profile-image.test.js`
  - Result: 7 passed, 0 failed.
- `npm --prefix client run build`
  - Result: passed.
- `npx expo export --platform ios`
  - Result: passed.

## Manual checks
- Web: open Profile, save image, Header updates, remove image.
- Native: choose camera/gallery image, save, Home updates, remove image.
- Native persistence verified after sign out and sign in.
