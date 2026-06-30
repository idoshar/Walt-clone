# Administrator restaurant moderation policy

## System catalog protection

A restaurant is considered a protected system/catalog restaurant when
`isDefault` is `true`.

Protected system/catalog restaurants:
- Are visible in administrator moderation lists.
- Cannot be edited through administrator moderation.
- Cannot be deleted through administrator moderation.
- Retain sponsorship management through the dedicated sponsorship endpoint.

## Non-system restaurant moderation

A restaurant with `isDefault: false` is a non-system restaurant.

Administrators may:
- View every non-system restaurant, including restaurants that are not public yet.
- Edit restaurant details.
- Delete the restaurant together with its products and menu categories.

Orders are retained because order records include item snapshots.

## Editable fields

Administrator moderation may update:
- name
- address
- phone
- cuisine
- description
- image
- latitude
- longitude

Administrator moderation must not update:
- id
- ownerId
- isDefault
- isSponsored
- sponsoredRank
