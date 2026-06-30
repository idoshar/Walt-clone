# SCRUM-382 Mobile Registration Form Validation

## Goal

Add client-side validation to the mobile registration form before the registration request is sent.

## Implemented validation

- Username is required and must contain at least 3 characters.
- Full name is required and must contain at least 2 characters.
- Phone is required.
- Phone must be a valid Israeli mobile-format number: exactly 10 digits and starts with `0`.
- Address is required.
- Password is required and must contain at least 8 characters.
- Password must contain at least one letter and one number.
- Password confirmation is required.
- Password confirmation must exactly match the password.
- Invalid fields receive their own visible validation message and red border.
- The registration request is not sent while local validation fails.
- Editing a field clears that field's validation error.
- Pressing Enter while focused in a form field triggers the same validation and submit flow as the Create account button.

## Manual verification completed

1. Submitted an empty form and confirmed validation feedback appears for every required field.
2. Entered a short username and confirmed the username-length message.
3. Entered an invalid Israeli phone number and confirmed the phone validation message.
4. Entered a password shorter than 8 characters and confirmed the password-length message.
5. Entered passwords containing only letters or only numbers and confirmed the password-rules message.
6. Entered mismatched passwords and confirmed the mismatch message.
7. Entered valid values for all fields and confirmed registration reaches the existing API flow.
8. Verified the same validation flow works in Expo Web and Expo Go on a physical phone.

## Final evidence

Screenshots will be collected as part of the final end-to-end project verification before submission.
