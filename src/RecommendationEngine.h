#pragma once
#include <set>
#include <vector>

//represents one user and the products watched by that user
#include "UserRepository.h"
//handles product recommendation logic
class RecommendationEngine{
public:
    //returns recommended product ids for a user and a target product
    std::vector<int> recommend(
        int userId,
        int productId,
        const std::vector<UserProducts>& users
    );
private:
    //calculates similarity by counting common watched products
    int calculateSimilarity(
        const std::set<int>& firstUserProducts,
        const std::set<int>& secondUserProducts
    );

    //finds the score index of a product inside a vector
    int findProductScoreIndex(
        const std::vector<std::pair<int, int>>& productScores,
        int productId
    );
};