#ifndef USER_H
#define USER_H

#include <set>

class User {
private:
    int id;
    std::set<int> watchedProducts;

public:
    explicit User(int id);

    int getId() const;

    void addProduct(int productId);
    void removeProduct(int productId);

    bool hasWatchedProduct(int productId) const;
    bool hasNoWatchedProducts() const;

    std::set<int> getWatchedProducts() const;
};

#endif
