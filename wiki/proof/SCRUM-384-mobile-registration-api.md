# SCRUM-384 Mobile Registration API Integration

## Goal

Connect the mobile registration form to the user-registration API and display useful backend errors.

## Implementation

- Sends username, password, full name, phone, address, and optional profile image to `POST /api/users`.
- Converts the selected profile image into a Data URL before registration.
- Preserves the selected image preview locally while submitting.
- Adds a 5 MB JSON request limit in the Express server so profile-image registration payloads can be accepted.
- Maps HTTP 409 duplicate-username responses to an inline Username field error.
- Displays other API or server validation failures as readable form feedback.
- Keeps automatic sign-in after successful registration through the existing AuthContext flow.

## Verification plan

1. Register a new user with no image and confirm automatic sign-in.
2. Register a new user with an image selected from gallery or camera and confirm automatic sign-in.
3. Verify in MongoDB that the created user has a non-empty `image` field.
4. Attempt to register the same username again and confirm the inline duplicate-username error.
5. Verify the mobile web export succeeds.
