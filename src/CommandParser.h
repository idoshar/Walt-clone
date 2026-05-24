#pragma once

#include <string>
#include <vector>

enum class CommandType {
    Post,
    Patch,
    Delete,
    Get,
    Help,
    Invalid
};

struct Command {
    CommandType type = CommandType::Invalid;
    int userId = 0;
    std::vector<int> productIds;
};

class CommandParser {
public:
    Command parseCommand(const std::string& line) const;
};
