# Legacy Restaurant Cleanup Candidate Decision

## Source

Candidates were identified through the read-only inventory and then checked with
the guarded dry-run command.

A target is approved only when it is:

- outside the curated catalog;
- not a default restaurant;
- explicitly identified as a test artifact;
- free of historical orders.

## Approved cleanup targets

The following restaurants are approved for cleanup together with their dependent
products and menu categories:

| Restaurant ID | Name | Products | Categories | Orders |
|---|---|---:|---:|---:|
| `mqxldsyz-7swfmbag` | SCRUM 421 Final Analytics Lab 0a55ca26 | 2 | 0 | 0 |
| `mqxlh9o7-wujfmrmr` | SCRUM 421 Empty Analytics Lab e765792d | 0 | 0 | 0 |
| `mqxmiwvz-2nu3erf1` | SCRUM 443 Category Lab fa27b7ae | 0 | 2 | 0 |
| `mqxmtc1w-str5s8ks` | SCRUM 444 Product Category Lab A 1abc2445 | 1 | 2 | 0 |
| `mqxmtc38-6gqgmdu5` | SCRUM 444 Product Category Lab B 1abc2445 | 0 | 1 | 0 |
| `mqxnylds-np07qfl7` | SCRUM 447 Category Order Lab 88cd16e5 | 0 | 3 | 0 |
| `mqxnylf4-2tdg8iyk` | SCRUM 447 Foreign Category Lab 88cd16e5 | 0 | 1 | 0 |
| `mqxp7rq9-5xgsaz5s` | SCRUM 447 Category Edit Lab 8b768002 | 1 | 2 | 0 |
| `mr0etvog-x3kw8jkr` | SCRUM 404 Restaurant 1782809641174 | 1 | 1 | 0 |
| `mr0evpoi-99jtrvye` | SCRUM 404 Restaurant 1782809728266 | 0 | 1 | 0 |
| `mr0gkavm-6jt3c0wm` | SCRUM 404 Restaurant 1782812553811 | 0 | 1 | 0 |
| `mr0go0qp-9qmvamxy` | SCRUM 404 Restaurant 1782812727066 | 0 | 1 | 0 |

## Explicit exclusions

The following apparent test data is deliberately preserved because it has
historical orders:

| Restaurant ID | Name | Orders | Decision |
|---|---|---:|---|
| `mqxlffhe-6i9xyj82` | Product Probe Restaurant d0c4f086 | 1 | Preserve |
| `mqxlh9cv-yya8bdif` | SCRUM 421 Final Analytics Lab e765792d | 3 | Preserve |

The curated catalog, including `Pizza Roma` and all default restaurants, is
protected and excluded from cleanup.

Other owner-managed restaurants are preserved because they are not confirmed
test artifacts through the reviewed inventory output.

## Cleanup scope

For each approved target, cleanup may remove:

- the Restaurant record;
- Products whose `restaurantId` matches the target;
- MenuCategories whose `restaurantId` matches the target.

Cleanup never removes:

- Users;
- Orders;
- Catalog restaurants;
- default restaurants;
- any restaurant with one or more orders.