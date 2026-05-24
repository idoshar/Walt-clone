# Exercise 2 - TCP Client-Server Recommendation System

## Overview

This project is a TCP client-server version of the recommendation system from Exercise 1.

The business logic remains in the C++ server.  
The Python client is simple: it receives user commands from the console, sends them to the server over TCP, and prints only the server response.

## Architecture

The project is separated into clear responsibilities:

- `main.cpp` - reads the server port argument and starts the TCP server.
- `TcpServer` - creates the TCP socket, binds, listens, and accepts one client.
- `ClientSession` - handles one connected client, reads commands line by line, executes them, and sends responses.
- `CommandParser` - parses protocol commands.
- `UserRepository` - manages users and watched products.
- `RecommendationEngine` - calculates recommendations.
- `Persistence` - loads and saves user data.

This separation keeps the network layer independent from the business logic and supports future extension, such as adding multi-client support.

---

## Project Structure

```text
.
├── src/
│   ├── main.cpp
│   ├── TcpServer.h / TcpServer.cpp
│   ├── ClientSession.h / ClientSession.cpp
│   ├── CommandParser.h / CommandParser.cpp
│   ├── UserRepository.h / UserRepository.cpp
│   ├── RecommendationEngine.h / RecommendationEngine.cpp
│   ├── Persistence.h / Persistence.cpp
│   └── client.py
├── data/
│   └── users.txt
├── tests/
│   └── integration/
├── Dockerfile
├── Dockerfile.client
├── Dockerfile.test
└── README.md
```

---

## Protocol

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

## Responses

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

Removes watched products from a user history.

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

### Invalid command

```text
400 Bad Request
```

### PATCH

## Build Server

```bash
g++ -std=c++17 -Wall -Wextra -I src \
src/main.cpp src/TcpServer.cpp src/ClientSession.cpp src/CommandParser.cpp \
src/User.cpp src/UserRepository.cpp src/RecommendationEngine.cpp src/Persistence.cpp \
-o server
```

---

## Run Server

```bash
./server 5555
```

---

## Run Client

```bash
python3 src/client.py 127.0.0.1 5555
```

The client receives the server IP and port as command-line arguments.  
It does not validate commands. It sends every input line to the server and prints only the server response.

---

## Run docker:
docker build  -f Dockerfile.test -t recommender-tests .
docker run -d -p 8080:8080 --name server recommender-server
docker run --rm --network host recommender-tests

run all tests in one ccommand: docker run --rm --network host recommender-tests

<img width="1083" height="733" alt="image" src="https://github.com/user-attachments/assets/6f668cd6-77f4-4de9-be13-9968a094f1e0" />
<img width="1312" height="743" alt="image" src="https://github.com/user-attachments/assets/bf46dccb-9751-45fa-8d22-48b2d0498c37" />
<img width="1233" height="738" alt="image" src="https://github.com/user-attachments/assets/0cafcbdc-b13c-4610-8f3b-6451016b9f88" />



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
src/main.cpp src/TcpServer.cpp src/ClientSession.cpp src/CommandParser.cpp \
src/User.cpp src/UserRepository.cpp src/RecommendationEngine.cpp src/Persistence.cpp \
-o server
```

### Multiple Commands Test

```bash
g++ -std=c++17 -Wall -Wextra -I src \
tests/integration/test_multiple_commands.cpp \
-o test_multiple_commands

./test_multiple_commands
```

### Full Protocol Test

```bash
g++ -std=c++17 -Wall -Wextra -I src \
tests/integration/test_protocol_all.cpp \
-o test_protocol_all

./test_protocol_all
```

---

## SOLID and Extensibility

### Command name changes

Exercise 1 used commands such as `add` and `recommend`.  
Exercise 2 uses HTTP-like names such as `POST`, `PATCH`, `DELETE`, and `GET`.

The command parsing responsibility is isolated in `CommandParser`, so command naming changes do not require changes to networking code.

### New commands

New commands are handled by extending the parser and command execution logic.  
The socket communication code remains unchanged.

### Output format changes

Response formatting is handled inside `ClientSession`, so protocol responses are separated from low-level socket read/write logic.

### Console to socket transition

In Exercise 1, input and output were handled through the console.  
In Exercise 2, input and output are handled through TCP sockets.

The business logic remains separated from the transport mechanism. The client session reads commands from the socket and delegates the actual command behavior to repository and recommendation classes.

### Future multi-client support

The server currently handles one client at a time, as required.  
However, the code separates `TcpServer` from `ClientSession`, so future support for multiple clients can be added by running each `ClientSession` independently, for example in a separate thread.

---

## Notes

- The server is implemented in C++.
- The client is implemented in Python 3.
- No external libraries are used.
- The client is intentionally simple and performs no command validation.
- The repository should remain private.
- No passwords, tokens, keys, or private information should be committed
