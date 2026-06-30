<div dir="ltr" align="left">

<h1>Web Polish Batch Verification</h1>

<h2>Scope</h2>

<ul>
  <li>
    <strong>Sponsored promotions:</strong>
    administrators can add, remove, and reorder sponsored restaurants.
    The customer-facing promotion area rotates automatically through all sponsored restaurants.
  </li>

  <li>
    <strong>No-sponsor state:</strong>
    when no sponsored restaurants are configured, the homepage shows
    placement-style cards inviting restaurants to contact the site administration.
  </li>

  <li>
    <strong>Profile and credentials:</strong>
    users can update profile details and open a dedicated change-password page.
  </li>

  <li>
    <strong>Registration:</strong>
    Web registration collects phone number and address instead of sending placeholder values.
  </li>

  <li>
    <strong>Header and currency selector:</strong>
    navigation remains usable at increased browser zoom, and the currency selector was updated.
  </li>

  <li>
    <strong>Admin moderation:</strong>
    selecting <code>Manage Restaurant</code> opens the restaurant action modal directly above Restaurant Moderation.
  </li>

  <li>
    <strong>Content cleanup:</strong>
    removed obsolete demo, availability, and coming-soon wording from the relevant administrator and promotion screens.
  </li>

  <li>
    <strong>Administrator deletion protection:</strong>
    attempting to delete an administrator now shows a clear explanation instead
    of silently disabling the action. The server continues to reject direct
    administrator-deletion requests.
  </li>
</ul>

<h2>Automated Verification</h2>

<pre><code>git diff --check
node --check web-server/src/controllers/adminSponsorshipController.js
node --check web-server/src/controllers/userController.js
node --check web-server/src/services/userService.js
node --check web-server/src/repositories/restaurantRepository.js
node --check web-server/src/routes/adminRoutes.js
node --check web-server/src/routes/userRoutes.js
npm run build
</code></pre>

<h2>Manual Smoke Verification</h2>

<ul>
  <li>Sponsored restaurants can be added, removed, and reordered.</li>
  <li>Sponsored placement rotates automatically and supports more than three restaurants.</li>
  <li>The empty sponsored-placement state is rendered as a placement card beside the homepage content.</li>
  <li>Profile editing and Change Password navigation work without a not-found route.</li>
  <li>Header search remains accessible at 125% and 150% browser zoom.</li>
  <li>Admin restaurant moderation opens the management modal directly without an intermediate page.</li>
  <li>Long restaurant addresses no longer push promotion controls onto a second line.</li>
  <li>Attempting to delete an administrator shows an explanatory message without deleting the account.</li>
</ul>

<h2>Known Follow-up</h2>

<p>
  Web-side product image fallback was improved in this batch.
  Native image-fallback parity remains part of the separate cross-platform follow-up.
</p>

</div>
