/*generates recommendations using similar users,
sums similarity scores for candidate products,
sorts by score descending and product id ascending,
and returns up to 10 recommended products
*/
#include "RecommendationEngine.h"
#include <algorithm>

//calculates similarity by counting common watched products
int RecommendationEngine::calculateSimilarity(
    const std::set<int>& firstUserProducts,
    const std::set<int>& secondUserProducts
)
{
    int similarity = 0;
    for(int product : firstUserProducts){
        if(secondUserProducts.find(product) != secondUserProducts.end()){
            similarity++;
        }
    }
    return similarity;
}
//finds the index of a product inside the score vector
int RecommendationEngine::findProductScoreIndex(
    const std::vector<std::pair<int, int>>& productScores,
    int productId
)
{
    for(int i = 0; i < static_cast<int>(productScores.size()); i++){
        if(productScores[i].first == productId){
            return i;
        }
    }
    return -1;
}
//generates product recommendations for a given user and product
std::vector<int> RecommendationEngine::recommend(
    int userId,
    int productId,
    const std::vector<UserProducts>& users
)
{
    std::vector<int> recommendations;
    const UserProducts* currentUser = nullptr;
    //find the current user
    for(const UserProducts& user : users){
        if(user.userId == userId){
            currentUser = &user;
            break;
        }
    }
    //return empty result if the user does not exist
    if(currentUser == nullptr){
        return recommendations;
    }
    std::vector<std::pair<int, int>> productScores;
    //go over all other users
    for(const UserProducts& otherUser : users){
        if(otherUser.userId == userId){
            continue;
        }
        //use only users who watched the requested product
        if(otherUser.products.find(productId) == otherUser.products.end()){
            continue;
        }
        int similarity = calculateSimilarity(currentUser->products, otherUser.products);
        if(similarity == 0){
            continue;
        }

        //score candidate products based on similarity
        for(int candidateProduct : otherUser.products){
            if(candidateProduct == productId){
                continue;
            }
        
            if(currentUser->products.find(candidateProduct) != currentUser->products.end()){
                continue;
            }
            int scoreIndex = findProductScoreIndex(productScores, candidateProduct);
            if(scoreIndex == -1){
                productScores.push_back({candidateProduct, similarity});
            }
            else{
                productScores[scoreIndex].second += similarity;
            }
        }
    }
    //sort by score descending, then product id ascending
    std::sort(
        productScores.begin(),
        productScores.end(),
        [](const std::pair<int, int>& first, const std::pair<int, int>& second)
        {
            if(first.second != second.second){
                return first.second > second.second;
            }
            return first.first < second.first;
        }
    );
    //return up to 10 recommendations
    for(const auto& productScore : productScores){
        if(recommendations.size() == 10){
            break;
        }
        recommendations.push_back(productScore.first);
    }
    return recommendations;
}