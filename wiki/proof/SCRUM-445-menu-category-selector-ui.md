# SCRUM-445 Menu Category Selector UI

## Goal

Allow restaurant owners to assign each menu item to a real restaurant category
through the management interface.

## Implementation

- Added a menu-category API client for:
  - loading restaurant menu categories;
  - creating a new restaurant menu category.
- Updated the product form to require a category selection before saving.
- Added an inline category-creation flow directly inside the product form.
- A newly created category is selected automatically for the current product.
- Category names displayed in the product selector are clean and readable.
- Added a dedicated empty state when the restaurant has no categories:
  - no empty category dropdown is shown;
  - the owner is instructed to create a category first;
  - a prominent Create category button is displayed.
- The category dropdown is shown only after at least one category exists.
- Added category badges to menu items in the restaurant management view.
- Added responsive styling for the selector, empty state, and inline category form.

## Verification

### Build verification

Ran:

`npm --prefix .\client run build`

Result:

- Vite production build completed successfully.

### Browser verification

Verified the management flow in the running Docker application:

- Opening Add Menu Item for a restaurant without categories displays the
  category empty state instead of a blank dropdown.
- The Create category action opens the inline category form.
- Creating a category selects it automatically for the current product.
- A product can be saved with the selected category.
- The saved product displays the category badge in Manage Menu.
- Editing an existing product keeps its category selected.
- Restaurants with existing categories display a normal category dropdown.
- The dropdown displays category names without malformed separator characters.
- The category creation layout remains readable in the management modal.

## Result

Restaurant owners can now create reusable categories and assign them to menu
items without leaving the product-management workflow.