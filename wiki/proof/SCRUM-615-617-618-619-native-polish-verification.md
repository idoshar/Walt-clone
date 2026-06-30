<div dir="ltr" align="left">

<h1>SCRUM-615-617-618-619 — Native Polish Verification</h1>

<h2>Scope</h2>

<ul>
  <li>
    <strong>SCRUM-615 — Product image fallback:</strong>
    Native product views now show a fallback image when a product has no image
    URL or when the configured image URL fails to load.
  </li>

  <li>
    <strong>SCRUM-617 — Cart access from Home:</strong>
    Added Cart access on the Native home screen, including an item-count badge.
  </li>

  <li>
    <strong>SCRUM-618 — Theme toggle availability:</strong>
    Theme controls are available consistently across the Native application,
    including navigation-header screens and standalone screens.
  </li>

  <li>
    <strong>SCRUM-619 — Theme-toggle indicators:</strong>
    The toggle indicates the theme that will be activated:
    <code>🌙 Dark</code> in Light Mode and <code>☀️ Light</code> in Dark Mode.
  </li>
</ul>

<h2>Additional Cart Readability Fix</h2>

<ul>
  <li>Cart button text remains white in Dark Mode.</li>
  <li>The item-count badge uses a white background with primary-colored text in both themes.</li>
</ul>

<h2>Automated Verification</h2>

<pre><code>git diff --check
npx expo export --platform web
</code></pre>

<h2>Manual Smoke Verification</h2>

<ul>
  <li>Products without an image display a Native fallback instead of a broken or empty image area.</li>
  <li>Products with invalid image URLs fall back gracefully.</li>
  <li>Cart is reachable from Home and shows the current item count.</li>
  <li>Cart text and badge remain readable in Light and Dark Mode.</li>
  <li>Theme controls are reachable across the tested Native screens.</li>
  <li>Theme toggle labels match the destination theme.</li>
</ul>

</div>
