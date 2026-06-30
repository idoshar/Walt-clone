# Run Instructions

This page explains how to bring up the complete system and run both clients.

---

## Prerequisites

- **Docker Desktop** installed and running (engine must show "Running")
- **Node.js** (for the mobile app)
- **Expo Go** app installed on your phone
- Phone and computer on the **same WiFi network** (for the mobile app)

---

## Step 1 — Configure Environment Variables

From the project root, copy the example environment files:

```bash
cp .env.example .env
cp mobile/.env.example mobile/.env
```

### Root `.env`

The defaults work for the web client and Docker. To enable the admin account, fill in all five admin fields (all are required together):

```env
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=Admin1234!
INITIAL_ADMIN_FULL_NAME=System Admin
INITIAL_ADMIN_PHONE=0501234567
INITIAL_ADMIN_ADDRESS=Tel Aviv
```

> **Important:** Never commit the `.env` file — it is in `.gitignore`. Never store real passwords in the repository.

### Mobile `mobile/.env`

Set the API URL to your computer's **LAN IP** (not `localhost`, because the phone connects over the network):

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:3000/api
```

Find your IP:
- **Windows:** `ipconfig` → look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi"
- **macOS/Linux:** `ifconfig` or `ip a`

> Use the WiFi adapter IP (e.g. `192.168.x.x` or `10.0.x.x`). Do **not** use the WSL/vEthernet IP (`172.x.x.x`).

---

## Step 2 — Start the Backend (Docker Compose)

From the project root:

```bash
docker compose up --build
```

This builds and starts three services:

| Service | What it does |
|---|---|
| `mongo` | MongoDB database with health check |
| `ex2-server` | C++ recommendation engine |
| `web-server` | Node.js API + React web client |

Wait until you see:

```
Food Delivery API server is running on http://localhost:3000
```

> **Note:** MongoDB prints connection log lines continuously — this is normal, not an error. To run in the background: `docker compose up --build -d`.

On first startup, the server automatically seeds: default restaurants with images, products with images, and the admin user (if configured in `.env`).

---

## Step 3 — Verify the Backend

Open a browser:

| URL | Expected |
|---|---|
| `http://localhost:3000/api/health` | `{ "status": "ok", "service": "food-delivery-api" }` |
| `http://localhost:3000/api/restaurants` | JSON array of seeded restaurants |

---

## Step 4 — Use the Web Client

The React web client is served by the same container:

```
http://localhost:3000
```

Register a new account or log in with the admin credentials to access all features.

---

## Step 5 — Run the Mobile App (Expo)

In a **separate** terminal:

```bash
cd mobile
npm install        # first time only
npx expo start --clear
```

Scan the QR code with **Expo Go** on your phone (same WiFi as your computer).

> **Important:** After any change to `mobile/.env`, you must fully restart Expo with `npx expo start --clear`. A simple reload does not pick up environment variable changes.

---

## Stopping the System

```bash
# Stop containers (data preserved):
docker compose down

# Stop containers AND wipe database (fresh start):
docker compose down -v
```

---

## Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker API` | Docker Desktop not running | Open Docker Desktop, wait for "Engine running" |
| `Docker Engine stopped` | Engine crashed | Restart Docker Desktop, or restart computer |
| `mapping key already defined` | Duplicate YAML key | Remove the duplicate line in docker-compose.yml |
| Mobile: "Could not connect to backend" | Wrong IP or Expo cache | Set WiFi IP in `mobile/.env`, run `npx expo start --clear` |
| Mobile: "Network request timed out" | IP changed since last session | Run `ipconfig`, update `mobile/.env`, restart Expo |
| Web-server keeps restarting | Code error (check logs) | Run `docker compose logs web-server --tail 50` to see the error |
| `restaurantStatisticsController is not defined` | Missing import after merge | Add the missing `require` line for the controller in `restaurantRoutes.js` |