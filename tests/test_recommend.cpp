#include <cassert>
#include <iostream>
#include <vector>

#include "../src/RecommendationEngine.h"

static std::vector<UserProducts> createExampleUsers() {
    return {
        {1, {100, 101, 102, 103}},
        {2, {101, 102, 104, 105, 106}},
        {3, {100, 104, 105, 107, 108}},
        {4, {101, 105, 106, 107, 109, 110}},
        {5, {100, 102, 103, 105, 108, 111}},
        {6, {100, 103, 104, 110, 111, 112, 113}},
        {7, {102, 105, 106, 107, 108, 109, 110}},
        {8, {101, 104, 105, 106, 109, 111, 114}},
        {9, {100, 103, 105, 107, 112, 113, 115}},
        {10, {100, 102, 105, 106, 107, 109, 110, 116}}
    };
}

static bool hasUserWatchedProduct(
    const std::vector<UserProducts>& users,
    int userId,
    int productId
) {
    for (const UserProducts& user : users) {
        if (user.userId == userId) {
            return user.products.find(productId) != user.products.end();
        }
    }

    return false;
}

void testShouldReturnExampleRecommendationsInCorrectOrder() {
    std::vector<UserProducts> users = createExampleUsers();
    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(1, 104, users);

    std::vector<int> expected = {
        105, 106, 111, 110, 112, 113, 107, 108, 109, 114
    };

    assert(result == expected);
}

void testShouldReturnAtMostTenRecommendations() {
    std::vector<UserProducts> users = createExampleUsers();
    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(1, 104, users);

    assert(result.size() <= 10);
}

void testShouldNotRecommendProductsAlreadyWatchedByTargetUser() {
    std::vector<UserProducts> users = createExampleUsers();
    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(1, 104, users);

    for (int productId : result) {
        assert(!hasUserWatchedProduct(users, 1, productId));
    }
}

void testShouldNotRecommendTheRequestedProductItself() {
    std::vector<UserProducts> users = createExampleUsers();
    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(1, 104, users);

    for (int productId : result) {
        assert(productId != 104);
    }
}

void testShouldReturnEmptyVectorWhenUserDoesNotExist() {
    std::vector<UserProducts> users = createExampleUsers();
    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(999, 104, users);

    assert(result.empty());
}

void testShouldReturnEmptyVectorWhenNoOtherUserWatchedRequestedProduct() {
    std::vector<UserProducts> users = {
        {1, {100, 101}},
        {2, {100, 102}},
        {3, {101, 103}}
    };

    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(1, 999, users);

    assert(result.empty());
}

void testShouldSortSameScoreProductsByAscendingProductId() {
    std::vector<UserProducts> users = {
        {1, {10}},
        {2, {10, 50, 30, 20}},
        {3, {10, 50, 30, 20}}
    };

    RecommendationEngine recommender;

    std::vector<int> result = recommender.recommend(1, 10, users);

    std::vector<int> expected = {20, 30, 50};

    assert(result == expected);
}

int main() {
    testShouldReturnExampleRecommendationsInCorrectOrder();
    testShouldReturnAtMostTenRecommendations();
    testShouldNotRecommendProductsAlreadyWatchedByTargetUser();
    testShouldNotRecommendTheRequestedProductItself();
    testShouldReturnEmptyVectorWhenUserDoesNotExist();
    testShouldReturnEmptyVectorWhenNoOtherUserWatchedRequestedProduct();
    testShouldSortSameScoreProductsByAscendingProductId();

    std::cout << "test_recommend passed successfully!" << std::endl;
    return 0;
}
