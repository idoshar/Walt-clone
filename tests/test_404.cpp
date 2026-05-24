#include <cassert>
#include "../src/UserRepository.h"

void testNotFoundForNonexistentUser() {
    UserRepository repo;
    
    assert(!repo.hasUser(999));
}

void testGetWatchedProductsForNonexistentUserReturnsEmpty() {
    UserRepository repo;
    
    std::set<int> products = repo.getWatchedProducts(999);
    assert(products.empty());
}

void testHasUserWatchedProductForNonexistentUserReturnsFalse() {
    UserRepository repo;
    
    assert(!repo.hasUserWatchedProduct(999, 123));
}

int main() {
    testNotFoundForNonexistentUser();
    testGetWatchedProductsForNonexistentUserReturnsEmpty();
    testHasUserWatchedProductForNonexistentUserReturnsFalse();
    
    return 0;
}