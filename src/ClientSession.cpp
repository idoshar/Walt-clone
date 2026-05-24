#include "ClientSession.h"
#include "Persistence.h"

#include <sys/socket.h>
#include <unistd.h>

#include <sstream>
#include <string>
#include <vector>

ClientSession::ClientSession(
    int clientSocket,
    UserRepository& userRepository,
    RecommendationEngine& recommendationEngine,
    const std::string& dataFilePath
) :
    m_clientSocket(clientSocket),
    m_userRepository(userRepository),
    m_recommendationEngine(recommendationEngine),
    m_dataFilePath(dataFilePath) {
}

void ClientSession::run() {
    handleClient();
}

void ClientSession::handleClient() {
    char buffer[4096];
    std::string currentLine;

    while (true) {
        ssize_t bytesRead = recv(m_clientSocket, buffer, sizeof(buffer), 0);

        if (bytesRead <= 0) {
            break;
        }

        for (ssize_t i = 0; i < bytesRead; i++) {
            if (buffer[i] == '\n') {
                handleLine(currentLine);
                currentLine.clear();
            } else if (buffer[i] != '\r') {
                currentLine += buffer[i];
            }
        }
    }

    close(m_clientSocket);
}

void ClientSession::handleLine(const std::string& line) {
    Command command = m_parser.parseCommand(line);
    std::string response = executeCommand(command);
    sendAll(response);
}

std::string ClientSession::executeCommand(const Command& command) {
    if (command.type == CommandType::Invalid) {
        return "400 Bad Request\n";
    }

    if (command.type == CommandType::Help) {
        return "DELETE [userid] [productid1] [productid2] ...\n"
               "GET [userid] [productid]\n"
               "PATCH [userid] [productid1] [productid2] ...\n"
               "POST [userid] [productid1] [productid2] ...\n"
               "help\n";
    }

    int userId = command.userId;

    if (command.type == CommandType::Post) {
        if (m_userRepository.hasUser(userId)) {
            return "404 Not Found\n";
        }

        m_userRepository.addWatchedProducts(userId, command.productIds);
        Persistence::save(m_userRepository, m_dataFilePath);
        return "201 Created\n";
    }

    if (command.type == CommandType::Patch) {
        if (!m_userRepository.hasUser(userId)) {
            return "404 Not Found\n";
        }

        m_userRepository.addWatchedProducts(userId, command.productIds);
        Persistence::save(m_userRepository, m_dataFilePath);
        return "204 No Content\n";
    }

    if (command.type == CommandType::Delete) {
        if (!m_userRepository.hasUser(userId)) {
            return "404 Not Found\n";
        }

        for (int productId : command.productIds) {
            if (!m_userRepository.hasUserWatchedProduct(userId, productId)) {
                return "404 Not Found\n";
            }
        }

        for (int productId : command.productIds) {
            m_userRepository.removeWatchedProducts(userId, {productId});
        }

        Persistence::save(m_userRepository, m_dataFilePath);
        return "204 No Content\n";
    }

    if (command.type == CommandType::Get) {
        if (command.productIds.empty()) {
            return "400 Bad Request\n";
        }

        int productId = command.productIds[0];

        if (!m_userRepository.hasUser(userId) ||
            !m_userRepository.hasUserWatchedProduct(userId, productId)) {
            return "404 Not Found\n";
        }

        std::vector<UserProducts> users = m_userRepository.getAllUserProducts();

        std::vector<int> recommendations =
            m_recommendationEngine.recommend(userId, productId, users);

        return buildRecommendationsResponse(recommendations);
    }

    return "400 Bad Request\n";
}

std::string ClientSession::buildRecommendationsResponse(
    const std::vector<int>& recommendations
) const {
    std::ostringstream output;

    output << "200 Ok\n\n";

    for (size_t i = 0; i < recommendations.size(); i++) {
        if (i > 0) {
            output << " ";
        }

        output << recommendations[i];
    }

    output << "\n";

    return output.str();
}

bool ClientSession::sendAll(const std::string& response) const {
    const char* data = response.c_str();
    size_t totalSent = 0;

    while (totalSent < response.size()) {
        ssize_t sent = send(
            m_clientSocket,
            data + totalSent,
            response.size() - totalSent,
            0
        );

        if (sent <= 0) {
            return false;
        }

        totalSent += static_cast<size_t>(sent);
    }

    return true;
}