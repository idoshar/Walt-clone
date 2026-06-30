# SCRUM-458 Legacy Restaurant Data Cleanup Verification

## Goal

Safely identify and remove confirmed legacy restaurant test data while
preserving the curated catalog, user-managed restaurants, users, and immutable
historical orders.

## Inventory baseline

The read-only inventory found:

- 24 restaurants;
- 40 menu categories;
- 48 products;
- 53 orders;
- 78 users.

The curated catalog was complete and internally consistent:

- 6 catalog restaurants;
- 18 catalog categories;
- 36 catalog products.

No orphan products, orphan categories, missing catalog records, or products
with missing category references were found.

## Guarded candidate review

The dry-run command reviewed explicit restaurant IDs only.

- 12 clearly named `SCRUM ...` test restaurants had no historical orders and
  were approved for cleanup.
- 2 apparent test restaurants were excluded because they had historical orders.
- A curated default restaurant (`Pizza Roma`, ID `1`) was correctly blocked by
  the dry-run protection.

## Cleanup execution

The protected cleanup command removed only the approved targets and their
dependent menu data:

- 12 Restaurant records;
- 5 Product records;
- 15 MenuCategory records.

No User records were deleted.

No Order records were deleted.

## Post-cleanup inventory

The follow-up read-only inventory confirmed:

- 12 restaurants;
- 25 menu categories;
- 43 products;
- 53 orders;
- 78 users.

The curated catalog remains complete. No orphan products, orphan categories,
missing catalog records, or products with missing category references remain.

Three pre-existing historical orders that reference a previously removed
restaurant were preserved unchanged. The two reviewed test-like restaurants
with their own historical orders were also preserved.

## Verification

Passed checks:

- `node --check` for the inventory, dry-run, and cleanup scripts.
- `docker compose build web-server`.
- Guarded dry-run with protected catalog and order-history cases.
- Protected destructive cleanup for the 12 approved IDs.
- Post-cleanup read-only inventory.
- `GET /api/health` returned `status: ok`.
- `GET /api/restaurants` returned all catalog IDs `1` through `6`.
- `GET /api/restaurants` no longer returned any of the 12 removed IDs.
- `git diff --check`.

## Result

Confirmed legacy test restaurants and their dependent menu data were removed
without affecting the curated catalog, user-managed restaurants, users, or
historical orders.