#pragma once

#include "CommandParser.h"
#include "RecommendationEngine.h"
#include <vector>

// handles execution of the recommend command
class RecommendCommandHandler
{
public:
    /*
    runs the recommendation command,
    calls the recommendation engine,
    and returns the recommended product ids
    */
    std::vector<int> handle(
        const Command& command,
        const std::vector<UserProducts>& users
    );
};