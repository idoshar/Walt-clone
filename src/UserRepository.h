#ifndef USER_REPOSITORY_H
#define USER_REPOSITORY_H

#include <map>
#include <set>
#include <vector>

#include "User.h"

struct UserProducts {
    int userId;
    std::set<int> products;
};

class UserRepository {
private:
    std::map<int, User> users;

public:
    UserRepository();

    void addWatchedProducts(int userId, const std::vector<int>& productIds);
    void removeWatchedProducts(int userId, const std::vector<int>& productIds);

    bool hasUser(int userId) const;
    bool hasUserWatchedProduct(int userId, int productId) const;
    bool hasUserWatchedAllProducts(int userId, const std::vector<int>& productIds) const;

    std::set<int> getWatchedProducts(int userId) const;

    const std::map<int, User>& getAllUsers() const;
    std::vector<UserProducts> getAllUserProducts() const;
};

#endif
