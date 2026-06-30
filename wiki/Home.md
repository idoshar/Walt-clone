# Wolt Clone — Project Wiki

A full-stack food delivery platform inspired by Wolt, built for the Advanced Web Development course (Exercise 5). The system includes a **React web client**, a **React Native mobile app**, a **Node.js/Express REST API**, a **C++ collaborative-filtering recommendation server**, and **MongoDB** for persistence — all orchestrated via **Docker Compose**.

---

## Wiki Pages

| Page | Description |
|---|---|
| [System Architecture](System-Architecture.md) | Component diagram, data flow, folder structure |
| [Run Instructions](Run-Instructions.md) | Docker Compose setup, environment variables, launching web and mobile clients |
| [Web Client Flows](Web-Client-Flows.md) | Registration, login, browsing, ordering, management — in the browser |
| [Mobile App Flows](Mobile-App-Flows.md) | The same flows on the React Native app |
| [Admin Features](Admin-Features.md) | Admin dashboard, user management, restaurant moderation, sponsored ads, password resets |
| [Extended Features](Extended-Features.md) | Multi-currency, menu categories, restaurant access/roles, statistics, responsive design, and more |

---

## Components at a Glance

| Component | Technology | Port | Role |
|---|---|---|---|
| Web client | React + Vite | served on 3000 | Browser UI |
| Mobile client | React Native (Expo) | Expo dev server | Phone UI |
| API server | Node.js + Express | 3000 | REST API + business logic |
| Recommendation server | C++ TCP | 8080 (internal) | Collaborative filtering |
| Database | MongoDB 7.0 | 27017 (internal) | Persistence |

---

## Key Features Summary

1. Multi-currency support (ILS, USD, EUR, GBP) with real-time price conversion
2. Sponsored restaurant promotions on the home page with admin-managed placement
3. Auto-rotating restaurant carousels (recommended and general)
4. Menu category management with custom ordering of categories and products
5. Enhanced checkout with delivery address, phone, notes, and diner count
6. Detailed order view with Reorder functionality (adds items back to cart)
7. Full admin workspace: users, restaurants, ads, statistics, password resets
8. Restaurant access roles: Owner, Editor, Admin — with team management and ownership transfer
9. Admin full restaurant management: details, products, categories, stats, team
10. System restaurant protection (admin can manage but not delete)
11. Post-registration profile editing (name, phone, address) and password change
12. Forgot password flow: user requests reset, admin issues temporary password
13. Restaurant owner sales statistics: orders, revenue, averages, top product
14. Light Mode and Dark Mode across both web and mobile
15. Broken/missing image fallback handling throughout the UI
16. Responsive design: mobile-friendly, zoom-safe, long-text handling
17. Full MongoDB persistence with Docker Compose orchestration
18. React Native app with complete client and management features