# Legacy Restaurant Cleanup Rules

## Purpose

These rules define how legacy restaurant test data can be identified and removed
without affecting the curated catalog, user-managed restaurants, or historical
order records.

## Protected records

The following records are never cleanup targets:

- Any restaurant whose ID belongs to the curated catalog.
- Any restaurant with `isDefault: true`.
- Any restaurant that is not explicitly provided to the cleanup command.
- Any restaurant selected only because it is not part of the curated catalog.
- Historical orders, including orders whose restaurant no longer exists.

## Candidate identification

A restaurant can be considered for manual cleanup only when all of the following
are true:

1. It is not part of the curated catalog.
2. It is not marked as a default restaurant.
3. Its ID was explicitly reviewed in the inventory output and supplied to the
   dry-run command.
4. Its name and creation context clearly identify it as a test artifact.
5. The dry-run output has been reviewed before any destructive command is used.

The current inventory contains clearly labelled test artifacts such as:

- `SCRUM 404 Restaurant ...`
- `SCRUM 421 ...`
- `SCRUM 443 ...`
- `SCRUM 444 ...`
- `SCRUM 447 ...`

A name is evidence for review only. It is never enough by itself to delete a
restaurant automatically.

## Dependency policy

### Products and menu categories

Products and menu categories belonging to an approved cleanup restaurant are
treated as dependent restaurant data. They may be removed together with that
restaurant only after dry-run review.

### Orders

Orders are immutable historical snapshots and are not deleted automatically.

A restaurant with one or more orders is reported as requiring order-history
review. It must not be removed by the standard cleanup path until there is an
explicit decision that preserving its order snapshots without a current
restaurant is acceptable.

Existing historical orders that already reference removed restaurants are kept
unchanged.

## Execution safeguards

- Cleanup is always based on explicit restaurant IDs.
- The dry-run command performs no writes.
- Default and curated-catalog restaurants are blocked by the dry-run command.
- A target with order history is blocked from the standard cleanup path.
- The final destructive command must re-check all dependencies immediately
  before deletion.
- Every execution must be documented with before/after inventory output.

## Current inventory conclusion

The curated catalog is complete and internally consistent.

Potential legacy test restaurants must be reviewed by explicit ID. User-managed
restaurants that are merely outside the catalog are preserved unless separately
approved for cleanup.
