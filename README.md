# Exercise 4 - React Wolt-Style Web Application

## Overview

This repository contains the Exercise 4 project for the Advanced Systems Programming course.

Exercise 4 continues the previous project work.
The repository currently contains the previous C++ TCP recommendation server, the Exercise 3 NodeJS and Express web server, and the work area for the Exercise 4 React web application.

The goal of Exercise 4 is to build a React-based web application inspired by Wolt.
The React application communicates with the Exercise 3 web server, displays real dynamic data from the server, supports multiple users, and allows users to complete full application scenarios such as registration, login, restaurant browsing, menu viewing, ordering, search, restaurant management, theme switching, testing, Docker execution, and project documentation.

The React application must not display hard-coded application data.
For example, restaurants and products must come from the server API, and creating a restaurant or order must be done through the server.

---

## Current Project Status

This repository is in transition from Exercise 3 to Exercise 4.

Currently included:

* Existing Exercise 2 C++ TCP recommendation server.
* Existing Exercise 3 NodeJS and Express web server.
* REST API endpoints for users, authentication, restaurants, products, orders and search.
* Docker files and docker-compose configuration.
* Jira and Git workflow documentation.
* Exercise 4 planning and implementation tasks tracked in Jira.

Exercise 4 development adds:

* React frontend application.
* Login and register screens.
* Home screen inspired by Wolt.
* Dynamic restaurant and product display.
* Search UI.
* Order flow.
* Previous orders screen.
* Restaurant and menu management screens.
* JWT-based authenticated requests.
* Dark/light theme toggle.
* Client-side and server-side validation.
* Full E2E testing and screenshots.

This README should be updated again before final submission after all Exercise 4 screens, screenshots, and final run instructions are completed.

---

## Exercise 4 Requirements Summary

The Exercise 4 system should include:

* A React web application.
* Proper component-based structure.
* Usage of `useState`.
* Usage of `useRef`.
* Usage of React Router.
* Login screen.
* Register screen.
* Home screen.
* Restaurant browsing.
* Restaurant menu view.
* Order creation flow.
* Previous orders view.
* Search functionality.
* Restaurant and product management.
* JWT authentication.
* Protected pages for logged-in users.
* Dark/light mode toggle.
* Client-side validation.
* Server-side validation.
* Dynamic data from the server.
* No hard-coded restaurants/products/orders in the React application.
* Docker Compose run instructions.
* README documentation.
* Jira workflow, feature branches and Pull Requests.

---

## Architecture

The project contains three main parts:

### 1. C++ TCP Recommendation Server

This part comes from the previous exercises.

The C++ server is responsible for recommendation-related logic.
It communicates over TCP using a simple text protocol.

Main responsibilities:

* Accept TCP client connections.
* Parse commands.
* Store user/product view history.
* Return product recommendations.
* Persist data when required.

### 2. NodeJS and Express Web Server

This part comes from Exercise 3.

The Express server exposes REST API endpoints for the food delivery system.
It is responsible for:

* Users.
* Authentication.
* Restaurants.
* Products.
* Orders.
* Search.
* JSON responses.
* Communication with the previous recommendation server when needed.

The React application from Exercise 4 communicates with this web server.

### 3. React Frontend Application

This part is added in Exercise 4.

The React application is responsible for the user interface.

It should include:

* Pages.
* Components.
* Layout.
* Routing.
* API calls.
* Auth state.
* Form validation.
* Theme state.
* User-facing error messages.
* Loading and empty states.

---

## Project Structure

Current repository structure:

```text
.
|-- client/
|-- data/
|-- docs/
|-- src/
|-- tests/
|-- web-server/
|-- .gitignore
|-- CMakeLists.txt
|-- details.txt
|-- docker-compose.yml
|-- Dockerfile
|-- Dockerfile.client
|-- Dockerfile.test
|-- Dockerfile.webserver
|-- README.md
```

Main directories:

```text
src/
  C++ TCP server source files from previous exercises.

web-server/
  NodeJS and Express web server from Exercise 3.

client/
  Frontend work area for the Exercise 4 React application.

data/
  Data files used by the previous server.

tests/
  Integration tests from previous exercises.

docs/
  Additional project documentation.
```

The exact React directory structure may be updated during development according to the Jira tasks.

Recommended React structure:

```text
client/
|-- public/
|-- src/
|   |-- components/
|   |-- pages/
|   |-- services/
|   |-- context/
|   |-- styles/
|   |-- App.jsx
|   |-- main.jsx
|-- package.json
```

---

## Exercise 2 TCP Server

The existing TCP server supports the following protocol.

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

### Invalid Command

```text
400 Bad Request
```

---

## Build the C++ Recommendation Server

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

## Run the C++ Recommendation Server

```bash
./server 5555
```

---

## Run the Python TCP Client

```bash
python3 src/client.py 127.0.0.1 5555
```

The client receives the server IP and port as command-line arguments.
It sends each input line to the TCP server and prints the server response.

---

## Exercise 3 Web Server API

The Exercise 3 web server exposes REST API endpoints that are used by the Exercise 4 React application.

All `/api` routes should return JSON responses.

### Health

```text
GET /api/health
```

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

## Authentication and JWT

Exercise 4 requires authentication using JWT.

Expected flow:

1. A new user registers using `POST /api/users`.
2. The user logs in using `POST /api/tokens`.
3. The server returns a JWT.
4. The React application stores the JWT.
5. Future protected requests attach the JWT.
6. Protected pages and API actions are available only to logged-in users.

The application should decide for each action whether it can be performed by:

* A guest user.
* A registered and logged-in user.

Protected pages should redirect unauthenticated users to the login screen.

No real passwords, private data, API keys, tokens, real photos or sensitive information should be committed to the repository.

---

## React Application

The React application should provide a Wolt-style user interface.

Required screens:

* Login screen.
* Register screen.
* Home screen.
* Restaurant page.
* Menu/products page.
* Order/cart flow.
* Previous orders page.
* Search results.
* Restaurant management screen.
* Product/menu management screen.

Required behavior:

* React Router is used for page navigation.
* The application loads once and does not refresh the whole page when moving between pages.
* Components are separated logically.
* `useState` is used for dynamic UI state.
* `useRef` is used where appropriate, especially in form-related logic.
* The application communicates with the server using `fetch`.
* Data is loaded from the server and rendered dynamically.
* Loading, empty and error states are displayed clearly.
* The user receives clear feedback after invalid actions.
* The logged-in user's details appear in the top navigation area.
* Logout clears the authentication state and returns the user to the login flow.
* Dark/light theme can be changed from the top navigation after login.

---

## Validation

Both client-side and server-side validation are required.

### Login

Required:

* Username.
* Password.

Invalid login should show a clear error message.

### Register

Required:

* Username.
* Password.
* Confirm password.
* Display name.
* Profile image.

The register screen should validate:

* All fields are required.
* Password strength rules.
* Password confirmation.
* Duplicate username error.
* Image selection and preview.

A user should not be able to register or log in without valid input.

---

## Theme Support

Exercise 4 requires a dark/light mode toggle.

Expected behavior:

* A button appears in the top navigation after login.
* Clicking the button switches between light mode and dark mode.
* Application colors change according to the selected theme.
* The selected theme may be saved locally so it remains after refresh.

---

## Running with Docker

### Recommended: run all services with Docker Compose

```bash
docker-compose up --build
```

Expected web server URL:

```text
http://localhost:3000
```

The exact Docker Compose behavior should be updated before final submission according to the final Exercise 4 implementation.

### Run the previous C++ server separately

```bash
docker build -t recommender-server .
docker run --rm -p 8080:8080 --name recommender-server recommender-server
```

### Run the web server separately

```bash
docker build -f Dockerfile.webserver -t web-server .
docker run --rm -p 3000:3000 -e EX2_HOST=host.docker.internal -e EX2_PORT=8080 web-server
```

---

## API Examples

The following examples can be used to test the web server.

### Create User

```bash
curl -i -X POST http://localhost:3000/api/users \
-H "Content-Type: application/json" \
-d '{"username":"maya","password":"1234","name":"Maya Kaykov","phone":"0500000000","address":"Israel"}'
```

Expected result:

```text
HTTP/1.1 201 Created
Location: /api/users/<userId>
```

### Get User By ID

```bash
curl -i http://localhost:3000/api/users/1
```

Expected result:

```text
HTTP/1.1 200 OK
```

### User Not Found

```bash
curl -i http://localhost:3000/api/users/999
```

Expected result:

```text
HTTP/1.1 404 Not Found
```

### Login

```bash
curl -i -X POST http://localhost:3000/api/tokens \
-H "Content-Type: application/json" \
-d '{"username":"maya","password":"1234"}'
```

Expected result:

```text
HTTP/1.1 200 OK
```

### Invalid Login

```bash
curl -i -X POST http://localhost:3000/api/tokens \
-H "Content-Type: application/json" \
-d '{"username":"maya","password":"wrong"}'
```

Expected result:

```text
HTTP/1.1 401 Unauthorized
```

### Get Restaurants

```bash
curl -i http://localhost:3000/api/restaurants
```

Expected result:

```text
HTTP/1.1 200 OK
```

### Search

```bash
curl -i http://localhost:3000/api/search/pizza
```

Expected result:

```text
HTTP/1.1 200 OK
```

---

## Testing

The project includes integration tests from the previous exercises.

### Build the C++ server before running integration tests

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

### Exercise 4 E2E Testing Plan

The final Exercise 4 submission should include manual or documented E2E testing for:

* Register/login/logout scenario.
* Protected pages without login.
* Restaurant browsing and menu scenario.
* Search scenario.
* Create order scenario.
* Previous orders scenario.
* Restaurant and product management scenario.
* Invalid inputs and visible error messages.
* Docker Compose startup.
* README screenshots.

Screenshots should be added before final submission.

---

## Repository and Git Policy

This repository is used for Exercise 4 and continues the previous exercise codebase.

Development is done using feature branches named after Jira issue keys.

Example feature branches:

```text
SCRUM-224-create-react-frontend-project-structure
SCRUM-276-create-app-shell-and-shared-layout
SCRUM-328-add-jira-git-workflow-explanation-to-readme
```

All changes are merged into `main` only through Pull Requests after code review.

Each Pull Request must be reviewed and approved by team members other than the student who opened the Pull Request.

The repository should remain private.

Do not commit:

* Passwords.
* Tokens.
* API keys.
* Private information.
* Real user data.
* Real private images.
* `node_modules`.
* Build artifacts.
* Generated binaries.

---

## Jira and Git Workflow

This project is developed using Jira and GitHub as part of a Scrum-based workflow.

### Jira Structure

The project is divided into:

* Epics.
* User Stories.
* Tasks.
* Subtasks.

Each Epic represents a major area of the system, such as:

* React setup and infrastructure.
* Authentication and user management.
* Home page and restaurants.
* Orders.
* Search.
* Restaurant management.
* Theme and design.
* Docker, testing and documentation.

Each User Story describes a user-facing capability.
Each Subtask represents a smaller technical step required to complete that story.

### Jira Workflow

The Jira workflow is:

```text
To Do -> In Progress -> Review Code -> Done
```

Rules:

* Move an issue to `In Progress` only when work actually starts.
* Move an issue to `Review Code` only after opening a Pull Request.
* Move an issue to `Done` only after the Pull Request is approved and merged.
* Each issue should be assigned before work starts.
* Each issue should be linked to a feature branch.
* Blocked issues should be linked in Jira using `blocks` / `is blocked by`.
* Jira activity comments should be updated while working.

### Pull Request Process

For each implemented task:

1. A dedicated feature branch is created.
2. The code is committed with a clear commit message.
3. The branch is pushed to GitHub.
4. A Pull Request is opened.
5. Team members review the code.
6. After approval, the branch is merged into `main`.
7. The Jira issue is updated and moved to `Done`.

### Blockers

Jira blockers are used to show task dependencies.

For example:

* JWT-related tasks block protected route tasks.
* React setup tasks block page implementation tasks.
* Feature implementation tasks block E2E testing tasks.
* Docker tasks block Docker screenshot documentation.
* Testing and documentation tasks block the final submission task.

---

## Notes

* The C++ TCP server is based on previous exercises.
* The NodeJS and Express web server is based on Exercise 3.
* The React frontend is the main new part of Exercise 4.
* The React frontend must communicate with the Exercise 3 web server.
* The React frontend must show dynamic data from the server.
* The React frontend must not hard-code restaurants, products or orders.
* The application should behave like a complete working app.
* The README should be updated again after the final Exercise 4 implementation is completed.
