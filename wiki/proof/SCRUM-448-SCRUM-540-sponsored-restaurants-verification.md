# Sponsored restaurant promotions — verification

## Scope
- SCRUM-448: Sponsored restaurant rails on the web home page.
- SCRUM-540: Sponsored restaurant card on the mobile home screen.
- Backend preparation for future admin sponsorship management.

## Verified
- Docker build for the web server completed successfully.
- The health endpoint returned status ok.
- Public restaurant data returns isSponsored and sponsoredRank.
- Web sponsored rails display real restaurants and open the correct restaurant page.
- Mobile sponsored card displays real restaurants and opens the correct RestaurantDetails screen.
- Rotation controls, indicators, Pause, and Resume were tested manually.
- JavaScript syntax checks passed.
- git diff --check passed.

## Sponsorship foundation
- Restaurant fields: isSponsored and sponsoredRank.
- Future admin-only endpoints:
  - GET /api/admin/restaurants
  - PATCH /api/admin/restaurants/:id/sponsorship
