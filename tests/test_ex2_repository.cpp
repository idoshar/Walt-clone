#include <cassert>
#include <vector>
#include "../src/UserRepository.h"

static void testAddAndRemoveProducts() {
    UserRepository repository;
    repository.addWatchedProducts(1, std::vector<int>{100, 101, 102});

    assert(repository.hasUser(1));
    assert(repository.hasUserWatchedProduct(1, 100));
    assert(repository.hasUserWatchedAllProducts(1, std::vector<int>{100, 102}));

    repository.removeWatchedProducts(1, std::vector<int>{101});

    assert(repository.hasUser(1));
    assert(!repository.hasUserWatchedProduct(1, 101));
    assert(repository.hasUserWatchedProduct(1, 100));
}

static void testMissingProducts() {
    UserRepository repository;
    repository.addWatchedProducts(1, std::vector<int>{100});

    assert(!repository.hasUserWatchedAllProducts(1, std::vector<int>{100, 101}));
    assert(!repository.hasUserWatchedAllProducts(2, std::vector<int>{100}));
}

int main() {
    testAddAndRemoveProducts();
    testMissingProducts();
    return 0;
}
