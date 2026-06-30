<div dir="ltr" align="left">

<h1>SCRUM-612-613 — Administrator Restaurant Management Verification</h1>

<h2>Scope</h2>

<p>Implemented a dedicated administrator restaurant-management workflow.</p>

<ul>
  <li>
    <code>/management</code> remains a personal workspace:
    <ul>
      <li>Shows only restaurants where the signed-in user is an owner or editor.</li>
      <li>Administrator status alone does not add every platform restaurant to this list.</li>
    </ul>
  </li>

  <li>
    <code>/admin</code> → Restaurant Moderation:
    <ul>
      <li>Shows every restaurant in the database.</li>
      <li>Provides <code>Manage Restaurant</code> for regular and protected catalog restaurants.</li>
      <li>Opens the dedicated route <code>/admin/restaurants/:restaurantId/manage</code>.</li>
    </ul>
  </li>

  <li>
    Administrator management mode:
    <ul>
      <li>Loads one selected restaurant through the administrator API.</li>
      <li>Supports restaurant details, menu items, categories, sales statistics, and team access.</li>
      <li>Does not add the selected restaurant to the administrator's personal workspace.</li>
      <li>Includes navigation back to Restaurant Moderation.</li>
    </ul>
  </li>

  <li>
    Protected catalog restaurants:
    <ul>
      <li>Can be managed by administrators.</li>
      <li>Cannot be deleted.</li>
      <li>Display a deletion-protected indicator.</li>
    </ul>
  </li>

  <li>
    Team access:
    <ul>
      <li>Administrators can add and remove editors.</li>
      <li>Ownership transfer remains owner-only.</li>
      <li>A restaurant cannot be left without at least one team member.</li>
      <li>Deleting a user removes safe editor references and is blocked when that user is the final team member of an ownerless restaurant.</li>
    </ul>
  </li>
</ul>

<h2>Automated Verification</h2>

<p>Commands completed successfully:</p>

<pre><code>git diff --check
node --check web-server/src/controllers/restaurantController.js
node --check web-server/src/controllers/restaurantAccessController.js
node --check web-server/src/controllers/adminRestaurantModerationController.js
node --check web-server/src/controllers/adminUserManagementController.js
node --check web-server/src/repositories/restaurantRepository.js
node --check web-server/src/services/restaurantAccessService.js
npm run build
</code></pre>

<h2>Manual Smoke Verification</h2>

<p>Verified in the browser:</p>

<ul>
  <li>Restaurant Moderation exposes <code>Manage Restaurant</code>.</li>
  <li>Protected catalog restaurants can enter administrator management mode.</li>
  <li>Protected restaurants do not expose the restaurant deletion action.</li>
  <li>The administrator management page exposes the existing restaurant-management tools.</li>
  <li>Team Access is available to the administrator, while <code>Transfer Ownership</code> is not shown.</li>
  <li>Returning to <code>/admin</code> reopens Restaurant Moderation.</li>
  <li>The overall flow appeared correct after rebuilding and running the application.</li>
</ul>

<h2>Expected Permission Behavior</h2>

<table dir="ltr">
  <thead>
    <tr>
      <th align="left">Area</th>
      <th align="left">Owner</th>
      <th align="left">Editor</th>
      <th align="left">Administrator</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Personal <code>/management</code> list</td>
      <td>Own restaurants</td>
      <td>Assigned restaurants</td>
      <td>Only owned or assigned restaurants</td>
    </tr>
    <tr>
      <td>Restaurant details, menu, categories, and statistics</td>
      <td>Yes</td>
      <td>Yes</td>
      <td>Yes, through administrator management mode</td>
    </tr>
    <tr>
      <td>Manage team access</td>
      <td>Yes</td>
      <td>No</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>Transfer ownership</td>
      <td>Yes</td>
      <td>No</td>
      <td>No</td>
    </tr>
    <tr>
      <td>Delete protected restaurant</td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
    </tr>
    <tr>
      <td>Delete regular restaurant</td>
      <td>Yes</td>
      <td>No</td>
      <td>Yes, through administrator management mode</td>
    </tr>
  </tbody>
</table>

</div>
