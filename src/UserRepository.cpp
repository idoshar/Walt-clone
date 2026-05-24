#include "UserRepository.h"

UserRepository::UserRepository() {
}

void UserRepository::addWatchedProducts(int userId, const std::vector<int>& productIds) {
    if (!hasUser(userId)) {
        users.emplace(userId, User(userId));
    }

    User& user = users.at(userId);

    for (int productId : productIds) {
        user.addProduct(productId);
    }
}

void UserRepository::removeWatchedProducts(int userId, const std::vector<int>& productIds) {
    User& user = users.at(userId);

    for (int productId : productIds) {
        user.removeProduct(productId);
    }
}

bool UserRepository::hasUser(int userId) const {
    return users.find(userId) != users.end();
}

bool UserRepository::hasUserWatchedProduct(int userId, int productId) const {
    auto it = users.find(userId);

    if (it == users.end()) {
        return false;
    }

    return it->second.hasWatchedProduct(productId);
}

bool UserRepository::hasUserWatchedAllProducts(int userId, const std::vector<int>& productIds) const {
    if (!hasUser(userId)) {
        return false;
    }

    for (int productId : productIds) {
        if (!hasUserWatchedProduct(userId, productId)) {
            return false;
        }
    }

    return true;
}

std::set<int> UserRepository::getWatchedProducts(int userId) const {
    auto it = users.find(userId);

    if (it == users.end()) {
        return {};
    }

    return it->second.getWatchedProducts();
}

const std::map<int, User>& UserRepository::getAllUsers() const {
    return users;
}

std::vector<UserProducts> UserRepository::getAllUserProducts() const {
    std::vector<UserProducts> result;

    for (const auto& pair : users) {
        UserProducts up;
        up.userId = pair.first;
        up.products = pair.second.getWatchedProducts();
        result.push_back(up);
    }

    return result;
}
