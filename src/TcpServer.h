#ifndef TCPSERVER_H
#define TCPSERVER_H

#include "RecommendationEngine.h"
#include "UserRepository.h"

#include <string>

class TcpServer {
public:
    explicit TcpServer(int port, const std::string& dataFilePath = "data/users.txt");
    void run();

private:
    int m_port;
    std::string m_dataFilePath;
    UserRepository m_userRepository;
    RecommendationEngine m_recommendationEngine;
};

#endif
