# SCRUM-383 Mobile Profile Image Picker

## Goal

Allow a user to select a profile image through the gallery or camera before registration.

## Implementation

- Added `expo-image-picker`.
- Added gallery selection with media-library permission handling.
- Added camera capture with camera permission handling.
- Added an image preview and selected-image filename.
- Added an option to remove the selected image.
- Added readable feedback for denied permissions, invalid picker results, and unexpected picker failures.
- Clicking the profile-image circle opens a source-selection menu.
- Expo Web supports selecting an image file from the computer.
- Expo Go on a physical phone supports choosing an image from the gallery or taking a new photo with the camera.

## Scope boundary

This issue handles image selection, preview, permissions, and user feedback. Uploading or persisting the selected image through the registration API remains part of SCRUM-384.

## Manual verification completed

1. Opened the image-source menu from the Add photo circle.
2. Selected an image from the computer in Expo Web and confirmed it appears in the preview.
3. Selected an image from the phone gallery in Expo Go and confirmed it appears in the preview.
4. Opened the phone camera through Expo Go, captured an image, and confirmed it appears in the preview.
5. Removed a selected image and confirmed the placeholder returns.
6. Verified that denied gallery or camera permission produces readable feedback.

## Final evidence

Screenshots will be collected as part of the final end-to-end project verification before submission.
