#include "CommandParser.h"

#include <cctype>
#include <sstream>
#include <string>

static bool isPositiveNumber(const std::string& text) {
    if (text.empty()) {
        return false;
    }

    for (char ch : text) {
        if (!std::isdigit(static_cast<unsigned char>(ch))) {
            return false;
        }
    }

    return text != "0";
}

static bool parsePositiveNumber(const std::string& text, int& value) {
    if (!isPositiveNumber(text)) {
        return false;
    }

    try {
        value = std::stoi(text);
    } catch (...) {
        return false;
    }

    return value > 0;
}

static Command parseUserAndProducts(std::istringstream& stream, CommandType type) {
    Command command;
    command.type = CommandType::Invalid;

    std::string userIdText;
    if (!(stream >> userIdText)) {
        return command;
    }

    if (!parsePositiveNumber(userIdText, command.userId)) {
        return command;
    }

    std::string productIdText;
    while (stream >> productIdText) {
        int productId = 0;
        if (!parsePositiveNumber(productIdText, productId)) {
            return Command{};
        }
        command.productIds.push_back(productId);
    }

    if (command.productIds.empty()) {
        return Command{};
    }

    command.type = type;
    return command;
}

static Command parseUserAndSingleProduct(std::istringstream& stream, CommandType type) {
    Command command;
    command.type = CommandType::Invalid;

    std::string userIdText;
    std::string productIdText;
    std::string extra;

    if (!(stream >> userIdText >> productIdText)) {
        return command;
    }

    if (stream >> extra) {
        return command;
    }

    if (!parsePositiveNumber(userIdText, command.userId)) {
        return command;
    }

    int productId = 0;
    if (!parsePositiveNumber(productIdText, productId)) {
        return command;
    }

    command.type = type;
    command.productIds.push_back(productId);
    return command;
}

Command CommandParser::parseCommand(const std::string& line) const {
    Command command;

    if (line.empty()) {
        return command;
    }

    if (line.front() == ' ' || line.find('\t') != std::string::npos) {
        return command;
    }

    std::istringstream stream(line);
    std::string commandName;
    stream >> commandName;

    if (commandName == "help") {
        std::string extra;
        if (stream >> extra || line != "help") {
            return command;
        }
        command.type = CommandType::Help;
        return command;
    }

    if (commandName == "POST") {
        return parseUserAndProducts(stream, CommandType::Post);
    }

    if (commandName == "PATCH") {
        return parseUserAndProducts(stream, CommandType::Patch);
    }

    if (commandName == "DELETE") {
        return parseUserAndProducts(stream, CommandType::Delete);
    }

    if (commandName == "GET") {
        return parseUserAndSingleProduct(stream, CommandType::Get);
    }

    return command;
}
