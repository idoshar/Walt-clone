#include <cassert>
#include <iostream>
#include <vector>
#include <set>

#include "../src/User.h"
#include "../src/UserRepository.h"

void testShouldCreateNewUserAndStoreProducts() {
    UserRepository repo;

    repo.addWatchedProducts(1, {100, 101, 102});

    assert(repo.hasUser(1));
    assert(repo.hasUserWatchedProduct(1, 100));
    assert(repo.hasUserWatchedProduct(1, 101));
    assert(repo.hasUserWatchedProduct(1, 102));
}

void testShouldStoreProductsPerUserSeparately() {
    UserRepository repo;

    repo.addWatchedProducts(1, {100, 101});
    repo.addWatchedProducts(2, {200, 201});

    assert(repo.hasUserWatchedProduct(1, 100));
    assert(repo.hasUserWatchedProduct(1, 101));
    assert(!repo.hasUserWatchedProduct(1, 200));

    assert(repo.hasUserWatchedProduct(2, 200));
    assert(repo.hasUserWatchedProduct(2, 201));
    assert(!repo.hasUserWatchedProduct(2, 100));
}

void testShouldAddProductsToExistingUser() {
    UserRepository repo;

    repo.addWatchedProducts(1, {100, 101});
    repo.addWatchedProducts(1, {102, 103});

    std::set<int> expected = {100, 101, 102, 103};
    assert(repo.getWatchedProducts(1) == expected);
}

void testShouldNotDuplicateSameProductForSameUser() {
    UserRepository repo;

    repo.addWatchedProducts(1, {100, 101});
    repo.addWatchedProducts(1, {100, 102});

    std::set<int> expected = {100, 101, 102};
    assert(repo.getWatchedProducts(1) == expected);
}

void testShouldReturnEmptySetForUnknownUser() {
    UserRepository repo;

    std::set<int> expected = {};
    assert(repo.getWatchedProducts(999) == expected);
}

void testUserObjectShouldStoreIdAndWatchedProducts() {
    User user(7);

    user.addProduct(102);
    user.addProduct(105);
    user.addProduct(102);

    assert(user.getId() == 7);
    assert(user.hasWatchedProduct(102));
    assert(user.hasWatchedProduct(105));
    assert(!user.hasWatchedProduct(999));

    std::set<int> expected = {102, 105};
    assert(user.getWatchedProducts() == expected);
}

int main() {
    testShouldCreateNewUserAndStoreProducts();
    testShouldStoreProductsPerUserSeparately();
    testShouldAddProductsToExistingUser();
    testShouldNotDuplicateSameProductForSameUser();
    testShouldReturnEmptySetForUnknownUser();
    testUserObjectShouldStoreIdAndWatchedProducts();

    std::cout << "test_add passed successfully!" << std::endl;
    return 0;
}