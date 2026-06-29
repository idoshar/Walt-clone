# SCRUM-403 — Admin Statistics Dashboard State Tests

This document verifies the mobile admin statistics dashboard behaves correctly in all five required states: **admin**, **non-admin**, **loading**, **empty**, and **server-error**.

The dashboard screen is `mobile/src/screens/AdminStatisticsScreen.js`, reached from the Admin workspace → "Platform insights".

---

## State 1 — Admin (happy path)

**Setup:** Log in as an admin user (the seeded `admin` account).

**Steps:**
1. From the Home screen, tap **Admin**.
2. Tap **Platform insights**.

**Expected:**
- Six metric cards render: Users, Restaurants, Menu items, Orders, Total revenue, Average order.
- Order status breakdown shows a row per status with counts.
- Pull-to-refresh and the Refresh button reload the data.

**Result:** Pass — all metrics and the status breakdown display with live values.

---

## State 2 — Non-admin (access restricted)

**Setup:** Log in as a regular (non-admin) user.

**Steps:**
1. Navigate to the AdminStatistics screen (e.g. via deep link or by temporarily exposing the route).

**Expected:**
- The screen shows **"Access restricted — This dashboard is available to administrators only."**
- No API call to `/admin/statistics` is made.

**Result:** Pass — non-admin users see the access-restricted message and the API is never called.

---

## State 3 — Loading

**Setup:** Admin user, throttle the network (or observe on first open).

**Steps:**
1. Open Platform insights.

**Expected:**
- A centered spinner with "Loading platform insights..." appears while the request is in flight.
- Once the response arrives, the spinner is replaced by the dashboard.

**Result:** Pass — spinner shows during the request, then content renders.

---

## State 4 — Empty (no orders yet)

**Setup:** Fresh database with no orders placed (or before any checkout).

**Steps:**
1. Open Platform insights as admin.

**Expected:**
- Metric cards still render (zeros where appropriate).
- The Order status breakdown shows the empty state: **"No orders yet — Status distribution will appear after customers place orders."**

**Result:**  Pass — empty order state is handled gracefully without errors.

---

## State 5 — Server error

**Setup:** Admin user, but the API/recommendation service is unreachable (e.g. stop the web-server container, or disconnect network).

**Steps:**
1. Open Platform insights.

**Expected:**
- A centered error state: **"Could not load platform insights"** with the error message and a **Try again** button.
- Tapping **Try again** re-attempts the request.
- If an error occurs during a refresh (while data is already shown), an inline error box appears above the metrics instead of replacing the whole screen.

**Result:** Pass — full-screen error with retry on first load; inline error on refresh.

---

## Summary

| State | Handling | Result 
|---|---|---|
| Admin | Full dashboard with metrics + status breakdown 
| Non-admin | Access restricted message, no API call 
| Loading | Centered spinner 
| Empty | "No orders yet" empty state 
| Server error | Full-screen error + retry; inline error on refresh 

All five required states are handled and verified.