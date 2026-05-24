#include "User.h"

User::User(int id) : id(id) {
}

int User::getId() const {
    return id;
}

void User::addProduct(int productId) {
    watchedProducts.insert(productId);
}

void User::removeProduct(int productId) {
    watchedProducts.erase(productId);
}

bool User::hasWatchedProduct(int productId) const {
    return watchedProducts.find(productId) != watchedProducts.end();
}

bool User::hasNoWatchedProducts() const {
    return watchedProducts.empty();
}

std::set<int> User::getWatchedProducts() const {
    return watchedProducts;
}
