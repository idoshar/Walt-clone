#ifndef CLIENTSESSION_H
#define CLIENTSESSION_H

#include "CommandParser.h"
#include "RecommendationEngine.h"
#include "UserRepository.h"

#include <string>

class ClientSession {
public:
    ClientSession(
        int clientSocket,
        UserRepository& userRepository,
        RecommendationEngine& recommendationEngine,
        const std::string& dataFilePath
    );

    void run();

private:
    void handleClient();
    void handleLine(const std::string& line);
    std::string executeCommand(const Command& command);
    std::string buildRecommendationsResponse(const std::vector<int>& recommendations) const;
    bool sendAll(const std::string& response) const;

    int m_clientSocket;
    UserRepository& m_userRepository;
    RecommendationEngine& m_recommendationEngine;
    std::string m_dataFilePath;
    CommandParser m_parser;
};

#endif
