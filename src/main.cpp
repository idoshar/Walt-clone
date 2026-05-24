#include "TcpServer.h"

#include <cstdlib>
#include <exception>
#include <string>

static bool parsePortArgument(const std::string& text, int& port) {
    if (text.empty()) {
        return false;
    }

    for (char ch : text) {
        if (ch < '0' || ch > '9') {
            return false;
        }
    }

    long value = std::strtol(text.c_str(), nullptr, 10);

    if (value < 1 || value > 65535) {
        return false;
    }

    port = static_cast<int>(value);
    return true;
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        return 1;
    }

    int serverPort = 0;
    if (!parsePortArgument(argv[1], serverPort)) {
        return 1;
    }

    try {
        TcpServer server(serverPort);
        server.run();
    } catch (const std::exception&) {
        return 1;
    }

    return 0;
}
