# SCRUM-377 C++ Recommendation Bridge Persistence and Restart Verification

## Goal

Verify that the Node.js to C++ recommendation bridge continues to work after service restarts and that recommendation history persists across Docker Compose recreation.

## Implementation

- Added a named Docker volume for the C++ recommendation server:
  - `ex2-data:/app/data`
- The C++ server persists watched-product data in:
  - `/app/data/users.txt`
- The existing C++ persistence flow loads this file when the server starts and saves it after POST, PATCH, and DELETE commands.

## Validation

### Numeric recommendation IDs

Verified that MongoDB users and products use persistent numeric recommendation IDs.

Test users created during verification:

- User A: `recommendation-a-20260627143759`
  - recommendationId: `3`
- User B: `recommendation-b-20260627143759`
  - recommendationId: `4`

Pizza Roma products used:

- Margherita Pizza: recommendationId `1`
- Pasta Alfredo: recommendationId `2`

### Recommendation scenario

1. User B viewed Margherita Pizza and Pasta Alfredo.
2. User A requested recommendations for Margherita Pizza.
3. The API returned Pasta Alfredo with recommendationId `2`.

### Restart verification

The same Pasta Alfredo recommendation was returned:

- before restart;
- after restarting `web-server`;
- after `docker compose down` followed by `docker compose up -d`, without `-v`.

### Persisted C++ data

After the full Docker Compose restart, `/app/data/users.txt` contained:

    3:1
    4:1,2

This confirms that watched-product history is stored in the `ex2-data` named volume and is restored by the C++ server after container recreation.

## Important note

`docker compose down -v` intentionally removes named volumes, including recommendation history. Normal `docker compose down` does not remove the volume.
