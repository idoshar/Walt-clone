# SCRUM-542 Cross-Platform Parity Verification

## Goal

Verify that the Web and React Native applications provide consistent customer,
owner, administrator, system-state, and authorization behavior.

## Verification scope

The verification was completed against the current `main` baseline after the
following related work had been merged:

- Curated catalog cleanup and verification support
- Delivery-details and order-history parity
- Native menu, category, and analytics management support

## Customer parity

Verified with the same regular customer account on Web and Native.

| Flow | Web | Native |
|---|---|---|
| Home catalog discovery | Passed | Passed |
| Sponsored content visibility, where available | Passed | Passed |
| Restaurant-name search | Passed | Passed |
| Product-name search | Passed | Passed |
| Restaurant categories and products | Passed | Passed |
| Add product to Cart | Passed | Passed |
| Cart quantity updates | Passed | Passed |
| Cart behavior while changing restaurants | Passed | Passed |
| Manual-address checkout | Passed | Passed |
| Current-location checkout, where available | Passed | Passed |
| Previous Orders and delivery details | Passed | Passed |
| Reorder existing order | Passed | Passed |
| Empty Cart state | Passed | Passed |
| No-results search state | Passed | Passed |
| Logged-out protected-route behavior | Passed | Passed |

## Owner parity

Verified with the same restaurant owner account on Web and Native.

| Flow | Web | Native |
|---|---|---|
| My Restaurants | Passed | Passed |
| Product management | Passed | Passed |
| Category management | Passed | Passed |
| Create temporary category | Passed | Passed |
| Create temporary product | Passed | Passed |
| Product-to-category association | Passed | Passed |
| Draft / Published product state | Passed | Passed |
| Edit product details | Passed | Passed |
| Manage Team Access / Manage team | Passed | Passed |

Cross-platform synchronization was also verified:

1. A temporary category and product were created on Web.
2. Both appeared correctly in Native.
3. The product was edited in Native.
4. The updated data appeared correctly in Web.
5. The temporary product and category were deleted.
6. Their deletion was reflected across both platforms.

No temporary owner-management data remained after verification.

## Administrator parity

Verified with the same administrator account on Web and Native.

| Flow | Web | Native |
|---|---|---|
| Admin dashboard loading | Passed | Passed |
| Restaurant moderation | Passed | Passed |
| User account management | Passed | Passed |
| User search | Passed | Passed |
| Password-reset request area | Passed | Passed |
| Sponsored promotions unavailable state | Passed | Passed |
| Platform insights unavailable state | Passed | Passed |
| Protected administrator access | Passed | Passed |

No unauthorized responses or API errors were encountered.

## System states and authorization

Verified on both platforms:

- Light and Dark themes remain readable on customer, owner, and administrator
  screens.
- Theme selection remains applied while navigating and after reopening the app.
- Empty Cart, no-search-results, and empty-order states render clearly.
- Customer accounts cannot access owner-management or administrator flows.
- Owner accounts cannot access administrator flows unless separately assigned
  administrator permissions.
- Logged-out users are blocked from protected customer, owner, and
  administrator workflows.
- Rapid navigation and refresh behavior did not leave screens stuck in loading
  states or display blank screens.
- Cart changes refresh correctly after navigation and reopening the relevant
  screen.

## Result

No functional Web-to-Native parity differences were found during verification.

Any separately identified UI or product improvements are intentionally outside
the scope of this verification task and should be tracked through dedicated
implementation issues.