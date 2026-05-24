# File Format

This document defines the file format used by the application to persist user watch history.

## File path

The default data file path is:

data/users.txt

## Format overview

Each line represents one user and the products watched by that user.

Format:

user_id:product_id,product_id,product_id

Example:

1:100,101,102
2:100,103
3:104

## Rules

1. Each non-empty line represents exactly one user.
2. The user id appears before the colon.
3. The watched product ids appear after the colon.
4. Product ids are separated by commas.
5. User ids and product ids must be positive integers.
6. Empty lines should be ignored.
7. Spaces around ids, colons, and commas should be ignored by the loader.
8. Duplicate product ids for the same user should be stored only once.
9. If the same user appears in more than one line, the products should be merged.
10. Invalid lines should be ignored silently.

## Valid examples

1:100,101,102
2:200
3:300,301

## Spaces are allowed

The following line is valid:

1 : 100, 101, 102

It should be treated the same as:

1:100,101,102

## Duplicate products

The following line:

1:100,100,101

Should be loaded as:

1:100,101

## Duplicate users

The following file:

1:100,101
1:102,103

Should be loaded as one user:

1:100,101,102,103

## Invalid examples

The following lines are invalid and should be ignored:

abc:100,101
1:abc
1:
:100
-1:100
1:-100
hello world

## Save behavior

When saving data to the file, the application should write one line per user.

Recommended output format:

user_id:product_id,product_id,product_id

Example:

1:100,101,102
2:200,201

## Ordering

To keep the file deterministic and easy to test:

1. Users should be saved by ascending user id.
2. Products should be saved by ascending product id.

Example:

1:100,101,102
2:100,105
5:200

## Notes for implementation tasks

This format is used by:

- SCRUM-20: Save data to file after add
- SCRUM-21: Load data on startup
- SCRUM-26: Test persistence

The format is intentionally simple so it can be implemented with standard C++ file streams and string parsing.
