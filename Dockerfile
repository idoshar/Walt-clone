FROM gcc:13

WORKDIR /app

COPY . .

RUN mkdir -p data

RUN g++ -std=c++17 -Wall -Wextra -I src \
    src/main.cpp \
    src/CommandParser.cpp \
    src/User.cpp \
    src/UserRepository.cpp \
    src/RecommendationEngine.cpp \
    src/Persistence.cpp \
    src/TcpServer.cpp \
    src/ClientSession.cpp \
    -o todo_server

EXPOSE 8080

CMD ["./server", "8080"]
