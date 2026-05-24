#include "RecommendCommandHandler.h"

/*
runs the recommend command,
extracts user id and product id from the parsed command,
calls the recommendation engine,
and returns the recommendation result
*/
std::vector<int> RecommendCommandHandler::handle(
    const Command& command,
    const std::vector<UserProducts>& users
)
{
    std::vector<int> emptyResult;

    // validate that this is a recommend command
    if (command.type != CommandType::Recommend)
    {
        return emptyResult;
    }

    // validate that the command has exactly one product id
    if (command.productIds.size() != 1)
    {
        return emptyResult;
    }

    RecommendationEngine engine;

    int userId = command.userId;
    int productId = command.productIds[0];

    return engine.recommend(userId, productId, users);
}