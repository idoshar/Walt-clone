# Exercise 5 - Wolt Clone

A full-stack food-delivery platform inspired by Wolt, developed as **Exercise 5** for the *Advanced Systems Programming* course.

The project extends the previous exercises into one integrated system:

- A **React web client** for browser-based use.
- A **React Native mobile app** built with Expo.
- A **Node.js + Express REST API**.
- A **MongoDB** database for persistent application data.
- A **C++ TCP recommendation server** from the earlier exercises.
- **Docker Compose** orchestration for the backend services and web client.

The system is designed as a complete application rather than a collection of disconnected screens: users receive clear feedback for invalid input, authentication failures, authorization errors, empty states, loading states, and failed requests.

> **Important:** Use only fictional test data. Do not commit `.env` files, real passwords, personal information, API keys, tokens, or `node_modules`.

---

## Table of Contents

- [Course Requirements Addressed](#course-requirements-addressed)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Main Features](#main-features)
- [Prerequisites](#prerequisites)
- [Run the Complete System](#run-the-complete-system)
- [Run the Mobile App](#run-the-mobile-app)
- [Verification and Testing](#verification-and-testing)
- [Project Structure](#project-structure)
- [Persistence and Resetting Local Data](#persistence-and-resetting-local-data)
- [Project Wiki](#project-wiki)
- [Development Workflow](#development-workflow)
- [Submission Notes](#submission-notes)
- [Troubleshooting](#troubleshooting)

---

## Course Requirements Addressed

This repository implements the Exercise 5 requirements:

- A React Native application that uses **real, dynamic data** from the same backend as the web application.
- Full MongoDB persistence instead of in-memory arrays for users, restaurants, products, orders, categories, access roles, promotions, and password-reset requests.
- Registration and login validation, including clear user-facing error messages.
- Registration profile-image selection from the phone gallery or camera, image preview, and password confirmation.
- Restaurant, menu-item, and order workflows across the web and mobile clients.
- A dedicated `wiki/` directory documenting architecture, startup, and core application flows.
- Ongoing Jira-based Scrum work with feature branches, Pull Requests, reviews, task status updates, and dependency tracking.

---

## Architecture

```text
┌────────────────────┐           ┌────────────────────────┐
│   React Web Client │           │ React Native / Expo App │
│   Browser UI       │           │ Phone UI               │
└─────────┬──────────┘           └──────────┬─────────────┘
          │ HTTP / JSON                     │ HTTP / JSON
          └─────────────────┬───────────────┘
                            │
                 ┌──────────▼──────────┐
                 │ Node.js + Express   │
                 │ REST API / MVC      │
                 └───────┬────────┬────┘
                         │        │
                  Mongoose│        │ TCP text protocol
                         │        │
                ┌────────▼───┐ ┌──▼────────────────────┐
                │ MongoDB 7  │ │ C++ Recommendation    │
                │ Persistence│ │ Server                │
                └────────────┘ └───────────────────────┘
```

Docker Compose runs the MongoDB database, C++ recommendation service, Node.js API, and production React web client together. The React Native client runs through Expo and connects to the same API over the local network.

---

## Technologies

| Area | Technology |
|---|---|
| Web client | React, React Router, Vite |
| Mobile client | React Native, Expo, React Navigation |
| API server | Node.js, Express |
| Data persistence | MongoDB 7, Mongoose |
| Recommendation engine | C++17, TCP sockets |
| Authentication | JWT and bcrypt password hashing |
| Containerization | Docker, Docker Compose |
| Project management | Jira, GitHub, Pull Requests |

---

## Main Features

### Authentication and User Accounts

- Registration with required-field validation and clear inline feedback.
- Password rules, password confirmation, and prevention of invalid submissions.
- Login validation and clear handling of incorrect credentials.
- JWT-based authenticated API access.
- Logout that clears the active session and returns the user to the login screen.
- Profile editing for full name, phone number, address, and profile image.
- Gallery/camera image selection in the mobile registration and profile flows.
- Forgot-password request flow with administrator-issued temporary passwords.
- Change-password screen for authenticated users.

### Restaurant Discovery and Search

- Dynamic restaurant catalog loaded from the API.
- Restaurant details pages/screens with menu items, images, descriptions, prices, and category filters.
- Search for restaurants and dishes.
- Restaurant carousels and sponsored restaurant promotion rail.
- Browser/mobile location support for nearby restaurant sorting.
- Light mode and dark mode.
- Multi-currency display for ILS, USD, EUR, and GBP.
- Loading, empty, and error states throughout the browsing experience.
- Fallback placeholders for missing or broken restaurant and product images.

### Cart, Recommendations, Checkout, and Orders

- Add items to the cart, edit quantities, remove items, and clear the cart.
- Products grouped by restaurant.
- Product recommendations supplied by the C++ collaborative-filtering service.
- Category-based recommendation fallback when no recommendation history exists.
- Checkout with delivery address, phone, diner count, notes, price summary, and confirmation.
- Order history with detailed items, delivery data, total, and status.
- Order cancellation and deletion rules with authorization checks.
- Reorder flow that restores a previous order to the cart.
- Server-side validation and price calculation for order creation.

### Restaurant and Menu Management

- Create, edit, and delete restaurants.
- Create, edit, delete, publish, and manage menu products.
- Restaurant ownership and editor access roles.
- Menu-category CRUD and category ordering.
- Restaurant team management and ownership transfer.
- Sales statistics for restaurant owners/editors: orders, revenue, average order value, and top product.
- Server-side authorization prevents unauthorized management actions.

### Administrator Workspace

The system includes extra administrator features in both clients:

- Platform statistics dashboard.
- User management: view users, enable/disable, delete, assign roles, and reset passwords.
- Restaurant moderation for all restaurants.
- Sponsored restaurant management.
- Password-reset request review.
- Protection against deleting default system/catalog restaurants.

---

## Prerequisites

Install the following before running the project:

- **Docker Desktop** with Docker Compose v2, running locally.
- **Node.js 20+** and npm for the React Native / Expo application.
- **Expo Go** on an Android or iOS device for physical-device testing.
- A phone and computer connected to the **same Wi-Fi network** when using Expo Go.
- Optional for local C++ testing: a C++17 compiler, CMake 3.10+, and Python 3.

---

## Run the Complete System

All commands in this section must be executed from the project root.

### 1. Create local environment files

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item mobile\.env.example mobile\.env
```

The root `.env` file contains local Docker configuration. The default values are sufficient for normal local development.

### Optional: create the initial administrator

To create the first administrator automatically during server startup, fill **all five** fields below in the root `.env` file. Use fictional local test values only; `.env` is ignored by Git and must remain uncommitted.

```env
INITIAL_ADMIN_USERNAME=<local-admin-username>
INITIAL_ADMIN_PASSWORD=<password-with-at-least-8-characters-including-letters-and-numbers>
INITIAL_ADMIN_FULL_NAME=<display-name>
INITIAL_ADMIN_PHONE=<phone-number>
INITIAL_ADMIN_ADDRESS=<address>
```

On startup, the API creates an account with the `admin` role when no user with that username exists. If the username already exists, the bootstrap deliberately leaves that account unchanged. To disable bootstrap, leave all five variables empty. Do not put real passwords or personal information in Git, Jira, the Wiki, or this README.

### 2. Start all backend services and the web client

```powershell
docker compose up --build -d
```

Docker Compose starts:

| Service | Responsibility |
|---|---|
| `mongo` | MongoDB database with persistent volume and health check |
| `ex2-server` | C++ TCP recommendation server |
| `web-server` | Node.js/Express API and the built React web client |

### 3. Check container status

```powershell
docker compose ps
```

Expected services:

```text
mongo
ex2-server
web-server
```

### 4. Verify the API

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Expected response:

```text
status service
------ -------
ok     food-delivery-api
```

You can also verify the seeded restaurant catalog:

```powershell
Invoke-RestMethod http://localhost:3000/api/restaurants
```

### 5. Open the web application

Open:

```text
http://localhost:3000
```

The same container serves the production React build and the `/api` endpoints.

### 6. View logs when needed

```powershell
docker compose logs -f web-server
```

To view every service:

```powershell
docker compose logs -f
```

### 7. Stop the system

```powershell
docker compose down
```

This stops the containers while preserving MongoDB and recommendation-server runtime data.

---

## Run the Mobile App

The mobile app uses Expo and connects to the Docker Compose backend through your computer's LAN address.

### 1. Configure the API address

Open `mobile/.env` and set:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3000/api
```

Use your computer's Wi-Fi IPv4 address, not `localhost`.

On Windows, find it with:

```powershell
ipconfig
```

Look for the IPv4 address under the active Wi-Fi adapter. Do not use a `172.*` Docker, WSL, or virtual-network address.

For an Android emulator, use:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
```

For Expo Web on the same computer, use:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 2. Start Expo

Open a second terminal:

```powershell
cd mobile
npm install
npx expo start --clear
```

Then scan the QR code with Expo Go, or choose the Android emulator option from Expo.

> After changing `mobile/.env`, stop Expo completely and rerun `npx expo start --clear`. A normal app reload does not reload environment variables.

---

## Verification and Testing

### Manual flow checklist

Verify each flow in both the web client and the mobile client:

1. Register a new fictional user with valid fields and a profile image.
2. Confirm invalid registration and login input displays understandable feedback.
3. Log in and log out.
4. Browse restaurants, open a menu, search for restaurants/dishes, and switch theme.
5. Add products to the cart, review recommendations, and complete checkout.
6. Open order history and order details; test allowed cancel/delete/reorder actions.
7. Create, edit, and delete a restaurant and its products using an authorized account.
8. Confirm unauthorized users cannot manage another user's restaurant.
9. Verify data remains after `docker compose down` followed by `docker compose up -d`.
10. Verify the main required workflows are documented with screenshots in `wiki/`.

### C++ tests

```powershell
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
```

### API scenario tests

Start Docker Compose first, then run selected Node.js scenario tests from the project root:

```powershell
node tests/scrum-323-create-order.test.js
node tests/scrum-324-previous-orders.test.js
node tests/scrum-325-management.test.js
node tests/scrum-404-backend.test.js
```

These tests create fictional test data in the local development database.

### Web production build

```powershell
cd client
npm install
npm run build
```

The Docker build performs this production build automatically when `docker compose up --build` is used.

---

## Project Structure

```text
targil-5/
├── src/                        # C++ recommendation server
├── tests/                      # C++ tests and API scenario tests
├── web-server/                 # Node.js + Express REST API
│   └── src/
│       ├── config/             # MongoDB connection
│       ├── controllers/        # HTTP request handlers
│       ├── middleware/         # Authentication, authorization, error handling
│       ├── models/             # Mongoose schemas
│       ├── repositories/       # MongoDB data access layer
│       ├── routes/             # API routes
│       ├── seed/               # Initial catalog / optional admin seed
│       ├── services/           # Business logic and TCP bridge
│       └── utilities/          # Validation and helper functions
├── client/                     # React + Vite web client
│   └── src/
│       ├── api/                # API client functions
│       ├── components/         # Reusable UI components
│       ├── context/            # Authentication, cart, and currency contexts
│       ├── css/                # Responsive styles and themes
│       ├── pages/              # Web application routes
│       └── utils/              # Shared UI helpers
├── mobile/                     # React Native + Expo application
│   └── src/
│       ├── api/                # API client functions
│       ├── auth/               # Authentication context
│       ├── cart/               # Cart context
│       ├── components/         # Reusable native components
│       ├── currency/           # Currency context
│       ├── location/           # Location helpers
│       ├── navigation/         # React Navigation configuration
│       ├── screens/            # Mobile screens
│       ├── theme/              # Light/dark design system
│       └── utils/              # Shared utilities
├── wiki/                       # Setup documentation, flows, proof, screenshots
├── docker-compose.yml          # Backend and web orchestration
├── Dockerfile                  # C++ recommendation server build
├── Dockerfile.webserver        # React build + Node.js API image
└── .env.example                # Safe local configuration template
```

---

## Persistence and Resetting Local Data

MongoDB data is stored in the Docker volume `mongo-data`. The recommendation server stores its data in `ex2-data`.

```powershell
# Stop containers but keep local data
docker compose down

# Start again with the existing data
docker compose up -d
```

To delete local development data and start from a clean state:

```powershell
docker compose down -v
docker compose up --build -d
```

The fresh start recreates the database and seeds the default restaurant catalog.

---

## Project Wiki

The detailed project documentation is stored in the repository's `wiki/` directory:

| Page | Content |
|---|---|
| [Wiki Home](wiki/Home.md) | Wiki index and system summary |
| [System Architecture](wiki/System-Architecture.md) | Components, communication, and directory structure |
| [Run Instructions](wiki/Run-Instructions.md) | Docker, environment variables, web, and mobile startup |
| [Web Client Flows](wiki/Web-Client-Flows.md) | Browser-based registration, browsing, ordering, and management flows |
| [Mobile App Flows](wiki/Mobile-App-Flows.md) | React Native flows and mobile-specific behavior |
| [Admin Features](wiki/Admin-Features.md) | Administrator tools and authorization rules |
| [Extended Features](wiki/Extended-Features.md) | Additional functionality beyond the core requirement |
| [Proof](wiki/proof/) | Per-task verification notes and screenshots |

The wiki is intended to demonstrate:

- Bringing up the complete environment.
- Registration and login.
- Creating, editing, and deleting restaurants, products, and orders in the relevant clients.
- Mobile-specific UI behavior such as native navigation, camera/gallery image selection, and native confirmation dialogs.

---

## Development Workflow

Development is managed with Jira, GitHub feature branches, Pull Requests, and code review.

```text
Create / refine Jira issue
        ↓
Assign the issue before implementation
        ↓
Create branch: SCRUM-<issue-number>-short-description
        ↓
Implement one focused change
        ↓
Test locally and update Jira activity
        ↓
Open Pull Request
        ↓
Move issue to Code Review
        ↓
All other team members review and approve
        ↓
Merge into main
        ↓
Move issue to Done
```

The Jira board tracks epics, user stories, tasks, sprint planning, status meetings, assignment, blockers, implementation updates, Pull Requests, and final ownership of each task.

---

## Submission Notes

Before submission:

- Keep the GitHub repository **private** and grant the course checker the required read access to both GitHub and Jira.
- Do not commit `.env`, API keys, tokens, passwords, personal information, or `node_modules`.
- Use only legal, free, and open-source resources, including images and icons.
- Ensure the required Wiki pages contain the relevant commands and real screenshots.
- Ensure `details.txt` is placed at the required submission location and contains:
  - one English-only line for each submitting student: `FirstName LastName ID`
  - one final line containing the GitHub repository URL
  - no extra lines or spaces
- Submit the required `details.txt` file to Moodle according to the course instructions.

---

## Troubleshooting

| Issue | Likely cause | Fix |
|---|---|---|
| `Cannot connect to the Docker API` | Docker Desktop is not running | Start Docker Desktop and wait for the engine to become available. |
| `web-server` restarts repeatedly | Backend error during startup | Run `docker compose logs web-server --tail 100`. |
| The mobile app cannot reach the API | Incorrect mobile API URL | Update `mobile/.env` with the active Wi-Fi IPv4 address and restart Expo with `--clear`. |
| The mobile app times out | Phone and computer are on different networks, or the IP changed | Connect both devices to the same Wi-Fi, run `ipconfig`, update `.env`, and restart Expo. |
| Browser location is denied | Browser permission was blocked | Allow location for `http://localhost:3000` in browser site settings, then retry. |
| Data seems stale after a code change | Old Docker image/container is still running | Run `docker compose down`, then `docker compose up --build -d`. |
| A fresh database is needed | Docker volumes still contain old local data | Run `docker compose down -v`, then rebuild and start the services. |

---

## License and Educational Use

This project was developed for educational purposes as part of the Advanced Systems Programming course. All external assets used in the final submission must be legal, free to use, and appropriately licensed.
