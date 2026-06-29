# Curated restaurant catalog — verification

## Scope

- SCRUM-456: Canonical restaurant catalog and content rules.
- SCRUM-457: Idempotent seeded restaurant catalog.

## Catalog rules

- Six default restaurants with balanced cuisines:
  Italian, American, Japanese, Middle Eastern, Healthy, and Indian.
- Every restaurant has a public name, address, phone, cuisine, description,
  coordinates, and image mapping.
- Every restaurant has three ordered menu categories and six menu items.
- Products use stable category IDs that point to existing categories.
- Seeded restaurant, category, and product IDs are stable across restarts.

## Verification

- API returns 6 restaurants.
- API returns 18 menu categories and 36 products in total.
- Each restaurant has 3 categories and 6 products.
- Every product categoryId references a category belonging to the same restaurant.
- Re-running the web server seed keeps the catalog at 6 restaurants,
  18 categories, and 36 products without duplicates.
- Catalog images were checked in both web and mobile flows.
- JavaScript syntax checks passed for all updated seed files.
- git diff --check passed.
