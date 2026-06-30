# SCRUM-407 Mobile-to-Docker Connectivity Verification

## Android Emulator
The Expo Android emulator connected successfully to the Docker-hosted backend API.

API base URL:
http://10.0.2.2:3000/api

Verified endpoint:
GET /api/health

Result:
Connected successfully. Service: food-delivery-api

## Physical Device
A physical phone running Expo Go connected successfully to the Docker-hosted backend API while using the host machine IPv4 address.

API base URL:
http://10.100.102.212:3000/api

Verified endpoint:
GET /api/health

Result:
Connected successfully. Service: food-delivery-api

## Notes
- The Android emulator uses 10.0.2.2 to access the host machine.
- A physical device must use the host machine IPv4 address and be able to reach the host through the local network.
- Docker exposes the web server on port 3000.
