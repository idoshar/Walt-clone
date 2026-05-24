#include "TcpServer.h"

#include "ClientSession.h"
#include "Persistence.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include <cstring>
#include <stdexcept>

TcpServer::TcpServer(int port, const std::string& dataFilePath) :
    m_port(port),
    m_dataFilePath(dataFilePath),
    m_userRepository(Persistence::load(dataFilePath)) {
}

void TcpServer::run() {
    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket < 0) {
        throw std::runtime_error("Failed to create socket");
    }

    int reuseAddress = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &reuseAddress, sizeof(reuseAddress));

    sockaddr_in serverAddress;
    std::memset(&serverAddress, 0, sizeof(serverAddress));
    serverAddress.sin_family = AF_INET;
    serverAddress.sin_addr.s_addr = INADDR_ANY;
    serverAddress.sin_port = htons(static_cast<uint16_t>(m_port));

    if (bind(serverSocket, reinterpret_cast<sockaddr*>(&serverAddress), sizeof(serverAddress)) < 0) {
        close(serverSocket);
        throw std::runtime_error("Failed to bind socket");
    }

    if (listen(serverSocket, 1) < 0) {
        close(serverSocket);
        throw std::runtime_error("Failed to listen on socket");
    }

    while (true) {
        int clientSocket = accept(serverSocket, nullptr, nullptr);

        if (clientSocket < 0) {
            continue;
        }

        ClientSession session(
            clientSocket,
            m_userRepository,
            m_recommendationEngine,
            m_dataFilePath
        );
        session.run();
    }
}
