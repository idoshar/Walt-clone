#include <chrono>
#include <fstream>
#include <iostream>
#include <string>
#include <thread>

#include <arpa/inet.h>
#include <netinet/in.h>
#include <signal.h>
#include <sys/socket.h>
#include <sys/wait.h>
#include <unistd.h>

static int g_passed = 0;
static int g_failed = 0;

void check(const std::string& name, const std::string& actual, const std::string& expected) {
    if (actual == expected) {
        std::cout << "PASS: " << name << std::endl;
        g_passed++;
    } else {
        std::cout << "FAIL: " << name << std::endl;
        std::cout << "Expected: [" << expected << "]" << std::endl;
        std::cout << "Actual:   [" << actual << "]" << std::endl;
        g_failed++;
    }
}

class TestClient {
public:
    explicit TestClient(int port) {
        m_socket = socket(AF_INET, SOCK_STREAM, 0);

        sockaddr_in address{};
        address.sin_family = AF_INET;
        address.sin_port = htons(port);
        inet_pton(AF_INET, "127.0.0.1", &address.sin_addr);

        connect(m_socket, reinterpret_cast<sockaddr*>(&address), sizeof(address));
    }

    ~TestClient() {
        close(m_socket);
    }

    std::string sendCommand(const std::string& command) {
        std::string fullCommand = command + "\n";
        send(m_socket, fullCommand.c_str(), fullCommand.size(), 0);

        char buffer[4096] = {0};
        ssize_t bytesRead = recv(m_socket, buffer, sizeof(buffer) - 1, 0);

        if (bytesRead <= 0) {
            return "";
        }

        return std::string(buffer, static_cast<size_t>(bytesRead));
    }

private:
    int m_socket;
};

int main() {
    std::ofstream clearFile("data/users.txt", std::ios::trunc);
    clearFile.close();

    pid_t serverPid = fork();

    if (serverPid == 0) {
        execl("./server", "server", "5555", nullptr);
        return 1;
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(700));

    TestClient client(5555);

    check("Unknown command returns 400",
          client.sendCommand("BADCOMMAND"),
          "400 Bad Request\n");

    check("Empty command returns 400",
          client.sendCommand(""),
          "400 Bad Request\n");

    check("POST missing arguments returns 400",
          client.sendCommand("POST"),
          "400 Bad Request\n");

    check("POST missing products returns 400",
          client.sendCommand("POST 1"),
          "400 Bad Request\n");

    check("POST creates new user",
          client.sendCommand("POST 1 10 20"),
          "201 Created\n");

    check("POST existing user returns 404",
          client.sendCommand("POST 1 30"),
          "404 Not Found\n");

    check("PATCH missing arguments returns 400",
          client.sendCommand("PATCH"),
          "400 Bad Request\n");

    check("PATCH missing products returns 400",
          client.sendCommand("PATCH 1"),
          "400 Bad Request\n");

    check("PATCH missing user returns 404",
          client.sendCommand("PATCH 99 10"),
          "404 Not Found\n");

    check("PATCH existing user adds product",
          client.sendCommand("PATCH 1 30"),
          "204 No Content\n");

    check("DELETE missing arguments returns 400",
          client.sendCommand("DELETE"),
          "400 Bad Request\n");

    check("DELETE missing products returns 400",
          client.sendCommand("DELETE 1"),
          "400 Bad Request\n");

    check("DELETE missing user returns 404",
          client.sendCommand("DELETE 99 10"),
          "404 Not Found\n");

    check("DELETE product not watched returns 404",
          client.sendCommand("DELETE 1 999"),
          "404 Not Found\n");

    check("DELETE existing watched product",
          client.sendCommand("DELETE 1 30"),
          "204 No Content\n");

    check("DELETE same product again returns 404",
          client.sendCommand("DELETE 1 30"),
          "404 Not Found\n");

    check("Create second user for recommendations",
          client.sendCommand("POST 2 10 40"),
          "201 Created\n");

    check("GET missing arguments returns 400",
          client.sendCommand("GET"),
          "400 Bad Request\n");

    check("GET missing product returns 400",
          client.sendCommand("GET 1"),
          "400 Bad Request\n");

    check("GET missing user returns 404",
          client.sendCommand("GET 99 10"),
          "404 Not Found\n");

    check("GET product not watched by user returns 404",
          client.sendCommand("GET 1 999"),
          "404 Not Found\n");

    check("GET recommendations success",
          client.sendCommand("GET 1 10"),
          "200 Ok\n\n40\n");

    check("help output",
          client.sendCommand("help"),
          "DELETE [userid] [productid1] [productid2] ...\n"
          "GET [userid] [productid]\n"
          "PATCH [userid] [productid1] [productid2] ...\n"
          "POST [userid] [productid1] [productid2] ...\n"
          "help\n");

    kill(serverPid, SIGTERM);
    waitpid(serverPid, nullptr, 0);

    std::cout << "\nPassed: " << g_passed << std::endl;
    std::cout << "Failed: " << g_failed << std::endl;

    return g_failed == 0 ? 0 : 1;
}