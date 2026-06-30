# SCRUM-459 Curated Catalog Flow Verification

## Goal

Verify that the curated restaurant catalog remains complete, searchable, and
usable across customer, owner, and administrator flows after legacy test-data
cleanup.

## Automated catalog API audit

The catalog audit passed against the running application.

Validated catalog restaurants:

| ID | Restaurant | Categories | Products | Restaurant search | Product search |
|---|---|---:|---:|---|---|
| 1 | Pizza Roma | 3 | 6 | Passed | Passed |
| 2 | Burger House | 3 | 6 | Passed | Passed |
| 3 | Sushi Bar | 3 | 6 | Passed | Passed |
| 4 | Levant Kitchen | 3 | 6 | Passed | Passed |
| 5 | Green Bowl | 3 | 6 | Passed | Passed |
| 6 | Bombay Spice | 3 | 6 | Passed | Passed |

Additional API checks:

- `GET /api/health` returned `status: ok`.
- Each catalog restaurant appeared exactly once in `GET /api/restaurants`.
- Each catalog product referenced an existing category of its restaurant.
- No duplicate restaurant IDs appeared in the public restaurant response.
- The public restaurant response contained 12 restaurants at verification time.
- No publicly returned restaurant had zero products.

## Web customer verification

Verified with a regular customer account:

- Curated restaurants can be located through Home and Search.
- Multiple catalog restaurant menus load with categories and products.
- A Pizza Roma product can be added to Cart.
- Manual-address checkout completes successfully.
- The resulting order appears in previous orders with delivery details.
- Product search leads to the correct catalog restaurant and product.

## Native customer verification

Verified with a regular customer account:

- Curated restaurants can be found through Home and Search.
- Multiple catalog restaurant menus load with categories and products.
- Cart and manual-address checkout complete successfully.
- Previous orders display saved delivery details.
- Product search leads to the expected catalog restaurant and product.
- No empty restaurant appeared in customer-facing discovery or search.

## Owner and administrator verification

Verified as a restaurant owner:

- My Restaurants loads correctly.
- Product management and category management load correctly.
- A temporary category and product could be created, edited, and deleted.
- Manage Team Access / Manage team loads.

Verified as an administrator:

- Restaurant moderation loads.
- User accounts and password-reset request management load.
- Sponsored promotions and platform insights show a clear Coming soon state.
- No unauthorized or API error was encountered.

## Empty-restaurant visibility rule

A temporary empty restaurant named `SCRUM-459 Empty Restaurant` was created
without categories or products.

Verified behavior:

- The owner could see and manage it through My Restaurants.
- A customer could not find it in public restaurant discovery or search.
- The temporary restaurant was deleted after verification.

## Follow-up UX observation

The Admin workspace currently renders its available tool panels by default, and
clicking the four tool cards does not switch or collapse the active panel.

This does not block catalog verification, but it should be addressed through a
separate Admin workspace interaction task.

## Result

The curated catalog is complete and usable across Web and Native customer
flows. Owner and administrator catalog-management flows load correctly, and
empty restaurants are hidden from customer-facing discovery while remaining
manageable by their owner.