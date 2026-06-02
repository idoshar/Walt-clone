# Exercise 3 - Web Server Based on Exercise 2 Recommendation System

## Overview

This repository was created for Exercise 3 and is based on the final code of Exercise 2.

At this stage, the repository contains the Exercise 2 TCP client-server recommendation system.  
During Exercise 3, a new NodeJS + Express Web server will be added on top of this project.

The Exercise 2 C++ server will remain responsible for the recommendation logic.  
The Exercise 3 Web server will communicate with the Exercise 2 server as a client when recommendation-related actions are required.

The Exercise 2 repository remains unchanged.

---

## Current Exercise 2 System

The existing system is a TCP client-server recommendation system.

The business logic is implemented in the C++ server.  
The Python client receives user commands from the console, sends them to the server over TCP, and prints only the server response.

---

## Planned Exercise 3 System

Exercise 3 will add a Web server that exposes a RESTful API for a food delivery application.

The Web server will be implemented using:

- NodeJS
- Express
- MVC architecture
- In-memory storage
- JSON responses for all `/api` routes

The Web server will support:

- User registration
- User login
- Restaurant management
- Product/menu management
- Order management
- Search
- Integration with the Exercise 2 recommendation server through sockets

---

## Architecture

### Existing Exercise 2 Architecture

The current C++ project is separated into clear responsibilities:

- `main.cpp` - reads the server port argument and starts the TCP server.
- `TcpServer` - creates the TCP socket, binds, listens, and accepts clients.
- `ClientSession` - handles a connected client, reads commands line by line, executes them, and sends responses.
- `CommandParser` - parses protocol commands.
- `UserRepository` - manages users and watched products.
- `RecommendationEngine` - calculates recommendations.
- `Persistence` - loads and saves user data.
- `client.py` - simple Python TCP client.

This separation keeps the network layer independent from the business logic and supports future extension.

### Planned Exercise 3 Architecture

The Exercise 3 Web server will follow MVC-style separation:

```text
routes       - Define API routes
controllers  - Handle HTTP requests and responses
services     - Contain business logic
models       - Define domain objects
repositories - Store data in memory during runtime
utils        - Shared helpers for validation, IDs and responses
```

The Web server will expose REST API endpoints and return JSON responses.

---

## Project Structure

Current structure:

```text
.
├── src/
│   ├── main.cpp
│   ├── TcpServer.h
│   ├── TcpServer.cpp
│   ├── ClientSession.h
│   ├── ClientSession.cpp
│   ├── CommandParser.h
│   ├── CommandParser.cpp
│   ├── User.h
│   ├── User.cpp
│   ├── UserRepository.h
│   ├── UserRepository.cpp
│   ├── RecommendationEngine.h
│   ├── RecommendationEngine.cpp
│   ├── Persistence.h
│   ├── Persistence.cpp
│   └── client.py
├── data/
│   ├── users.example.txt
│   └── views.txt
├── docs/
│   └── file-format.md
├── tests/
│   └── integration/
├── Dockerfile
├── Dockerfile.client
├── Dockerfile.test
├── CMakeLists.txt
├── details.txt
└── README.md
```

Planned Exercise 3 additions:

```text
web-server/
├── app.js
├── routes/
├── controllers/
├── services/
├── models/
├── repositories/
├── utils/
├── config/
└── package.json
```

---

## Exercise 2 TCP Protocol

Each command sent by the client ends with a newline character.

Each response sent by the server also ends with a newline character.

Supported commands:

```text
POST [userid] [productid1] [productid2] ...
PATCH [userid] [productid1] [productid2] ...
DELETE [userid] [productid1] [productid2] ...
GET [userid] [productid]
help
```

---

## Exercise 2 Responses

### POST

Creates a new user with watched products.

Success:

```text
201 Created
```

If the user already exists:

```text
404 Not Found
```

---

### PATCH

Adds watched products to an existing user.

Success:

```text
204 No Content
```

If the user does not exist:

```text
404 Not Found
```

---

### DELETE

Removes watched products from a user's history.

Success:

```text
204 No Content
```

If the user does not exist, or one of the products was not watched by the user:

```text
404 Not Found
```

---

### GET

Returns recommendations for a user and product.

Success format:

```text
200 Ok

<recommendations>
```

If the user does not exist, or the user did not watch the requested product:

```text
404 Not Found
```

---

### Invalid Command

```text
400 Bad Request
```

---

## Build Exercise 2 Server

```bash
g++ -std=c++17 -Wall -Wextra -I src \
src/main.cpp \
src/TcpServer.cpp \
src/ClientSession.cpp \
src/CommandParser.cpp \
src/User.cpp \
src/UserRepository.cpp \
src/RecommendationEngine.cpp \
src/Persistence.cpp \
-o server
```

---

## Run Exercise 2 Server

```bash
./server 5555
```

---

## Run Exercise 2 Client

```bash
python3 src/client.py 127.0.0.1 5555
```

The client receives the server IP and port as command-line arguments.  
It does not validate commands. It sends every input line to the server and prints only the server response.

---

## Docker

### Build Exercise 2 Server Image

```bash
docker build -t recommender-server .
```

### Run Exercise 2 Server

```bash
docker run --rm -p 8080:8080 --name recommender-server recommender-server
```

### Build Test Image

```bash
docker build -f Dockerfile.test -t recommender-tests .
```

### Run Tests

```bash
docker run --rm --network host recommender-tests
```

> Note: Docker instructions may be updated during Exercise 3 to support running both the Exercise 2 TCP server and the Exercise 3 Web server separately.

---

## Example Run

Client input:

```text
POST 1 10 20
```

Server response:

```text
201 Created
```

Client input:

```text
POST 2 10 30
```

Server response:

```text
201 Created
```

Client input:

```text
GET 1 10
```

Server response:

```text
200 Ok

30
```

Client input:

```text
DELETE 1 20
```

Server response:

```text
204 No Content
```

---

## Run Integration Tests

Build the server first:

```bash
g++ -std=c++17 -Wall -Wextra -I src \
src/main.cpp \
src/TcpServer.cpp \
src/ClientSession.cpp \
src/CommandParser.cpp \
src/User.cpp \
src/UserRepository.cpp \
src/RecommendationEngine.cpp \
src/Persistence.cpp \
-o server
```

### Multiple Commands Test

```bash
g++ -std=c++17 -Wall -Wextra -I src \
tests/integration/test_multiple_commands.cpp \
-o test_multiple_commands

./test_multiple_commands
```

### Full Scenario Test

```bash
g++ -std=c++17 -Wall -Wextra -I src \
tests/integration/test_full_scenario.cpp \
-o test_full_scenario

./test_full_scenario
```

---

## Exercise 3 REST API Plan

The Exercise 3 Web server will implement the following API.

### Users

```text
POST /api/users
GET  /api/users/:id
```

### Authentication

```text
POST /api/tokens
```

### Restaurants

```text
GET    /api/restaurants
POST   /api/restaurants
GET    /api/restaurants/:id
PATCH  /api/restaurants/:id
DELETE /api/restaurants/:id
```

### Products

```text
GET    /api/restaurants/:id/products
POST   /api/restaurants/:id/products
GET    /api/restaurants/:id/products/:pId
PATCH  /api/restaurants/:id/products/:pId
DELETE /api/restaurants/:id/products/:pId
```

### Orders

```text
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
DELETE /api/orders/:id
```

### Search

```text
GET /api/search/:query
```

---

## Exercise 2 Server Integration

The Exercise 3 Web server will connect to the Exercise 2 TCP server as a client.

For example, when a logged-in user views a product using:

```text
GET /api/restaurants/:id/products/:pId
```

the Web server may report this product view to the Exercise 2 recommendation server.

The exact integration behavior will be implemented and documented as part of Exercise 3.

---

## SOLID and Extensibility

### Separation of Responsibilities

The project separates parsing, networking, persistence and recommendation logic into different classes.

This makes the system easier to maintain and extend.

### Command Name Changes

Exercise 1 used commands such as `add` and `recommend`.  
Exercise 2 uses HTTP-like names such as `POST`, `PATCH`, `DELETE`, and `GET`.

The command parsing responsibility is isolated in `CommandParser`, so command naming changes do not require changes to networking code.

### New Commands

New commands are handled by extending the parser and command execution logic.  
The socket communication code remains unchanged.

### Output Format Changes

Response formatting is handled inside `ClientSession`, so protocol responses are separated from low-level socket read/write logic.

### Console to Socket Transition

In Exercise 1, input and output were handled through the console.  
In Exercise 2, input and output are handled through TCP sockets.

The business logic remains separated from the transport mechanism.  
The client session reads commands from the socket and delegates the command behavior to repository and recommendation classes.

### Future Multi-Client Support

The server currently handles clients according to the current implementation requirements.  
Because `TcpServer` is separated from `ClientSession`, future support for multiple clients can be added by running each `ClientSession` independently, for example in a separate thread.

### Exercise 3 Extension

Exercise 3 will add a Web API layer without replacing the existing recommendation logic.  
This allows the recommendation server to remain independent from the Web server.

---

## Repository Policy

This repository was created separately for Exercise 3 and is based on the final code of Exercise 2.

The Exercise 2 repository remains unchanged.

Exercise 3 development is done in this repository using feature branches named after Jira issue keys.

Example feature branch:

```text
SCRUM-150-create-express-server
```

All changes are merged into `main` only through Pull Requests after code review.

Each Pull Request must be reviewed and approved by the other team members before merge.

---

## Jira Workflow

The Jira workflow for this exercise is:

```text
To Do → In Progress → Review Code → Done
```

Rules:

- Move an issue to `In Progress` only when work actually starts.
- Move an issue to `Review Code` only after opening a Pull Request.
- Move an issue to `Done` only after the Pull Request is approved and merged.
- Each issue should be assigned before work starts.
- Each issue should be linked to a feature branch.
- Blocked issues should be linked in Jira using `blocks` / `is blocked by`.

---

## Notes

- The Exercise 2 server is implemented in C++.
- The Exercise 2 client is implemented in Python 3.
- The Exercise 3 Web server will be implemented in NodeJS and Express.
- Data for Exercise 3 will be stored in memory during server runtime.
- No external libraries should be used unless allowed by the course instructions.
- The repository should remain private.
- Do not commit passwords, tokens, API keys, private information, `node_modules`, build artifacts or generated binaries.



## Running with Docker

### Both servers together (recommended)
```bash
docker-compose up --build
```
Web server will be available at: http://localhost:3000

### Separately
```bash
# Ex2 server
docker build -t ex2-server .
docker run -p 8080:8080 ex2-server

# Web server
docker build -f Dockerfile.webserver -t web-server .
docker run -p 3000:3000 -e EX2_HOST=host.docker.internal -e EX2_PORT=8080 web-server
```